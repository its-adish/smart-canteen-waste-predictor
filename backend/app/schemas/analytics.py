from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import date

class DashboardKPIs(BaseModel):
    total_meals_prepared: float
    total_meals_consumed: float
    total_waste_kg: float
    avg_waste_pct: float
    total_cost_lost: float
    total_co2_impact_kg: float
    accuracy_rate_pct: float
    cost_saved_estimate: float
    co2_avoided_estimate_kg: float
    days_recorded: int

class TrendDataPoint(BaseModel):
    date: str
    prepared: float
    consumed: float
    waste: float
    waste_pct: float
    attendance: int
    cost_lost: float

class WasteByCategory(BaseModel):
    category: str
    total_waste: float
    waste_pct: float
    cost_lost: float
    co2_kg: float

class RiskAlert(BaseModel):
    id: str
    date: str
    meal_type: str
    menu_item_name: str
    severity: str # "high", "medium", "low"
    predicted_waste_pct: float
    reason: str
    action_tip: str

class SustainabilityReport(BaseModel):
    summary: DashboardKPIs
    waste_by_category: List[WasteByCategory]
    monthly_trends: List[Dict[str, Any]]
    food_recovery_equivalent: Dict[str, Any]
