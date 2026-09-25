from datetime import datetime, date, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base

class DailyPrediction(Base):
    __tablename__ = "daily_predictions"

    id = Column(Integer, primary_key=True, index=True)
    prediction_date = Column(Date, index=True, nullable=False)
    meal_type = Column(String, index=True, nullable=False)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    
    # Model predictions
    predicted_demand = Column(Float, nullable=False)
    predicted_waste = Column(Float, nullable=False)
    recommended_prep_qty = Column(Float, nullable=False)
    safety_buffer_pct = Column(Float, default=5.0)  # e.g. 5%
    confidence_score = Column(Float, default=0.90)  # 0 to 1.0 (90%)
    lower_bound = Column(Float, nullable=False)
    upper_bound = Column(Float, nullable=False)
    risk_level = Column(String, default="Low")     # Low, Moderate, High
    
    # Context inputs used for prediction
    attendance_forecast = Column(Integer, default=500)
    is_holiday = Column(Boolean, default=False)
    weather_forecast = Column(String, default="Sunny")
    temperature_forecast = Column(Float, default=24.0)
    model_version = Column(String, default="v1.0-rf")

    # Feedback / reconciliation
    actual_consumed = Column(Float, nullable=True)
    actual_waste = Column(Float, nullable=True)
    feedback_submitted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    menu_item = relationship("MenuItem", back_populates="predictions")

    __table_args__ = (
        Index('idx_pred_date_meal_item', 'prediction_date', 'meal_type', 'menu_item_id'),
    )
