from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import date
import math
from app.db.database import get_db
from app.db.models import User
from app.security.auth import get_current_active_user
from app.services.crud import ReservationCRUD
from app.schemas.reservation import (
    Reservation,
    ReservationCreate,
    ReservationUpdate,
    ReservationList,
    ReservationWithTable
)

router = APIRouter()


@router.get("/reservations", response_model=ReservationList)
async def get_reservations(
    restaurant_id: int = Query(..., description="Restaurant ID"),
    date_filter: Optional[date] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search in customer name/phone"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get paginated list of reservations with filters"""
    skip = (page - 1) * limit
    
    reservations, total = await ReservationCRUD.get_reservations(
        db=db,
        restaurant_id=restaurant_id,
        date_filter=date_filter,
        status_filter=status_filter,
        search=search,
        skip=skip,
        limit=limit
    )
    
    # Convert to response format with table numbers
    reservation_list = []
    for reservation in reservations:
        reservation_data = ReservationWithTable(
            **reservation.__dict__,
            table_number=reservation.table.number if reservation.table else None
        )
        reservation_list.append(reservation_data)
    
    pages = math.ceil(total / limit)
    
    return ReservationList(
        items=reservation_list,
        total=total,
        page=page,
        pages=pages
    )


@router.get("/reservations/{reservation_id}", response_model=Reservation)
async def get_reservation(
    reservation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific reservation by ID"""
    reservation = await ReservationCRUD.get_reservation(db, reservation_id)
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found"
        )
    return reservation


@router.post("/reservations", response_model=Reservation)
async def create_reservation(
    reservation: ReservationCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new reservation"""
    return await ReservationCRUD.create_reservation(db, reservation)


@router.put("/reservations/{reservation_id}", response_model=Reservation)
async def update_reservation(
    reservation_id: int,
    reservation_update: ReservationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a reservation"""
    reservation = await ReservationCRUD.update_reservation(db, reservation_id, reservation_update)
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found"
        )
    return reservation


@router.delete("/reservations/{reservation_id}")
async def delete_reservation(
    reservation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a reservation"""
    success = await ReservationCRUD.delete_reservation(db, reservation_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found"
        )
    return {"message": "Reservation deleted successfully"}