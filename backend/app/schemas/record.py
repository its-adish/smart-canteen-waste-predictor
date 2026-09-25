from typing import Optional
from pydantic import BaseModel
from datetime import date, datetime
from app.schemas.menu import MenuItemResponse

class DailyRecordBase(BaseModel):
    date: date
    meal_type: str
    menu_item_id: int
    prepared_qty: float
    consumed_qty: float
    waste_qty: float
    attendance_expected: int = 500
    attendance_actual: int = 500
    is_holiday: bool = False
    special_event: str = "None"
    weather_condition: str = "Sunny"
    temperature_c: float = 24.0
    notes: Optional[str] = None
    is_verified: bool = True

class DailyRecordCreate(DailyRecordBase):
    pass

class DailyRecordUpdate(BaseModel):
    date: Optional[date] = None
    meal_type: Optional[str] = None
    menu_item_id: Optional[int] = None
    prepared_qty: Optional[float] = None
    consumed_qty: Optional[float] = None
    waste_qty: Optional[float] = None
    attendance_expected: Optional[int] = None
    attendance_actual: Optional[int] = None
    is_holiday: Optional[bool] = None
    special_event: Optional[str] = None
    weather_condition: Optional[str] = None
    temperature_c: Optional[float] = None
    notes: Optional[str] = None
    is_verified: Optional[bool] = None

class DailyRecordResponse(DailyRecordBase):
    id: int
    waste_pct: float
    cost_lost: float
    co2_impact_kg: float
    created_at: datetime
    menu_item: Optional[MenuItemResponse] = None

    class Config:
        from_attributes = True

class CSVImportResult(BaseModel):
    total_rows: int
    imported_count: int
    skipped_count: int
    errors: list[str]
