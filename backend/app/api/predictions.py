from datetime import date, datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.prediction import DailyPrediction
from app.models.menu import MenuItem
from app.models.record import DailyRecord
from app.models.user import User
from app.schemas.prediction import (
    BatchPredictionRequest, 
    SinglePredictionRequest, 
    PredictionItemResult, 
    PredictionResponse
)
from app.ml.pipeline import ml_pipeline
from app.api.auth import get_current_user

router = APIRouter(prefix="/predictions", tags=["Predictions & Recommendations Engine"])

def _get_historical_stats(db: Session) -> dict:
    """Fetch item-level baseline averages from recent daily records."""
    records = db.query(DailyRecord).order_by(DailyRecord.date.desc()).limit(500).all()
    stats = {}
    for r in records:
        if r.menu_item_id not in stats:
            stats[r.menu_item_id] = {"demands": [], "wastes": []}
        stats[r.menu_item_id]["demands"].append(r.consumed_qty)
        stats[r.menu_item_id]["wastes"].append(r.waste_qty)
        
    out = {}
    for item_id, data in stats.items():
        out[item_id] = {
            "avg_demand": float(sum(data["demands"]) / len(data["demands"])) if data["demands"] else 150.0,
            "avg_waste": float(sum(data["wastes"]) / len(data["wastes"])) if data["wastes"] else 15.0,
            "lag_7d": float(data["demands"][0]) if data["demands"] else 150.0
        }
    return out

@router.post("/batch", response_model=PredictionResponse)
def generate_batch_prediction(
    request: BatchPredictionRequest, 
    db: Session = Depends(get_db)
):
    if not request.menu_item_ids:
        raise HTTPException(status_code=400, detail="Please select at least one menu item")
        
    menu_items = db.query(MenuItem).filter(MenuItem.id.in_(request.menu_item_ids)).all()
    if not menu_items:
        raise HTTPException(status_code=404, detail="Selected menu items not found")
        
    hist_stats = _get_historical_stats(db)
    
    results: List[PredictionItemResult] = []
    total_prep = 0.0
    total_demand = 0.0
    total_waste = 0.0
    total_cost = 0.0
    total_waste_cost = 0.0
    total_co2 = 0.0
    conf_scores = []
    
    for item in menu_items:
        cat_str = item.category.value if hasattr(item.category, "value") else str(item.category)
        input_data = {
            "date": request.prediction_date,
            "meal_type": request.meal_type,
            "category": cat_str,
            "menu_item_id": item.id,
            "portion_size_g": item.portion_size_g,
            "cost_per_portion": item.cost_per_portion,
            "attendance": request.attendance_forecast,
            "is_holiday": request.is_holiday,
            "weather_forecast": request.weather_forecast,
            "temperature_forecast": request.temperature_forecast,
        }
        
        pred = ml_pipeline.predict(
            record_input=input_data,
            safety_buffer_pct=request.safety_buffer_pct,
            hist_stats=hist_stats
        )
        
        # Calculate impact metrics
        est_cost = round(pred["recommended_prep_qty"] * item.cost_per_portion, 2)
        est_waste_cost = round(pred["predicted_waste"] * item.cost_per_portion, 2)
        portion_kg = item.portion_size_g / 1000.0
        est_co2 = round(pred["predicted_waste"] * portion_kg * item.co2_per_kg, 2)
        
        item_res = PredictionItemResult(
            prediction_date=request.prediction_date,
            meal_type=request.meal_type,
            menu_item_id=item.id,
            menu_item_name=item.name,
            menu_item_category=cat_str,
            unit_cost=item.cost_per_portion,
            predicted_demand=pred["predicted_demand"],
            predicted_waste=pred["predicted_waste"],
            recommended_prep_qty=pred["recommended_prep_qty"],
            safety_buffer_pct=request.safety_buffer_pct,
            confidence_score=pred["confidence_score"],
            lower_bound=pred["lower_bound"],
            upper_bound=pred["upper_bound"],
            risk_level=pred["risk_level"],
            estimated_cost=est_cost,
            estimated_waste_cost=est_waste_cost,
            estimated_co2_kg=est_co2,
            model_version=pred["model_version"]
        )
        
        results.append(item_res)
        total_prep += pred["recommended_prep_qty"]
        total_demand += pred["predicted_demand"]
        total_waste += pred["predicted_waste"]
        total_cost += est_cost
        total_waste_cost += est_waste_cost
        total_co2 += est_co2
        conf_scores.append(pred["confidence_score"])
        
    avg_conf = round(sum(conf_scores) / len(conf_scores), 2) if conf_scores else 0.85
    
    return PredictionResponse(
        prediction_date=request.prediction_date,
        meal_type=request.meal_type,
        total_recommended_qty=round(total_prep, 1),
        total_estimated_demand=round(total_demand, 1),
        total_expected_waste=round(total_waste, 1),
        avg_confidence_score=avg_conf,
        total_cost=round(total_cost, 2),
        total_waste_cost=round(total_waste_cost, 2),
        total_co2_kg=round(total_co2, 2),
        items=results
    )

