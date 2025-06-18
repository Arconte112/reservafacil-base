#!/usr/bin/env python3
"""
Script to create an admin user for the restaurant reservation system.
Usage: python scripts/create_user.py <email> <password>
"""

import sys
import asyncio
from pathlib import Path

# Add the app directory to the Python path
sys.path.append(str(Path(__file__).parent.parent))

from app.db.database import AsyncSessionLocal
from app.services.crud import UserCRUD
from app.schemas.auth import UserCreate


async def create_admin_user(email: str, password: str):
    async with AsyncSessionLocal() as db:
        # Check if user already exists
        existing_user = await UserCRUD.get_user_by_email(db, email)
        if existing_user:
            print(f"User with email {email} already exists!")
            return False
        
        # Create new user
        user_create = UserCreate(email=email, password=password)
        user = await UserCRUD.create_user(db, user_create)
        
        print(f"Admin user created successfully!")
        print(f"Email: {user.email}")
        print(f"ID: {user.id}")
        return True


def main():
    if len(sys.argv) != 3:
        print("Usage: python scripts/create_user.py <email> <password>")
        print("Example: python scripts/create_user.py admin@restaurant.com mypassword123")
        sys.exit(1)
    
    email = sys.argv[1]
    password = sys.argv[2]
    
    if not email or "@" not in email:
        print("Error: Please provide a valid email address")
        sys.exit(1)
    
    if len(password) < 6:
        print("Error: Password must be at least 6 characters long")
        sys.exit(1)
    
    try:
        success = asyncio.run(create_admin_user(email, password))
        if success:
            print("\nYou can now use these credentials to log in to the restaurant dashboard.")
        else:
            sys.exit(1)
    except Exception as e:
        print(f"Error creating user: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()