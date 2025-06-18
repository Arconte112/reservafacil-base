from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc, or_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, date
from app.db.models import User, Restaurant, Table, Reservation
from app.schemas.auth import UserCreate
from app.schemas.restaurant import RestaurantCreate, RestaurantUpdate
from app.schemas.table import TableCreate, TableUpdate
from app.schemas.reservation import ReservationCreate, ReservationUpdate
from app.security.auth import get_password_hash


class UserCRUD:
    @staticmethod
    async def create_user(db: AsyncSession, user: UserCreate) -> User:
        hashed_password = get_password_hash(user.password)
        db_user = User(
            email=user.email,
            hashed_password=hashed_password
        )
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        return db_user
    
    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()


class RestaurantCRUD:
    @staticmethod
    async def create_restaurant(db: AsyncSession, restaurant: RestaurantCreate) -> Restaurant:
        db_restaurant = Restaurant(**restaurant.dict())
        db.add(db_restaurant)
        await db.commit()
        await db.refresh(db_restaurant)
        return db_restaurant
    
    @staticmethod
    async def get_restaurant(db: AsyncSession, restaurant_id: int) -> Optional[Restaurant]:
        result = await db.execute(select(Restaurant).where(Restaurant.id == restaurant_id))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_restaurant_by_slug(db: AsyncSession, slug: str) -> Optional[Restaurant]:
        result = await db.execute(select(Restaurant).where(Restaurant.slug == slug))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def update_restaurant(
        db: AsyncSession, 
        restaurant_id: int, 
        restaurant_update: RestaurantUpdate
    ) -> Optional[Restaurant]:
        result = await db.execute(select(Restaurant).where(Restaurant.id == restaurant_id))
        db_restaurant = result.scalar_one_or_none()
        
        if not db_restaurant:
            return None
        
        update_data = restaurant_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_restaurant, field, value)
        
        await db.commit()
        await db.refresh(db_restaurant)
        return db_restaurant
    
    @staticmethod
    async def get_restaurants(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Restaurant]:
        result = await db.execute(select(Restaurant).offset(skip).limit(limit))
        return result.scalars().all()


class TableCRUD:
    @staticmethod
    async def create_table(db: AsyncSession, table: TableCreate) -> Table:
        db_table = Table(**table.dict())
        db.add(db_table)
        await db.commit()
        await db.refresh(db_table)
        return db_table
    
    @staticmethod
    async def get_tables(
        db: AsyncSession, 
        restaurant_id: int, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Table]:
        result = await db.execute(
            select(Table)
            .where(Table.restaurant_id == restaurant_id)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()
    
    @staticmethod
    async def get_table(db: AsyncSession, table_id: int) -> Optional[Table]:
        result = await db.execute(select(Table).where(Table.id == table_id))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def update_table(
        db: AsyncSession, 
        table_id: int, 
        table_update: TableUpdate
    ) -> Optional[Table]:
        result = await db.execute(select(Table).where(Table.id == table_id))
        db_table = result.scalar_one_or_none()
        
        if not db_table:
            return None
        
        update_data = table_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_table, field, value)
        
        await db.commit()
        await db.refresh(db_table)
        return db_table
    
    @staticmethod
    async def delete_table(db: AsyncSession, table_id: int) -> bool:
        result = await db.execute(select(Table).where(Table.id == table_id))
        db_table = result.scalar_one_or_none()
        
        if not db_table:
            return False
        
        await db.delete(db_table)
        await db.commit()
        return True