@router.post("/save-plan")
def save_prediction_plan(
    plan: PredictionResponse, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save generated predictions into the database for kitchen execution and subsequent actuals feedback."""
    saved_ids = []
    for item in plan.items:
        # Check if already exists for this date, meal and item
        existing = db.query(DailyPrediction).filter(
            DailyPrediction.prediction_date == item.prediction_date,
            DailyPrediction.meal_type == item.meal_type,
            DailyPrediction.menu_item_id == item.menu_item_id
        ).first()
        
        if existing:
            existing.predicted_demand = item.predicted_demand
            existing.predicted_waste = item.predicted_waste
            existing.recommended_prep_qty = item.recommended_prep_qty
            existing.safety_buffer_pct = item.safety_buffer_pct
            existing.confidence_score = item.confidence_score
            existing.lower_bound = item.lower_bound
            existing.upper_bound = item.upper_bound
            existing.risk_level = item.risk_level
            existing.model_version = item.model_version
            saved_ids.append(existing.id)
        else:
            new_pred = DailyPrediction(
                prediction_date=item.prediction_date,
                meal_type=item.meal_type,
                menu_item_id=item.menu_item_id,
                predicted_demand=item.predicted_demand,
                predicted_waste=item.predicted_waste,
                recommended_prep_qty=item.recommended_prep_qty,
                safety_buffer_pct=item.safety_buffer_pct,
                confidence_score=item.confidence_score,
                lower_bound=item.lower_bound,
                upper_bound=item.upper_bound,
                risk_level=item.risk_level,
                model_version=item.model_version
            )
            db.add(new_pred)
            db.flush()
            saved_ids.append(new_pred.id)
            
    db.commit()
    return {"message": f"Successfully published {len(saved_ids)} dish recommendations to kitchen schedule", "ids": saved_ids}

@router.get("/history")
def get_prediction_history(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(DailyPrediction)
    if start_date:
        query = query.filter(DailyPrediction.prediction_date >= start_date)
    if end_date:
        query = query.filter(DailyPrediction.prediction_date <= end_date)
        
    predictions = query.order_by(DailyPrediction.prediction_date.desc(), DailyPrediction.id.desc()).limit(limit).all()
    
    out = []
    for p in predictions:
        item = p.menu_item
        cat_str = item.category.value if item and hasattr(item.category, "value") else (item.category if item else "Lunch")
        out.append({
            "id": p.id,
            "prediction_date": p.prediction_date.isoformat(),
            "meal_type": p.meal_type,
            "menu_item_id": p.menu_item_id,
            "menu_item_name": item.name if item else "Unknown",
            "menu_item_category": cat_str,
            "unit_cost": item.cost_per_portion if item else 2.5,
            "predicted_demand": p.predicted_demand,
            "predicted_waste": p.predicted_waste,
            "recommended_prep_qty": p.recommended_prep_qty,
            "safety_buffer_pct": p.safety_buffer_pct,
            "confidence_score": p.confidence_score,
            "lower_bound": p.lower_bound,
            "upper_bound": p.upper_bound,
            "risk_level": p.risk_level,
            "actual_consumed": p.actual_consumed,
            "actual_waste": p.actual_waste,
            "feedback_submitted": p.feedback_submitted,
            "model_version": p.model_version
        })
    return out
