from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, JSON, Time, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
from datetime import datetime, timezone


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    work_days = Column(JSON, nullable=False, default=[1, 2, 3, 4, 5])  # 1=Monday, 7=Sunday
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    table_turnover_minutes = Column(Integer, default=0)
    last_booking_cutoff_minutes = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    tables = relationship("Table", back_populates="restaurant", cascade="all, delete-orphan")
    reservations = relationship("Reservation", back_populates="restaurant", cascade="all, delete-orphan")


class Table(Base):
    __tablename__ = "tables"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(Integer, nullable=False)
    capacity = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default="available")  # available, occupied, reserved, cleaning
    location = Column(String, nullable=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    restaurant = relationship("Restaurant", back_populates="tables")
    reservations = relationship("Reservation", back_populates="table")


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String, nullable=False)
    customer_phone = Column(String, nullable=False)
    customer_email = Column(String, nullable=True)
    reservation_datetime = Column(DateTime(timezone=True), nullable=False)
    guests = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default="pending")  # pending, confirmed, cancelled, completed
    source = Column(String, nullable=False, default="manual")  # voice, chat, manual
    notes = Column(Text, nullable=True)
    special_requests = Column(Text, nullable=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    table_id = Column(Integer, ForeignKey("tables.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    restaurant = relationship("Restaurant", back_populates="reservations")
    table = relationship("Table", back_populates="reservations")