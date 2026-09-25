import io
import csv
from datetime import date, datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response, Query, status
from sqlalchemy.orm import Session
import pandas as pd

from app.core.database import get_db
from app.models.record import DailyRecord
from app.models.menu import MenuItem
from app.models.user import User
from app.schemas.record import (
    DailyRecordCreate, 
    DailyRecordUpdate, 
    DailyRecordResponse, 
    CSVImportResult
)
from app.api.auth import get_current_user

router = APIRouter(prefix="/records", tags=["Daily Records Management"])

def _calculate_impact(record_data: dict, item: MenuItem):
    """Compute waste percentage, monetary cost loss, and carbon impact."""
    prep = record_data.get("prepared_qty", 0.0)
    consumed = record_data.get("consumed_qty", 0.0)
    waste = record_data.get("waste_qty", max(0.0, prep - consumed))
    
    waste_pct = round((waste / prep * 100.0) if prep > 0 else 0.0, 2)
    cost_lost = round(waste * (item.cost_per_portion if item else 2.50), 2)
    
    # Portions to kg: portion_size_g / 1000 * waste portions
    portion_kg = (item.portion_size_g if item else 350.0) / 1000.0
    co2_kg = round(waste * portion_kg * (item.co2_per_kg if item else 2.1), 2)
    
    return waste_pct, cost_lost, co2_kg

