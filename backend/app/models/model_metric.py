from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from app.core.database import Base

class ModelTrainingLog(Base):
    __tablename__ = "model_training_logs"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String, nullable=False) # e.g. "Demand Predictor", "Waste Predictor"
    target_variable = Column(String, nullable=False) # "demand", "waste"
    algorithm = Column(String, nullable=False) # "RandomForest", "GradientBoosting", "LinearRegression"
    dataset_rows = Column(Integer, nullable=False)
    mae = Column(Float, nullable=False)
    rmse = Column(Float, nullable=False)
    r2 = Column(Float, nullable=False)
    feature_importance_json = Column(Text, nullable=True) # JSON array of {feature, importance, shap_value}
    trained_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_active = Column(Boolean, default=True)
