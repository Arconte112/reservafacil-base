from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.db.database import get_db
from app.db.models import User
from app.security.auth import get_current_active_user
from app.services.crud import TableCRUD
from app.schemas.table import Table, TableCreate, TableUpdate

router = APIRouter()


@router.get("/tables", response_model=List[Table])
async def get_tables(
    restaurant_id: int = Query(..., description="Restaurant ID"),
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=100, description="Number of items to return"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all tables for a restaurant"""
    return await TableCRUD.get_tables(db, restaurant_id, skip, limit)


@router.get("/tables/{table_id}", response_model=Table)
async def get_table(
    table_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific table by ID"""
    table = await TableCRUD.get_table(db, table_id)
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found"
        )
    return table


@router.post("/tables", response_model=Table)
async def create_table(
    table: TableCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new table"""
    return await TableCRUD.create_table(db, table)


@router.put("/tables/{table_id}", response_model=Table)
async def update_table(
    table_id: int,
    table_update: TableUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a table"""
    table = await TableCRUD.update_table(db, table_id, table_update)
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found"
        )
    return table


@router.delete("/tables/{table_id}")
async def delete_table(
    table_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a table"""
    success = await TableCRUD.delete_table(db, table_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Table not found"
        )
    return {"message": "Table deleted successfully"}