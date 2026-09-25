import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base

class MealCategory(str, enum.Enum):
    BREAKFAST = "Breakfast"
    LUNCH = "Lunch"
    DINNER = "Dinner"
    SNACKS = "Snacks"

class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    category = Column(Enum(MealCategory), default=MealCategory.LUNCH, nullable=False)
    portion_size_g = Column(Float, default=350.0)  # grams per portion
    cost_per_portion = Column(Float, default=2.50)  # cost in currency units
    co2_per_kg = Column(Float, default=2.1)        # kg CO2 eq per kg food
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    records = relationship("DailyRecord", back_populates="menu_item", cascade="all, delete-orphan")
    predictions = relationship("DailyPrediction", back_populates="menu_item", cascade="all, delete-orphan")
