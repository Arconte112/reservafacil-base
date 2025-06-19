import pytest
import asyncio
from datetime import datetime, date, time, timedelta
from unittest.mock import Mock, patch
import pytz
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.agent_service import AgentService
from app.db.models import Restaurant, Table, Reservation


class TestAgentService:
    """Unit and integration tests for AgentService"""

    @pytest.mark.asyncio
    async def test_check_availability_restaurant_not_found(self, db_session):
        """Test check_availability returns empty dict when restaurant not found"""
        result = await AgentService.check_availability(
            db_session, "nonexistent-restaurant", "2024-06-20", 2
        )
        assert result == {}

    @pytest.mark.asyncio
    async def test_check_availability_invalid_date_format(self, db_session, test_restaurant):
        """Test check_availability returns empty dict for invalid date format"""
        result = await AgentService.check_availability(
            db_session, test_restaurant.slug, "invalid-date", 2
        )
        assert result == {}

    @pytest.mark.asyncio
    async def test_check_availability_non_working_day(self, db_session, test_restaurant):
        """Test check_availability returns empty dict for non-working days"""
        # Saturday (6) is not in work_days [1,2,3,4,5]
        saturday_date = "2024-06-22"  # This would be a Saturday
        result = await AgentService.check_availability(
            db_session, test_restaurant.slug, saturday_date, 2
        )
        assert result == {}

    @pytest.mark.asyncio
    async def test_check_availability_no_suitable_tables(self, db_session, test_restaurant):
        """Test check_availability returns empty dict when no tables can accommodate guests"""
        # Request for 10 guests when max table capacity is 6
        working_day = "2024-06-20"  # Thursday
        result = await AgentService.check_availability(
            db_session, test_restaurant.slug, working_day, 10
        )
        assert result == {}

    @pytest.mark.asyncio
    async def test_check_availability_success(self, db_session, test_restaurant, test_tables):
        """Test check_availability returns available slots successfully"""
        working_day = "2024-06-20"  # Thursday
        result = await AgentService.check_availability(
            db_session, test_restaurant.slug, working_day, 2
        )
        
        # Should return time slots with available tables
        assert isinstance(result, dict)
        assert len(result) > 0
        
        # Check format of returned data
        for time_slot, table_numbers in result.items():
            assert isinstance(time_slot, str)
            assert ":" in time_slot  # Time format
            assert isinstance(table_numbers, list)
            assert all(isinstance(table_num, int) for table_num in table_numbers)

    @pytest.mark.asyncio
    async def test_check_availability_with_cutoff_time(self, db_session):
        """Test check_availability respects last booking cutoff time"""
        # Create restaurant with 60-minute cutoff
        restaurant = Restaurant(
            name="Test Restaurant with Cutoff",
            slug="test-cutoff",
            work_days=[1, 2, 3, 4, 5],
            start_time=time(18, 0),
            end_time=time(22, 0),
            table_turnover_minutes=90,
            last_booking_cutoff_minutes=60
        )
        db_session.add(restaurant)
        await db_session.commit()
        await db_session.refresh(restaurant)

        # Add a table
        table = Table(number=1, capacity=2, restaurant_id=restaurant.id, location="Test")
        db_session.add(table)
        await db_session.commit()

        working_day = "2024-06-20"  # Thursday
        result = await AgentService.check_availability(
            db_session, restaurant.slug, working_day, 2
        )
        
        # Should not include slots after 21:00 (22:00 - 60 minutes)
        for time_slot in result.keys():
            hour = int(time_slot.split(':')[0])
            if 'PM' in time_slot and hour != 12:
                hour += 12
            elif 'AM' in time_slot and hour == 12:
                hour = 0
            assert hour < 21 or (hour == 21 and '00' in time_slot)

    @pytest.mark.asyncio
    async def test_check_availability_with_existing_reservations(self, db_session, test_restaurant, test_tables):
        """Test check_availability considers existing reservations"""
        # Create a reservation for table 1 at 19:00
        tz = pytz.timezone('America/Santiago')
        reservation_datetime = tz.localize(datetime(2024, 6, 20, 19, 0))
        
        reservation = Reservation(
            customer_name="Test Customer",
            customer_phone="123456789",
            reservation_datetime=reservation_datetime,
            guests=2,
            status="confirmed",
            source="test",
            restaurant_id=test_restaurant.id,
            table_id=test_tables[0].id  # Table 1
        )
        db_session.add(reservation)
        await db_session.commit()

        working_day = "2024-06-20"  # Thursday
        result = await AgentService.check_availability(
            db_session, test_restaurant.slug, working_day, 2
        )
        
        # Table 1 should not be available at 7:00 PM due to existing reservation
        if "07:00 PM" in result:
            assert 1 not in result["07:00 PM"]

    def test_is_table_available_no_reservations(self):
        """Test _is_table_available returns True when no reservations exist"""
        table = Mock()
        table.id = 1
        
        slot_time = datetime(2024, 6, 20, 19, 0)
        reservations = []
        turnover_minutes = 90
        tz = pytz.timezone('America/Santiago')
        
        result = AgentService._is_table_available(
            table, slot_time, reservations, turnover_minutes, tz
        )
        assert result is True

    def test_is_table_available_different_table(self):
        """Test _is_table_available returns True when reservation is for different table"""
        table = Mock()
        table.id = 1
        
        slot_time = datetime(2024, 6, 20, 19, 0)
        
        # Reservation for different table (id=2)
        reservation = Mock()
        reservation.table_id = 2
        reservation.reservation_datetime = pytz.timezone('America/Santiago').localize(
            datetime(2024, 6, 20, 19, 0)
        )
        
        reservations = [reservation]
        turnover_minutes = 90
        tz = pytz.timezone('America/Santiago')
        
        result = AgentService._is_table_available(
            table, slot_time, reservations, turnover_minutes, tz
        )
        assert result is True

    def test_is_table_available_conflict_during_reservation(self):
        """Test _is_table_available returns False when slot conflicts with reservation"""
        table = Mock()
        table.id = 1
        
        # Slot at 19:30, reservation at 19:00 with 90-minute turnover
        slot_time = datetime(2024, 6, 20, 19, 30)
        
        reservation = Mock()
        reservation.table_id = 1
        reservation.reservation_datetime = pytz.timezone('America/Santiago').localize(
            datetime(2024, 6, 20, 19, 0)
        )
        
        reservations = [reservation]
        turnover_minutes = 90
        tz = pytz.timezone('America/Santiago')
        
        result = AgentService._is_table_available(
            table, slot_time, reservations, turnover_minutes, tz
        )
        assert result is False

    def test_is_table_available_after_turnover(self):
        """Test _is_table_available returns True after turnover period"""
        table = Mock()
        table.id = 1
        
        # Slot at 20:30, reservation at 19:00 with 90-minute turnover (free at 20:30)
        slot_time = datetime(2024, 6, 20, 20, 30)
        
        reservation = Mock()
        reservation.table_id = 1
        reservation.reservation_datetime = pytz.timezone('America/Santiago').localize(
            datetime(2024, 6, 20, 19, 0)
        )
        
        reservations = [reservation]
        turnover_minutes = 90
        tz = pytz.timezone('America/Santiago')
        
        result = AgentService._is_table_available(
            table, slot_time, reservations, turnover_minutes, tz
        )
        assert result is True

    @pytest.mark.asyncio
    async def test_create_reservation_restaurant_not_found(self, db_session):
        """Test create_reservation fails when restaurant not found"""
        success, reservation, message = await AgentService.create_reservation(
            db_session, "nonexistent", "John Doe", "123456789", "2024-06-20", "19:00", 2
        )
        
        assert success is False
        assert reservation is None
        assert message == "Restaurant not found"

    @pytest.mark.asyncio
    async def test_create_reservation_invalid_date_format(self, db_session, test_restaurant):
        """Test create_reservation fails with invalid date format"""
        success, reservation, message = await AgentService.create_reservation(
            db_session, test_restaurant.slug, "John Doe", "123456789", "invalid-date", "19:00", 2
        )
        
        assert success is False
        assert reservation is None
        assert message == "Invalid date or time format"

    @pytest.mark.asyncio
    async def test_create_reservation_invalid_time_format(self, db_session, test_restaurant):
        """Test create_reservation fails with invalid time format"""
        success, reservation, message = await AgentService.create_reservation(
            db_session, test_restaurant.slug, "John Doe", "123456789", "2024-06-20", "invalid-time", 2
        )
        
        assert success is False
        assert reservation is None
        assert message == "Invalid date or time format"

    @pytest.mark.asyncio
    async def test_create_reservation_non_working_day(self, db_session, test_restaurant):
        """Test create_reservation fails on non-working day"""
        # Saturday is not a working day
        success, reservation, message = await AgentService.create_reservation(
            db_session, test_restaurant.slug, "John Doe", "123456789", "2024-06-22", "19:00", 2
        )
        
        assert success is False
        assert reservation is None
        assert message == "Restaurant is closed on this day"

    @pytest.mark.asyncio
    async def test_create_reservation_outside_hours(self, db_session, test_restaurant):
        """Test create_reservation fails when time is outside restaurant hours"""
        # Restaurant opens at 09:00, closes at 22:00
        success, reservation, message = await AgentService.create_reservation(
            db_session, test_restaurant.slug, "John Doe", "123456789", "2024-06-20", "08:00", 2
        )
        
        assert success is False
        assert reservation is None
        assert message == "Time is outside restaurant hours"

    @pytest.mark.asyncio
    async def test_create_reservation_too_close_to_closing(self, db_session):
        """Test create_reservation fails when too close to closing time"""
        # Create restaurant with 60-minute cutoff
        restaurant = Restaurant(
            name="Test Restaurant with Cutoff",
            slug="test-cutoff-reservation",
            work_days=[1, 2, 3, 4, 5],
            start_time=time(18, 0),
            end_time=time(22, 0),
            table_turnover_minutes=90,
            last_booking_cutoff_minutes=60
        )
        db_session.add(restaurant)
        await db_session.commit()
        await db_session.refresh(restaurant)

        # Try to book at 21:30 (30 minutes before closing, but cutoff is 60 minutes)
        success, reservation, message = await AgentService.create_reservation(
            db_session, restaurant.slug, "John Doe", "123456789", "2024-06-20", "21:30", 2
        )
        
        assert success is False
        assert reservation is None
        assert message == "Too close to closing time"

    @pytest.mark.asyncio
    async def test_create_reservation_no_tables_available(self, db_session, test_restaurant):
        """Test create_reservation fails when no tables available"""
        # Don't create any tables for this test
        success, reservation, message = await AgentService.create_reservation(
            db_session, test_restaurant.slug, "John Doe", "123456789", "2024-06-20", "19:00", 2
        )
        
        assert success is False
        assert reservation is None
        assert message == "No tables available at this time"

    @pytest.mark.asyncio
    async def test_create_reservation_success(self, db_session, test_restaurant, test_tables):
        """Test create_reservation succeeds with valid data"""
        success, reservation, message = await AgentService.create_reservation(
            db_session, test_restaurant.slug, "John Doe", "123456789", "2024-06-20", "19:00", 2
        )
        
        assert success is True
        assert reservation is not None
        assert message == "Reservation created successfully"
        assert reservation.customer_name == "John Doe"
        assert reservation.customer_phone == "123456789"
        assert reservation.guests == 2
        assert reservation.status == "pending"
        assert reservation.source == "voice"
        assert reservation.restaurant_id == test_restaurant.id
        assert reservation.table_id is not None

    @pytest.mark.asyncio
    async def test_create_reservation_selects_best_table(self, db_session, test_restaurant, test_tables):
        """Test create_reservation selects the smallest suitable table"""
        # Request for 2 guests - should select table 1 (capacity 2) over table 2 (capacity 4)
        success, reservation, message = await AgentService.create_reservation(
            db_session, test_restaurant.slug, "John Doe", "123456789", "2024-06-20", "19:00", 2
        )
        
        assert success is True
        assert reservation is not None
        # Should select table with capacity 2 (table 1)
        selected_table = next(t for t in test_tables if t.id == reservation.table_id)
        assert selected_table.capacity == 2

    @pytest.mark.asyncio
    async def test_create_reservation_custom_source(self, db_session, test_restaurant, test_tables):
        """Test create_reservation with custom source"""
        success, reservation, message = await AgentService.create_reservation(
            db_session, test_restaurant.slug, "John Doe", "123456789", "2024-06-20", "19:00", 2, "chat"
        )
        
        assert success is True
        assert reservation is not None
        assert reservation.source == "chat"


