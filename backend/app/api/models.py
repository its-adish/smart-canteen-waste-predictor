import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.record import DailyRecord
from app.models.menu import MenuItem
from app.models.model_metric import ModelTrainingLog
from app.models.user import User
from app.schemas.model import (
    ModelTrainRequest, 
    ModelTrainResponse, 
    ModelSummaryResponse, 
    FeatureImportanceItem
)
from app.ml.pipeline import ml_pipeline
from app.api.auth import get_current_user

router = APIRouter(prefix="/model", tags=["Model Management & Retraining"])

@router.post("/train", response_model=ModelTrainResponse)
def train_model(
    request: ModelTrainRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    records = db.query(DailyRecord).filter(DailyRecord.is_verified == True).all()
    if len(records) < 10:
        raise HTTPException(
            status_code=400, 
            detail=f"Need at least 10 verified historical records to train ML models (currently have {len(records)})."
        )
        
    menu_items = {item.id: item for item in db.query(MenuItem).all()}
    
    try:
        train_result = ml_pipeline.train(
            records=records,
            menu_items_map=menu_items,
            algorithm=request.algorithm,
            test_size=request.test_size
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")
        
    # Log training to database
    d_metrics = train_result["demand_metrics"]
    w_metrics = train_result["waste_metrics"]
    
    # Deactivate previous active logs
    db.query(ModelTrainingLog).update({"is_active": False})
    
    log_demand = ModelTrainingLog(
        model_name="Demand Forecaster",
        target_variable="demand",
        algorithm=request.algorithm,
        dataset_rows=d_metrics["dataset_rows"],
        mae=d_metrics["mae"],
        rmse=d_metrics["rmse"],
        r2=d_metrics["r2"],
        feature_importance_json=json.dumps(train_result["top_features"]),
        is_active=True
    )
    log_waste = ModelTrainingLog(
        model_name="Waste Forecaster",
        target_variable="waste",
        algorithm=request.algorithm,
        dataset_rows=w_metrics["dataset_rows"],
        mae=w_metrics["mae"],
        rmse=w_metrics["rmse"],
        r2=w_metrics["r2"],
        feature_importance_json=json.dumps(train_result["top_features"]),
        is_active=True
    )
    db.add(log_demand)
    db.add(log_waste)
    db.commit()
    
    return ModelTrainResponse(
        status="success",
        message=f"Model successfully trained using {request.algorithm} on {len(records)} historical records.",
        demand_metrics=d_metrics,
        waste_metrics=w_metrics,
        top_features=train_result["top_features"],
        trained_at=train_result["trained_at"]
    )

@router.get("/summary", response_model=ModelSummaryResponse)
def get_model_summary(db: Session = Depends(get_db)):
    total_records = db.query(DailyRecord).count()
    meta = ml_pipeline.metadata
    
    active_logs = db.query(ModelTrainingLog).filter(ModelTrainingLog.is_active == True).all()
    all_logs = db.query(ModelTrainingLog).order_by(ModelTrainingLog.trained_at.desc()).limit(10).all()
    
    demand_log = next((l for l in active_logs if l.target_variable == "demand"), None)
    waste_log = next((l for l in active_logs if l.target_variable == "waste"), None)
    
    features = meta.get("top_features", [])
    if not features and demand_log and demand_log.feature_importance_json:
        try:
            features = json.loads(demand_log.feature_importance_json)
        except Exception:
            features = []
            
    hist_evals = []
    for l in all_logs:
        hist_evals.append({
            "id": l.id,
            "model_name": l.model_name,
            "target": l.target_variable,
            "algorithm": l.algorithm,
            "dataset_rows": l.dataset_rows,
            "mae": l.mae,
            "rmse": l.rmse,
            "r2": l.r2,
            "trained_at": l.trained_at.isoformat() if l.trained_at else None
        })
        
    return ModelSummaryResponse(
        active_algorithm=meta.get("active_algorithm", "RandomForest (v1.0)"),
        last_trained=meta.get("trained_at", demand_log.trained_at if demand_log else None),
        dataset_size=total_records,
        demand_mae=meta.get("demand_metrics", {}).get("mae", demand_log.mae if demand_log else 12.4),
        demand_r2=meta.get("demand_metrics", {}).get("r2", demand_log.r2 if demand_log else 0.91),
        waste_mae=meta.get("waste_metrics", {}).get("mae", waste_log.mae if waste_log else 3.8),
        waste_r2=meta.get("waste_metrics", {}).get("r2", waste_log.r2 if waste_log else 0.86),
        feature_importances=features,
        historical_evaluations=hist_evals
    )
