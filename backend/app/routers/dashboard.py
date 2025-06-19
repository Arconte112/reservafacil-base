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


@router.get("/dashboard/weekly-stats")
async def get_weekly_stats(
    restaurant_id: int = Query(..., description="Restaurant ID"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get weekly reservation statistics for dashboard chart"""
    stats = await ReservationCRUD.get_weekly_stats(db, restaurant_id)
    return stats


@router.get("/dashboard/top-customers")
async def get_top_customers(
    restaurant_id: int = Query(..., description="Restaurant ID"),
    limit: int = Query(5, ge=1, le=20, description="Number of top customers to return"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get top customers by reservation count"""
    customers = await ReservationCRUD.get_top_customers(db, restaurant_id, limit)
    return customers