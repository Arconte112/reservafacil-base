from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TableBase(BaseModel):
    number: int
    capacity: int
    location: Optional[str] = None


class TableCreate(TableBase):
    restaurant_id: int


class TableUpdate(BaseModel):
    number: Optional[int] = None
    capacity: Optional[int] = None
    status: Optional[str] = None
    location: Optional[str] = None


class Table(TableBase):
    id: int
    status: str
    restaurant_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TableWithReservation(Table):
    current_reservation: Optional[dict] = None