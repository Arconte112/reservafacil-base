#!/usr/bin/env python3
"""
Script to test login functionality and verify user credentials
"""
import asyncio
from passlib.context import CryptContext
from app.db.database import get_db
from app.services.crud import get_user_by_email

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

async def test_login():
    print("🔍 Testing login functionality...")
    print("-" * 50)
    
    async for db in get_db():
        # Check if user exists
        user = await get_user_by_email(db, 'test@restaurante.com')
        
        if user:
            print(f"✅ Usuario encontrado:")
            print(f"   - ID: {user.id}")
            print(f"   - Email: {user.email}")
            print(f"   - Created: {user.created_at}")
            print(f"   - Hash: {user.hashed_password}")
            print()
            
            # Test password verification
            test_password = "123456"
            is_valid = pwd_context.verify(test_password, user.hashed_password)
            
            if is_valid:
                print(f"✅ Contraseña '{test_password}' es VÁLIDA")
            else:
                print(f"❌ Contraseña '{test_password}' es INVÁLIDA")
                
            # Test hash generation for comparison
            new_hash = pwd_context.hash(test_password)
            print(f"   - Nuevo hash generado: {new_hash}")
            
        else:
            print("❌ Usuario NO encontrado en la base de datos")
            print("   - Verifica que el script create_user.py funcionó correctamente")
        
        break

if __name__ == "__main__":
    asyncio.run(test_login())