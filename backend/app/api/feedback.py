from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.prediction import DailyPrediction
from app.models.record import DailyRecord
from app.models.menu import MenuItem
from app.models.user import User
from app.schemas.prediction import FeedbackSubmitRequest
from app.api.auth import get_current_user

router = APIRouter(prefix="/feedback", tags=["Feedback & Retraining Loop"])

@router.get("/pending")
def get_pending_feedback_predictions(db: Session = Depends(get_db)):
    """Retrieve predictions that have not had actual outcomes recorded yet."""
    preds = db.query(DailyPrediction).filter(
        DailyPrediction.feedback_submitted == False
    ).order_by(DailyPrediction.prediction_date.desc()).limit(100).all()
    
    out = []
    for p in preds:
        item = p.menu_item
        out.append({
            "id": p.id,
            "prediction_date": p.prediction_date.isoformat(),
            "meal_type": p.meal_type,
            "menu_item_id": p.menu_item_id,
            "menu_item_name": item.name if item else "Unknown",
            "category": item.category.value if item and hasattr(item.category, 'value') else (item.category if item else "Lunch"),
            "predicted_demand": p.predicted_demand,
            "predicted_waste": p.predicted_waste,
            "recommended_prep_qty": p.recommended_prep_qty,
            "confidence_score": p.confidence_score,
            "feedback_submitted": p.feedback_submitted
        })
    return out

@router.post("/submit")
def submit_actual_feedback(
    feedback: FeedbackSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Log actual consumed and leftover quantities for a prediction, updating the master dataset for future retraining."""
    pred = db.query(DailyPrediction).filter(DailyPrediction.id == feedback.prediction_id).first()
    if not pred:
        raise HTTPException(status_code=404, detail="Prediction record not found")
        
    pred.actual_consumed = feedback.actual_consumed
    pred.actual_waste = feedback.actual_waste
    pred.feedback_submitted = True
    
    item = db.query(MenuItem).filter(MenuItem.id == pred.menu_item_id).first()
    prep_qty = pred.recommended_prep_qty
    waste_pct = round((feedback.actual_waste / prep_qty * 100.0) if prep_qty > 0 else 0.0, 2)
    cost_lost = round(feedback.actual_waste * (item.cost_per_portion if item else 2.5), 2)
    portion_kg = (item.portion_size_g if item else 350.0) / 1000.0
    co2_kg = round(feedback.actual_waste * portion_kg * (item.co2_per_kg if item else 2.1), 2)
    
    # Check if a daily record already exists for this date, meal and item
    existing_rec = db.query(DailyRecord).filter(
        DailyRecord.date == pred.prediction_date,
        DailyRecord.meal_type == pred.meal_type,
        DailyRecord.menu_item_id == pred.menu_item_id
    ).first()
    
    if existing_rec:
        existing_rec.prepared_qty = prep_qty
        existing_rec.consumed_qty = feedback.actual_consumed
        existing_rec.waste_qty = feedback.actual_waste
        existing_rec.waste_pct = waste_pct
        existing_rec.cost_lost = cost_lost
        existing_rec.co2_impact_kg = co2_kg
        existing_rec.is_verified = True
        if feedback.notes:
            existing_rec.notes = feedback.notes
    else:
        new_record = DailyRecord(
            date=pred.prediction_date,
            meal_type=pred.meal_type,
            menu_item_id=pred.menu_item_id,
            prepared_qty=prep_qty,
            consumed_qty=feedback.actual_consumed,
            waste_qty=feedback.actual_waste,
            waste_pct=waste_pct,
            attendance_expected=pred.attendance_forecast,
            attendance_actual=pred.attendance_forecast,
            is_holiday=pred.is_holiday,
            weather_condition=pred.weather_forecast,
            temperature_c=pred.temperature_forecast,
            cost_lost=cost_lost,
            co2_impact_kg=co2_kg,
            notes=feedback.notes,
            is_verified=True
        )
        db.add(new_record)
        
    db.commit()
    return {
        "status": "success",
        "message": f"Actuals logged successfully for {item.name if item else 'dish'}. Record linked to model retraining pool.",
        "prediction_id": pred.id
    }
