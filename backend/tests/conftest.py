import pytest
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool
from httpx import AsyncClient
from app.main import create_app
from app.db.database import Base, get_db
from app.db.models import User, Restaurant, Table
from app.security.auth import get_password_hash
from datetime import time


# Test database URL (using sqlite for tests)
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

# Create async engine for testing
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False
)


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def db_session():
    """Create a fresh database session for each test."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with TestingSessionLocal() as session:
        yield session
    
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def app():
    """Create a test FastAPI app."""
    return create_app()


@pytest.fixture
async def client(app, db_session):
    """Create a test client with database session override."""
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def test_user(db_session):
    """Create a test user."""
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("testpassword")
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_restaurant(db_session):
    """Create a test restaurant."""
    restaurant = Restaurant(
        name="Test Restaurant",
        slug="test-restaurant",
        work_days=[1, 2, 3, 4, 5],
        start_time=time(9, 0),
        end_time=time(22, 0),
        table_turnover_minutes=90,
        last_booking_cutoff_minutes=60
    )
    db_session.add(restaurant)
    await db_session.commit()
    await db_session.refresh(restaurant)
    return restaurant


@pytest.fixture
async def test_tables(db_session, test_restaurant):
    """Create test tables."""
    tables = [
        Table(number=1, capacity=2, restaurant_id=test_restaurant.id, location="Window"),
        Table(number=2, capacity=4, restaurant_id=test_restaurant.id, location="Center"),
        Table(number=3, capacity=6, restaurant_id=test_restaurant.id, location="Private"),
    ]
    
    for table in tables:
        db_session.add(table)
    
    await db_session.commit()
    
    for table in tables:
        await db_session.refresh(table)
    
    return tables


@pytest.fixture
async def auth_headers(client, test_user):
    """Get authentication headers for test user."""
    login_data = {
        "username": test_user.email,
        "password": "testpassword"
    }
    response = await client.post("/api/v1/token", data=login_data)
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}