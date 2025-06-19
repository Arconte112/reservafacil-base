from pydantic import BaseModel
from typing import List, Optional
from datetime import time, datetime


class RestaurantBase(BaseModel):
    name: str
    slug: str
    work_days: List[int] = [1, 2, 3, 4, 5]  # Monday to Friday by default
    start_time: time
    end_time: time
    table_turnover_minutes: int = 0
    last_booking_cutoff_minutes: int = 0


class RestaurantCreate(RestaurantBase):
    pass


class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    work_days: Optional[List[int]] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    table_turnover_minutes: Optional[int] = None
    last_booking_cutoff_minutes: Optional[int] = None


class Restaurant(RestaurantBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True