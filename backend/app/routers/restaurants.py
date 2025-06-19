from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.db.database import get_db
from app.db.models import User
from app.security.auth import get_current_active_user
from app.services.crud import RestaurantCRUD
from app.schemas.restaurant import Restaurant

router = APIRouter()


@router.get("/restaurants", response_model=List[Restaurant])
async def get_restaurants(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all restaurants (since there's no user-restaurant relationship yet)"""
    return await RestaurantCRUD.get_restaurants(db)