from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.menu import MenuItem, MealCategory
from app.models.user import User
from app.schemas.menu import MenuItemCreate, MenuItemUpdate, MenuItemResponse
from app.api.auth import get_current_user

router = APIRouter(prefix="/menu", tags=["Menu Management"])

@router.get("", response_model=List[MenuItemResponse])
def get_menu_items(
    category: Optional[str] = None,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    query = db.query(MenuItem)
    if active_only:
        query = query.filter(MenuItem.is_active == True)
    if category:
        query = query.filter(MenuItem.category == category)
    return query.order_by(MenuItem.category, MenuItem.name).all()

@router.get("/{item_id}", response_model=MenuItemResponse)
def get_menu_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return item

@router.post("", response_model=MenuItemResponse, status_code=status.HTTP_201_CREATED)
def create_menu_item(
    item_in: MenuItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify category
    try:
        cat_enum = MealCategory(item_in.category)
    except ValueError:
        cat_enum = MealCategory.LUNCH

    new_item = MenuItem(
        name=item_in.name,
        category=cat_enum,
        portion_size_g=item_in.portion_size_g,
        cost_per_portion=item_in.cost_per_portion,
        co2_per_kg=item_in.co2_per_kg,
        description=item_in.description,
        is_active=item_in.is_active
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@router.put("/{item_id}", response_model=MenuItemResponse)
def update_menu_item(
    item_id: int,
    item_in: MenuItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    update_data = item_in.model_dump(exclude_unset=True)
    if "category" in update_data and update_data["category"]:
        try:
            update_data["category"] = MealCategory(update_data["category"])
        except ValueError:
            pass

    for field, val in update_data.items():
        setattr(item, field, val)
        
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}")
def delete_menu_item(
    item_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    # Soft delete / toggle active
    item.is_active = False
    db.commit()
    return {"message": f"Menu item '{item.name}' deactivated successfully"}