class ReservationCRUD:
    @staticmethod
    async def create_reservation(db: AsyncSession, reservation: ReservationCreate) -> Reservation:
        db_reservation = Reservation(**reservation.dict())
        db.add(db_reservation)
        await db.commit()
        await db.refresh(db_reservation)
        return db_reservation
    
    @staticmethod
    async def get_reservations(
        db: AsyncSession,
        restaurant_id: int,
        date_filter: Optional[date] = None,
        status_filter: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[Reservation], int]:
        query = select(Reservation).options(
            selectinload(Reservation.table)
        ).where(Reservation.restaurant_id == restaurant_id)
        
        # Apply filters
        if date_filter:
            start_of_day = datetime.combine(date_filter, datetime.min.time())
            end_of_day = datetime.combine(date_filter, datetime.max.time())
            query = query.where(
                and_(
                    Reservation.reservation_datetime >= start_of_day,
                    Reservation.reservation_datetime <= end_of_day
                )
            )
        
        if status_filter:
            query = query.where(Reservation.status == status_filter)
        
        if search:
            query = query.where(
                or_(
                    Reservation.customer_name.ilike(f"%{search}%"),
                    Reservation.customer_phone.ilike(f"%{search}%")
                )
            )
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # Get paginated results
        query = query.order_by(desc(Reservation.reservation_datetime)).offset(skip).limit(limit)
        result = await db.execute(query)
        reservations = result.scalars().all()
        
        return reservations, total
    
    @staticmethod
    async def get_reservation(db: AsyncSession, reservation_id: int) -> Optional[Reservation]:
        result = await db.execute(
            select(Reservation)
            .options(selectinload(Reservation.table))
            .where(Reservation.id == reservation_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def update_reservation(
        db: AsyncSession, 
        reservation_id: int, 
        reservation_update: ReservationUpdate
    ) -> Optional[Reservation]:
        result = await db.execute(select(Reservation).where(Reservation.id == reservation_id))
        db_reservation = result.scalar_one_or_none()
        
        if not db_reservation:
            return None
        
        update_data = reservation_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_reservation, field, value)
        
        await db.commit()
        await db.refresh(db_reservation)
        return db_reservation
    
    @staticmethod
    async def delete_reservation(db: AsyncSession, reservation_id: int) -> bool:
        result = await db.execute(select(Reservation).where(Reservation.id == reservation_id))
        db_reservation = result.scalar_one_or_none()
        
        if not db_reservation:
            return False
        
        await db.delete(db_reservation)
        await db.commit()
        return True
    
    @staticmethod
    async def get_dashboard_stats(db: AsyncSession, restaurant_id: int) -> dict:
        today = date.today()
        start_of_day = datetime.combine(today, datetime.min.time())
        end_of_day = datetime.combine(today, datetime.max.time())
        
        # Today's reservations
        today_result = await db.execute(
            select(func.count(Reservation.id))
            .where(
                and_(
                    Reservation.restaurant_id == restaurant_id,
                    Reservation.reservation_datetime >= start_of_day,
                    Reservation.reservation_datetime <= end_of_day
                )
            )
        )
        today_reservations = today_result.scalar() or 0
        
        # Confirmed reservations today
        confirmed_result = await db.execute(
            select(func.count(Reservation.id))
            .where(
                and_(
                    Reservation.restaurant_id == restaurant_id,
                    Reservation.reservation_datetime >= start_of_day,
                    Reservation.reservation_datetime <= end_of_day,
                    Reservation.status == "confirmed"
                )
            )
        )
        confirmed_reservations = confirmed_result.scalar() or 0
        
        # Cancelled reservations today
        cancelled_result = await db.execute(
            select(func.count(Reservation.id))
            .where(
                and_(
                    Reservation.restaurant_id == restaurant_id,
                    Reservation.reservation_datetime >= start_of_day,
                    Reservation.reservation_datetime <= end_of_day,
                    Reservation.status == "cancelled"
                )
            )
        )
        cancelled_reservations = cancelled_result.scalar() or 0
        
        # Total tables
        tables_result = await db.execute(
            select(func.count(Table.id))
            .where(Table.restaurant_id == restaurant_id)
        )
        total_tables = tables_result.scalar() or 0
        
        # Calculate occupancy rate (simplified)
        occupancy_rate = 0
        if total_tables > 0:
            occupancy_rate = min(100, int((confirmed_reservations / total_tables) * 100))
        
        return {
            "today_reservations": today_reservations,
            "confirmed_reservations": confirmed_reservations,
            "cancelled_reservations": cancelled_reservations,
            "occupancy_rate": occupancy_rate
        }