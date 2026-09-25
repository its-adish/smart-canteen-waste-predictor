from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class MenuItemBase(BaseModel):
    name: str
    category: str  # Breakfast, Lunch, Dinner, Snacks
    portion_size_g: float = 350.0
    cost_per_portion: float = 2.50
    co2_per_kg: float = 2.1
    description: Optional[str] = None
    is_active: bool = True

class MenuItemCreate(MenuItemBase):
    pass

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    portion_size_g: Optional[float] = None
    cost_per_portion: Optional[float] = None
    co2_per_kg: Optional[float] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class MenuItemResponse(MenuItemBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
