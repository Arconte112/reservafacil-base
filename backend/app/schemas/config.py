from pydantic import BaseModel
from typing import List
from datetime import time


class ConfigUpdate(BaseModel):
    work_days: List[int]
    start_time: time
    end_time: time
    table_turnover_minutes: int
    last_booking_cutoff_minutes: int


class ConfigResponse(BaseModel):
    id: int
    name: str
    slug: str
    work_days: List[int]
    start_time: time
    end_time: time
    table_turnover_minutes: int
    last_booking_cutoff_minutes: int

    class Config:
        from_attributes = True