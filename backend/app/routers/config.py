from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.db.models import User
from app.security.auth import get_current_active_user
from app.services.crud import RestaurantCRUD
from app.schemas.config import ConfigUpdate, ConfigResponse

router = APIRouter()


@router.get("/config/{restaurant_id}", response_model=ConfigResponse)
async def get_restaurant_config(
    restaurant_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get restaurant configuration settings"""
    restaurant = await RestaurantCRUD.get_restaurant(db, restaurant_id)
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found"
        )
    
    return ConfigResponse(
        id=restaurant.id,
        name=restaurant.name,
        slug=restaurant.slug,
        work_days=restaurant.work_days,
        start_time=restaurant.start_time,
        end_time=restaurant.end_time,
        table_turnover_minutes=restaurant.table_turnover_minutes,
        last_booking_cutoff_minutes=restaurant.last_booking_cutoff_minutes
    )


@router.put("/config/{restaurant_id}", response_model=ConfigResponse)
async def update_restaurant_config(
    restaurant_id: int,
    config_update: ConfigUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update restaurant configuration settings"""
    from app.schemas.restaurant import RestaurantUpdate
    
    restaurant_update = RestaurantUpdate(
        work_days=config_update.work_days,
        start_time=config_update.start_time,
        end_time=config_update.end_time,
        table_turnover_minutes=config_update.table_turnover_minutes,
        last_booking_cutoff_minutes=config_update.last_booking_cutoff_minutes
    )
    
    restaurant = await RestaurantCRUD.update_restaurant(db, restaurant_id, restaurant_update)
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found"
        )
    
    return ConfigResponse(
        id=restaurant.id,
        name=restaurant.name,
        slug=restaurant.slug,
        work_days=restaurant.work_days,
        start_time=restaurant.start_time,
        end_time=restaurant.end_time,
        table_turnover_minutes=restaurant.table_turnover_minutes,
        last_booking_cutoff_minutes=restaurant.last_booking_cutoff_minutes
    )