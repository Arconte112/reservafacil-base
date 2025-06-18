from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.services.agent_service import AgentService
from app.schemas.reservation import (
    AgentAvailabilityRequest,
    AgentAvailabilityResponse,
    AgentReservationRequest,
    AgentReservationResponse
)

router = APIRouter()


@router.post("/agent/check-availability", response_model=AgentAvailabilityResponse)
async def check_availability(
    request: AgentAvailabilityRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Public endpoint to check table availability for a specific date and party size.
    Used by AI voice agents and chatbots.
    """
    available_slots = await AgentService.check_availability(
        db=db,
        restaurant_slug=request.restaurant_slug,
        date_str=request.date,
        guests=request.guests
    )
    
    return AgentAvailabilityResponse(available_slots=available_slots)


@router.post("/agent/create-reservation", response_model=AgentReservationResponse)
async def create_reservation(
    request: AgentReservationRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Public endpoint to create a reservation.
    Used by AI voice agents and chatbots.
    """
    success, reservation, message = await AgentService.create_reservation(
        db=db,
        restaurant_slug=request.restaurant_slug,
        customer_name=request.customer_name,
        customer_phone=request.customer_phone,
        date_str=request.date,
        time_str=request.time,
        guests=request.guests,
        source=request.source
    )
    
    if not success:
        # Return error details but don't raise HTTP exception for AI agents
        return AgentReservationResponse(
            success=False,
            reservation=None,
            message=message
        )
    
    return AgentReservationResponse(
        success=True,
        reservation=reservation,
        message=message
    )