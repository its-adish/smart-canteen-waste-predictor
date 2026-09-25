from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

class FeatureImportanceItem(BaseModel):
    feature: str
    display_name: str
    importance: float
    shap_value: float
    description: str

class ModelTrainRequest(BaseModel):
    algorithm: str = "RandomForest" # RandomForest, GradientBoosting, LinearRegression
    test_size: float = 0.2
    tune_hyperparameters: bool = False

class ModelEvaluationMetrics(BaseModel):
    model_name: str
    target: str
    algorithm: str
    dataset_rows: int
    train_rows: int
    test_rows: int
    mae: float
    rmse: float
    r2: float
    explained_variance: float

class ModelTrainResponse(BaseModel):
    status: str
    message: str
    demand_metrics: ModelEvaluationMetrics
    waste_metrics: ModelEvaluationMetrics
    top_features: List[FeatureImportanceItem]
    trained_at: datetime

class ModelSummaryResponse(BaseModel):
    active_algorithm: str
    last_trained: Optional[datetime] = None
    dataset_size: int
    demand_mae: float
    demand_r2: float
    waste_mae: float
    waste_r2: float
    feature_importances: List[FeatureImportanceItem]
    historical_evaluations: List[Dict[str, Any]]