@router.get("", response_model=List[DailyRecordResponse])
def get_records(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    meal_type: Optional[str] = None,
    menu_item_id: Optional[int] = None,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(DailyRecord)
    if start_date:
        query = query.filter(DailyRecord.date >= start_date)
    if end_date:
        query = query.filter(DailyRecord.date <= end_date)
    if meal_type:
        query = query.filter(DailyRecord.meal_type == meal_type)
    if menu_item_id:
        query = query.filter(DailyRecord.menu_item_id == menu_item_id)
        
    return query.order_by(DailyRecord.date.desc(), DailyRecord.id.desc()).offset(offset).limit(limit).all()

@router.get("/{record_id}", response_model=DailyRecordResponse)
def get_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(DailyRecord).filter(DailyRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Daily record not found")
    return record

@router.post("", response_model=DailyRecordResponse, status_code=status.HTTP_201_CREATED)
def create_record(
    record_in: DailyRecordCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(MenuItem).filter(MenuItem.id == record_in.menu_item_id).first()
    if not item:
        raise HTTPException(status_code=400, detail=f"Menu item id {record_in.menu_item_id} not found")
        
    waste_pct, cost_lost, co2_kg = _calculate_impact(record_in.model_dump(), item)
    
    new_record = DailyRecord(
        date=record_in.date,
        meal_type=record_in.meal_type,
        menu_item_id=record_in.menu_item_id,
        prepared_qty=record_in.prepared_qty,
        consumed_qty=record_in.consumed_qty,
        waste_qty=record_in.waste_qty,
        waste_pct=waste_pct,
        attendance_expected=record_in.attendance_expected,
        attendance_actual=record_in.attendance_actual,
        is_holiday=record_in.is_holiday,
        special_event=record_in.special_event,
        weather_condition=record_in.weather_condition,
        temperature_c=record_in.temperature_c,
        cost_lost=cost_lost,
        co2_impact_kg=co2_kg,
        notes=record_in.notes,
        is_verified=record_in.is_verified
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record

@router.put("/{record_id}", response_model=DailyRecordResponse)
def update_record(
    record_id: int, 
    record_in: DailyRecordUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = db.query(DailyRecord).filter(DailyRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Daily record not found")
        
    update_data = record_in.model_dump(exclude_unset=True)
    item_id = update_data.get("menu_item_id", record.menu_item_id)
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    
    for field, val in update_data.items():
        setattr(record, field, val)
        
    # Recompute impacts
    waste_pct, cost_lost, co2_kg = _calculate_impact({
        "prepared_qty": record.prepared_qty,
        "consumed_qty": record.consumed_qty,
        "waste_qty": record.waste_qty
    }, item)
    
    record.waste_pct = waste_pct
    record.cost_lost = cost_lost
    record.co2_impact_kg = co2_kg
    
    db.commit()
    db.refresh(record)
    return record

@router.delete("/{record_id}")
def delete_record(
    record_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = db.query(DailyRecord).filter(DailyRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Daily record not found")
        
    db.delete(record)
    db.commit()
    return {"message": "Daily record deleted successfully"}

@router.post("/import-csv", response_model=CSVImportResult)
async def import_records_csv(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(('.csv', '.CSV')):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
        
    content = await file.read()
    decoded = content.decode("utf-8-sig")
    csv_reader = csv.DictReader(io.StringIO(decoded))
    
    menu_items = {item.name.lower().strip(): item for item in db.query(MenuItem).all()}
    menu_items_by_id = {item.id: item for item in db.query(MenuItem).all()}
    
    total = 0
    imported = 0
    skipped = 0
    errors = []
    
    for row_idx, row in enumerate(csv_reader, start=2):
        total += 1
        try:
            # Handle menu item resolution by ID or Name
            item = None
            if "menu_item_id" in row and row["menu_item_id"]:
                item = menu_items_by_id.get(int(row["menu_item_id"]))
            elif "menu_item_name" in row and row["menu_item_name"]:
                item = menu_items.get(row["menu_item_name"].lower().strip())
                
            if not item:
                # Create a placeholder menu item if not present
                item_name = row.get("menu_item_name", f"Menu Item #{total}")
                item = MenuItem(name=item_name, category=row.get("meal_type", "Lunch"))
                db.add(item)
                db.commit()
                db.refresh(item)
                menu_items[item_name.lower().strip()] = item
                menu_items_by_id[item.id] = item
                
            record_date = datetime.strptime(row["date"].strip(), "%Y-%m-%d").date()
            prep = float(row.get("prepared_qty", 0))
            consumed = float(row.get("consumed_qty", 0))
            waste = float(row.get("waste_qty", max(0.0, prep - consumed)))
            attendance = int(row.get("attendance", row.get("attendance_expected", 500)))
            is_holiday = str(row.get("is_holiday", "false")).strip().lower() in ("true", "1", "yes")
            weather = row.get("weather_condition", "Sunny").strip()
            temp = float(row.get("temperature_c", 24.0))
            notes = row.get("notes", None)
            
            waste_pct, cost_lost, co2_kg = _calculate_impact({
                "prepared_qty": prep,
                "consumed_qty": consumed,
                "waste_qty": waste
            }, item)
            
            rec = DailyRecord(
                date=record_date,
                meal_type=row.get("meal_type", "Lunch").strip(),
                menu_item_id=item.id,
                prepared_qty=prep,
                consumed_qty=consumed,
                waste_qty=waste,
                waste_pct=waste_pct,
                attendance_expected=attendance,
                attendance_actual=attendance,
                is_holiday=is_holiday,
                special_event=row.get("special_event", "None"),
                weather_condition=weather,
                temperature_c=temp,
                cost_lost=cost_lost,
                co2_impact_kg=co2_kg,
                notes=notes,
                is_verified=True
            )
            db.add(rec)
            imported += 1
        except Exception as e:
            skipped += 1
            errors.append(f"Row {row_idx}: {str(e)}")
            
    db.commit()
    return {
        "total_rows": total,
        "imported_count": imported,
        "skipped_count": skipped,
        "errors": errors[:10]  # Return first 10 errors for brevity
    }

@router.get("/export-csv")
def export_records_csv(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    query = db.query(DailyRecord)
    if start_date:
        query = query.filter(DailyRecord.date >= start_date)
    if end_date:
        query = query.filter(DailyRecord.date <= end_date)
        
    records = query.order_by(DailyRecord.date.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "id", "date", "meal_type", "menu_item_id", "menu_item_name", "category",
        "prepared_qty", "consumed_qty", "waste_qty", "waste_pct",
        "attendance_expected", "attendance_actual", "is_holiday",
        "weather_condition", "temperature_c", "cost_lost", "co2_impact_kg", "notes"
    ])
    
    for r in records:
        writer.writerow([
            r.id,
            r.date.isoformat(),
            r.meal_type,
            r.menu_item_id,
            r.menu_item.name if r.menu_item else "",
            r.menu_item.category.value if r.menu_item and hasattr(r.menu_item.category, 'value') else (r.menu_item.category if r.menu_item else ""),
            r.prepared_qty,
            r.consumed_qty,
            r.waste_qty,
            r.waste_pct,
            r.attendance_expected,
            r.attendance_actual,
            r.is_holiday,
            r.weather_condition,
            r.temperature_c,
            r.cost_lost,
            r.co2_impact_kg,
            r.notes or ""
        ])
        
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=canteen_waste_records_{date.today().isoformat()}.csv"}
    )

@router.get("/template-csv")
def get_template_csv():
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "date", "meal_type", "menu_item_name", "prepared_qty", "consumed_qty",
        "waste_qty", "attendance", "is_holiday", "weather_condition", "temperature_c", "notes"
    ])
    writer.writerow([
        "2026-09-25", "Lunch", "Grilled Chicken Rice Bowl", "250", "220", "30", "550", "false", "Sunny", "26.5", "Standard weekday lunch"
    ])
    writer.writerow([
        "2026-09-25", "Lunch", "Mediterranean Veggie Pasta", "180", "165", "15", "550", "false", "Sunny", "26.5", "Vegetarian option"
    ])
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=canteen_records_template.csv"}
    )
