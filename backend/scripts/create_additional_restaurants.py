#!/usr/bin/env python3
"""
Script to create additional restaurants for testing
Usage: python scripts/create_additional_restaurants.py
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


async def create_additional_restaurants():
    async with AsyncSessionLocal() as db:
        print("Creating additional restaurants...")
        
        restaurants_data = [
            {
                "name": "El Comedor",
                "slug": "el-comedor",
                "work_days": [1, 2, 3, 4, 5, 6, 7],  # All days
                "start_time": time(8, 0),   # 8:00 AM
                "end_time": time(23, 0),    # 11:00 PM
                "table_turnover_minutes": 120,
                "last_booking_cutoff_minutes": 30
            },
            {
                "name": "Restaurante Central",
                "slug": "restaurante-central", 
                "work_days": [1, 2, 3, 4, 5, 6],  # Monday to Saturday
                "start_time": time(9, 0),   # 9:00 AM
                "end_time": time(22, 0),    # 10:00 PM
                "table_turnover_minutes": 90,
                "last_booking_cutoff_minutes": 60
            }
        ]
        
        for restaurant_info in restaurants_data:
            # Check if restaurant already exists
            existing = await RestaurantCRUD.get_restaurant_by_slug(db, restaurant_info["slug"])
            if existing:
                print(f"⚠️  Restaurant {restaurant_info['name']} already exists, skipping...")
                continue
                
            restaurant_data = RestaurantCreate(**restaurant_info)
            restaurant = await RestaurantCRUD.create_restaurant(db, restaurant_data)
            print(f"✅ Created restaurant: {restaurant.name} (ID: {restaurant.id}, Slug: {restaurant.slug})")
            
            # Create sample tables for each restaurant
            tables_data = [
                {"number": 1, "capacity": 2, "location": "Ventana"},
                {"number": 2, "capacity": 4, "location": "Centro"},
                {"number": 3, "capacity": 2, "location": "Ventana"},
                {"number": 4, "capacity": 6, "location": "Centro"},
                {"number": 5, "capacity": 4, "location": "Terraza"},
                {"number": 6, "capacity": 8, "location": "Privado"},
                {"number": 7, "capacity": 2, "location": "Barra"},
                {"number": 8, "capacity": 4, "location": "Centro"},
            ]
            
            for table_info in tables_data:
                table_data = TableCreate(
                    number=table_info["number"],
                    capacity=table_info["capacity"],
                    location=table_info["location"],
                    restaurant_id=restaurant.id
                )
                table = await TableCRUD.create_table(db, table_data)
                print(f"  ✅ Created table {table.number} (capacity: {table.capacity})")
        
        print(f"\n🎉 Additional restaurants created successfully!")


def main():
    try:
        asyncio.run(create_additional_restaurants())
    except Exception as e:
        print(f"Error creating additional restaurants: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()