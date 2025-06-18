from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.db.models import User
from app.security.auth import get_current_active_user
from app.services.crud import ReservationCRUD

router = APIRouter()


@router.get("/dashboard/stats")
async def get_dashboard_stats(
    restaurant_id: int = Query(..., description="Restaurant ID"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get dashboard statistics for a restaurant"""
    stats = await ReservationCRUD.get_dashboard_stats(db, restaurant_id)
    return stats