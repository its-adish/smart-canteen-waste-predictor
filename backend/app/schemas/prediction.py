from typing import Optional, List
from pydantic import BaseModel
from datetime import date, datetime
from app.schemas.menu import MenuItemResponse

class PredictionRequestItem(BaseModel):
    menu_item_id: int
    meal_type: str

class BatchPredictionRequest(BaseModel):
    prediction_date: date
    meal_type: str
    menu_item_ids: List[int]
    attendance_forecast: int = 500
    is_holiday: bool = False
    weather_forecast: str = "Sunny"  # Sunny, Rainy, Cloudy, Stormy
    temperature_forecast: float = 24.0
    safety_buffer_pct: float = 5.0  # 0 to 20%

class SinglePredictionRequest(BaseModel):
    prediction_date: date
    meal_type: str
    menu_item_id: int
    attendance_forecast: int = 500
    is_holiday: bool = False
    weather_forecast: str = "Sunny"
    temperature_forecast: float = 24.0
    safety_buffer_pct: float = 5.0

class PredictionItemResult(BaseModel):
    id: Optional[int] = None
    prediction_date: date
    meal_type: str
    menu_item_id: int
    menu_item_name: str
    menu_item_category: str
    unit_cost: float
    
    predicted_demand: float
    predicted_waste: float
    recommended_prep_qty: float
    safety_buffer_pct: float
    confidence_score: float
    lower_bound: float
    upper_bound: float
    risk_level: str
    
    estimated_cost: float
    estimated_waste_cost: float
    estimated_co2_kg: float
    
    actual_consumed: Optional[float] = None
    actual_waste: Optional[float] = None
    feedback_submitted: bool = False
    model_version: str

class PredictionResponse(BaseModel):
    prediction_date: date
    meal_type: str
    total_recommended_qty: float
    total_estimated_demand: float
    total_expected_waste: float
    avg_confidence_score: float
    total_cost: float
    total_waste_cost: float
    total_co2_kg: float
    items: List[PredictionItemResult]

class FeedbackSubmitRequest(BaseModel):
    prediction_id: int
    actual_consumed: float
    actual_waste: float
    notes: Optional[str] = None
