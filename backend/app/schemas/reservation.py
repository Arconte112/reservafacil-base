from pydantic import BaseModel, EmailStr
from typing import Optional, List, Union
from datetime import datetime


class ReservationBase(BaseModel):
    customer_name: str
    customer_phone: str
    customer_email: Optional[EmailStr] = None
    guests: int
    notes: Optional[str] = None
    special_requests: Optional[str] = None


class ReservationCreate(ReservationBase):
    reservation_datetime: datetime
    restaurant_id: int
    source: str = "manual"


class ReservationUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[EmailStr] = None
    guests: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    special_requests: Optional[str] = None
    table_id: Optional[int] = None


class Reservation(ReservationBase):
    id: int
    reservation_datetime: datetime
    status: str
    source: str
    restaurant_id: int
    table_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReservationWithTable(Reservation):
    table_number: Optional[int] = None


class ReservationList(BaseModel):
    items: List[ReservationWithTable]
    total: int
    page: int
    pages: int


# Agent-specific schemas
class AgentAvailabilityRequest(BaseModel):
    restaurant_slug: str
    date: str  # YYYY-MM-DD format
    guests: int


class AgentAvailabilityResponse(BaseModel):
    available_slots: dict  # {time: [table_numbers] or string}


class AgentReservationRequest(BaseModel):
    restaurant_slug: str
    customer_name: str
    customer_phone: str
    date: str  # YYYY-MM-DD format
    time: str  # HH:MM format
    guests: int
    source: str = "voice"


class AgentReservationResponse(BaseModel):
    success: bool
    reservation: Optional[Reservation] = None
    message: str