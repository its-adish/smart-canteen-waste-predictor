from datetime import datetime, date, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base

class DailyRecord(Base):
    __tablename__ = "daily_records"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True, nullable=False)
    meal_type = Column(String, index=True, nullable=False)  # Breakfast, Lunch, Dinner, Snacks
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    
    # Operational quantities (in portions or kg)
    prepared_qty = Column(Float, nullable=False)
    consumed_qty = Column(Float, nullable=False)
    waste_qty = Column(Float, nullable=False)
    waste_pct = Column(Float, default=0.0)
    
    # Contextual features
    attendance_expected = Column(Integer, default=500)
    attendance_actual = Column(Integer, default=500)
    is_holiday = Column(Boolean, default=False)
    special_event = Column(String, default="None")
    weather_condition = Column(String, default="Sunny")  # Sunny, Rainy, Cloudy, Stormy
    temperature_c = Column(Float, default=24.0)
    
    # Impact metrics
    cost_lost = Column(Float, default=0.0)
    co2_impact_kg = Column(Float, default=0.0)
    
    # Status & feedback
    is_verified = Column(Boolean, default=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    menu_item = relationship("MenuItem", back_populates="records")

    __table_args__ = (
        Index('idx_date_meal_item', 'date', 'meal_type', 'menu_item_id'),
    )
