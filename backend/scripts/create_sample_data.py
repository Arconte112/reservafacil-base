#!/usr/bin/env python3
"""
Script to create sample restaurant and table data
Usage: python scripts/create_sample_data.py
"""

import sys
import asyncio
from pathlib import Path
from datetime import time

# Add the app directory to the Python path
sys.path.append(str(Path(__file__).parent.parent))

from app.db.database import AsyncSessionLocal
from app.services.crud import RestaurantCRUD, TableCRUD
from app.schemas.restaurant import RestaurantCreate
from app.schemas.table import TableCreate


async def create_sample_data():
    async with AsyncSessionLocal() as db:
        print("Creating sample restaurant and table data...")
        
        # Create sample restaurant
        restaurant_data = RestaurantCreate(
            name="Restaurante Central",
            slug="restaurante-central",
            work_days=[1, 2, 3, 4, 5, 6],  # Monday to Saturday
            start_time=time(9, 0),   # 9:00 AM
            end_time=time(22, 0),    # 10:00 PM
            table_turnover_minutes=90,
            last_booking_cutoff_minutes=60
        )
        
        restaurant = await RestaurantCRUD.create_restaurant(db, restaurant_data)
        print(f"✅ Created restaurant: {restaurant.name} (ID: {restaurant.id})")
        
        # Create sample tables
        tables_data = [
            {"number": 1, "capacity": 2, "location": "Ventana"},
            {"number": 2, "capacity": 4, "location": "Centro"},
            {"number": 3, "capacity": 2, "location": "Ventana"},
            {"number": 4, "capacity": 6, "location": "Centro"},
            {"number": 5, "capacity": 4, "location": "Terraza"},
            {"number": 6, "capacity": 8, "location": "Privado"},
            {"number": 7, "capacity": 2, "location": "Barra"},
            {"number": 8, "capacity": 4, "location": "Centro"},
            {"number": 9, "capacity": 2, "location": "Ventana"},
            {"number": 10, "capacity": 4, "location": "Terraza"},
        ]
        
        for table_info in tables_data:
            table_data = TableCreate(
                number=table_info["number"],
                capacity=table_info["capacity"],
                location=table_info["location"],
                restaurant_id=restaurant.id
            )
            table = await TableCRUD.create_table(db, table_data)
            print(f"✅ Created table {table.number} (capacity: {table.capacity}, location: {table.location})")
        
        print(f"\n🎉 Sample data created successfully!")
        print(f"Restaurant ID: {restaurant.id}")
        print(f"Restaurant Slug: {restaurant.slug}")
        print(f"Total Tables: {len(tables_data)}")
        print(f"\nYou can now use restaurant ID '{restaurant.id}' in the frontend!")


def main():
    try:
        asyncio.run(create_sample_data())
    except Exception as e:
        print(f"Error creating sample data: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()