class TestAgentServiceIntegration:
    """Integration tests for AgentService workflows"""

    @pytest.mark.asyncio
    async def test_full_reservation_workflow(self, db_session, test_restaurant, test_tables):
        """Test complete workflow: check availability then create reservation"""
        working_day = "2024-06-20"
        guests = 2
        
        # Step 1: Check availability
        available_slots = await AgentService.check_availability(
            db_session, test_restaurant.slug, working_day, guests
        )
        
        assert len(available_slots) > 0
        
        # Step 2: Pick a time slot and create reservation
        time_slot = list(available_slots.keys())[0]
        time_24h = datetime.strptime(time_slot, "%I:%M %p").strftime("%H:%M")
        
        success, reservation, message = await AgentService.create_reservation(
            db_session, test_restaurant.slug, "John Doe", "123456789", working_day, time_24h, guests
        )
        
        assert success is True
        assert reservation is not None
        
        # Step 3: Check availability again - should have fewer available tables
        updated_slots = await AgentService.check_availability(
            db_session, test_restaurant.slug, working_day, guests
        )
        
        # The reserved table should no longer be available at that time
        if time_slot in updated_slots:
            assert reservation.table.number not in updated_slots[time_slot]

    @pytest.mark.asyncio
    async def test_multiple_reservations_same_time(self, db_session, test_restaurant, test_tables):
        """Test multiple reservations at the same time use different tables"""
        working_day = "2024-06-20"
        time_str = "19:00"
        
        # Create first reservation
        success1, reservation1, _ = await AgentService.create_reservation(
            db_session, test_restaurant.slug, "John Doe", "123456789", working_day, time_str, 2
        )
        
        # Create second reservation
        success2, reservation2, _ = await AgentService.create_reservation(
            db_session, test_restaurant.slug, "Jane Smith", "987654321", working_day, time_str, 2
        )
        
        assert success1 is True
        assert success2 is True
        assert reservation1.table_id != reservation2.table_id

    @pytest.mark.asyncio
    async def test_reservation_blocks_table_during_turnover(self, db_session, test_restaurant, test_tables):
        """Test that reservation blocks table for entire turnover period"""
        working_day = "2024-06-20"
        
        # Create reservation at 19:00
        success1, reservation1, _ = await AgentService.create_reservation(
            db_session, test_restaurant.slug, "John Doe", "123456789", working_day, "19:00", 2
        )
        assert success1 is True
        
        # Try to create another reservation at 19:30 for same table size
        # Should fail or use different table due to turnover time
        success2, reservation2, message2 = await AgentService.create_reservation(
            db_session, test_restaurant.slug, "Jane Smith", "987654321", working_day, "19:30", 2
        )
        
        if success2:
            # If successful, must be using a different table
            assert reservation1.table_id != reservation2.table_id
        else:
            # If failed, should be due to no available tables
            assert "No tables available" in message2

    @pytest.mark.asyncio
    async def test_edge_case_reservation_at_closing_time(self, db_session, test_restaurant, test_tables):
        """Test reservation respects cutoff time even at closing"""
        # Restaurant closes at 22:00 but has 60-minute cutoff, so last booking is 21:00
        success, reservation, message = await AgentService.create_reservation(
            db_session, test_restaurant.slug, "John Doe", "123456789", "2024-06-20", "22:00", 2
        )
        
        # Should fail due to cutoff rule
        assert success is False
        assert reservation is None
        assert message == "Too close to closing time"
        
        # But 20:00 should succeed (before cutoff time)  
        success2, reservation2, message2 = await AgentService.create_reservation(
            db_session, test_restaurant.slug, "Jane Doe", "987654321", "2024-06-20", "20:00", 2
        )
        
        assert success2 is True, f"Expected success but got: {message2}"
        assert reservation2 is not None

    @pytest.mark.asyncio
    async def test_availability_with_cancelled_reservations(self, db_session, test_restaurant, test_tables):
        """Test availability considers only active reservations (not cancelled)"""
        working_day = "2024-06-20"
        tz = pytz.timezone('America/Santiago')
        reservation_datetime = tz.localize(datetime(2024, 6, 20, 19, 0))
        
        # Create a cancelled reservation
        cancelled_reservation = Reservation(
            customer_name="Cancelled Customer",
            customer_phone="123456789",
            reservation_datetime=reservation_datetime,
            guests=2,
            status="cancelled",
            source="test",
            restaurant_id=test_restaurant.id,
            table_id=test_tables[0].id
        )
        db_session.add(cancelled_reservation)
        await db_session.commit()

        # Check availability - cancelled reservation shouldn't block the table
        available_slots = await AgentService.check_availability(
            db_session, test_restaurant.slug, working_day, 2
        )
        
        # Table should be available at 7:00 PM despite cancelled reservation
        assert "07:00 PM" in available_slots
        assert test_tables[0].number in available_slots["07:00 PM"]