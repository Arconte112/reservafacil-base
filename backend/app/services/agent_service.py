from datetime import datetime, date, time, timedelta
from typing import Dict, List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.db.models import Restaurant, Table, Reservation
from app.db.database import get_timezone
import pytz


class AgentService:
    @staticmethod
    async def check_availability(
        db: AsyncSession,
        restaurant_slug: str,
        date_str: str,
        guests: int
    ) -> Dict[str, List[int]]:
        # Get restaurant by slug
        result = await db.execute(select(Restaurant).where(Restaurant.slug == restaurant_slug))
        restaurant = result.scalar_one_or_none()
        
        if not restaurant:
            return {}
        
        # Parse date and validate it's a working day
        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return {}
        
        # Check if it's a working day (1=Monday, 7=Sunday)
        weekday = target_date.isoweekday()
        if weekday not in restaurant.work_days:
            return {}
        
        # Get timezone
        tz = get_timezone()
        
        # Get all tables that can accommodate the guests
        tables_result = await db.execute(
            select(Table).where(
                and_(
                    Table.restaurant_id == restaurant.id,
                    Table.capacity >= guests
                )
            )
        )
        suitable_tables = tables_result.scalars().all()
        
        if not suitable_tables:
            return {}
        
        # Generate time slots (every 30 minutes)
        available_slots = {}
        current_time = datetime.combine(target_date, restaurant.start_time)
        end_time = datetime.combine(target_date, restaurant.end_time)
        
        # Apply cutoff rule - don't allow bookings too close to closing time
        if restaurant.last_booking_cutoff_minutes > 0:
            end_time = end_time - timedelta(minutes=restaurant.last_booking_cutoff_minutes)
        
        # Get all reservations for this date
        start_of_day = tz.localize(datetime.combine(target_date, time.min))
        end_of_day = tz.localize(datetime.combine(target_date, time.max))
        
        reservations_result = await db.execute(
            select(Reservation).where(
                and_(
                    Reservation.restaurant_id == restaurant.id,
                    Reservation.reservation_datetime >= start_of_day,
                    Reservation.reservation_datetime <= end_of_day,
                    Reservation.status.in_(["pending", "confirmed"])
                )
            )
        )
        reservations = reservations_result.scalars().all()
        
        # Generate 30-minute time slots
        while current_time < end_time:
            slot_time = current_time.strftime("%H:%M")
            
            # Convert to 12-hour format for response
            slot_time_12h = current_time.strftime("%I:%M %p")
            
            available_tables_for_slot = []
            
            for table in suitable_tables:
                if AgentService._is_table_available(
                    table, current_time, reservations, restaurant.table_turnover_minutes, tz
                ):
                    available_tables_for_slot.append(table.number)
            
            if available_tables_for_slot:
                available_slots[slot_time_12h] = available_tables_for_slot
            
            current_time += timedelta(minutes=30)
        
        return available_slots
    
    @staticmethod
    def _is_table_available(
        table: Table,
        slot_time: datetime,
        reservations: List[Reservation],
        turnover_minutes: int,
        tz: pytz.timezone
    ) -> bool:
        for reservation in reservations:
            if reservation.table_id != table.id:
                continue
            
            # Convert reservation time to local timezone
            reservation_time = reservation.reservation_datetime.astimezone(tz).replace(tzinfo=None)
            
            # Calculate when the table becomes available again
            table_free_time = reservation_time + timedelta(minutes=turnover_minutes)
            
            # Check if slot conflicts with existing reservation
            if reservation_time <= slot_time < table_free_time:
                return False
        
        return True
    
    @staticmethod
    async def create_reservation(
        db: AsyncSession,
        restaurant_slug: str,
        customer_name: str,
        customer_phone: str,
        date_str: str,
        time_str: str,
        guests: int,
        source: str = "voice"
    ) -> Tuple[bool, Optional[Reservation], str]:
        # Get restaurant by slug
        result = await db.execute(select(Restaurant).where(Restaurant.slug == restaurant_slug))
        restaurant = result.scalar_one_or_none()
        
        if not restaurant:
            return False, None, "Restaurant not found"
        
        try:
            # Parse date and time
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            target_time = datetime.strptime(time_str, "%H:%M").time()
            reservation_datetime = datetime.combine(target_date, target_time)
        except ValueError:
            return False, None, "Invalid date or time format"
        
        # Validate working day
        weekday = target_date.isoweekday()
        if weekday not in restaurant.work_days:
            return False, None, "Restaurant is closed on this day"
        
        # Validate working hours
        if not (restaurant.start_time <= target_time <= restaurant.end_time):
            return False, None, "Time is outside restaurant hours"
        
        # Apply cutoff rule
        if restaurant.last_booking_cutoff_minutes > 0:
            cutoff_time = (
                datetime.combine(target_date, restaurant.end_time) - 
                timedelta(minutes=restaurant.last_booking_cutoff_minutes)
            ).time()
            if target_time > cutoff_time:
                return False, None, "Too close to closing time"
        
        # Get timezone and localize datetime
        tz = get_timezone()
        localized_datetime = tz.localize(reservation_datetime)
        
        # Check availability at this specific time
        available_slots = await AgentService.check_availability(
            db, restaurant_slug, date_str, guests
        )
        
        # Convert time back to 12-hour format to check availability
        time_12h = reservation_datetime.strftime("%I:%M %p")
        
        if time_12h not in available_slots or not available_slots[time_12h]:
            return False, None, "No tables available at this time"
        
        # Get the best table (smallest capacity that fits)
        suitable_tables_result = await db.execute(
            select(Table).where(
                and_(
                    Table.restaurant_id == restaurant.id,
                    Table.capacity >= guests,
                    Table.number.in_(available_slots[time_12h])
                )
            ).order_by(Table.capacity.asc())
        )
        best_table = suitable_tables_result.scalars().first()
        
        if not best_table:
            return False, None, "No suitable table found"
        
        # Create reservation
        reservation = Reservation(
            customer_name=customer_name,
            customer_phone=customer_phone,
            reservation_datetime=localized_datetime,
            guests=guests,
            status="pending",
            source=source,
            restaurant_id=restaurant.id,
            table_id=best_table.id
        )
        
        db.add(reservation)
        await db.commit()
        await db.refresh(reservation)
        
        return True, reservation, "Reservation created successfully"