import pytest
from datetime import datetime, date


class TestAuthentication:
    async def test_login_success(self, client, test_user):
        """Test successful login"""
        login_data = {
            "username": test_user.email,
            "password": "testpassword"
        }
        response = await client.post("/api/v1/token", data=login_data)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    async def test_login_invalid_credentials(self, client, test_user):
        """Test login with invalid credentials"""
        login_data = {
            "username": test_user.email,
            "password": "wrongpassword"
        }
        response = await client.post("/api/v1/token", data=login_data)
        assert response.status_code == 401


class TestAgentEndpoints:
    async def test_check_availability_working_day(self, client, test_restaurant, test_tables):
        """Test availability checking on a working day"""
        request_data = {
            "restaurant_slug": test_restaurant.slug,
            "date": "2024-07-15",  # Monday
            "guests": 2
        }
        response = await client.post("/api/v1/agent/check-availability", json=request_data)
        assert response.status_code == 200
        data = response.json()
        assert "available_slots" in data
        # Should have available slots since no existing reservations
        assert len(data["available_slots"]) > 0
    
    async def test_check_availability_non_working_day(self, client, test_restaurant, test_tables):
        """Test availability checking on a non-working day"""
        request_data = {
            "restaurant_slug": test_restaurant.slug,
            "date": "2024-07-14",  # Sunday (not in work_days)
            "guests": 2
        }
        response = await client.post("/api/v1/agent/check-availability", json=request_data)
        assert response.status_code == 200
        data = response.json()
        assert "available_slots" in data
        # Should have no available slots on non-working day
        assert len(data["available_slots"]) == 0
    
    async def test_check_availability_invalid_restaurant(self, client):
        """Test availability checking with invalid restaurant slug"""
        request_data = {
            "restaurant_slug": "nonexistent-restaurant",
            "date": "2024-07-15",
            "guests": 2
        }
        response = await client.post("/api/v1/agent/check-availability", json=request_data)
        assert response.status_code == 200
        data = response.json()
        assert len(data["available_slots"]) == 0
    
    async def test_create_reservation_success(self, client, test_restaurant, test_tables):
        """Test successful reservation creation"""
        request_data = {
            "restaurant_slug": test_restaurant.slug,
            "customer_name": "John Doe",
            "customer_phone": "+1234567890",
            "date": "2024-07-15",  # Monday
            "time": "19:00",
            "guests": 2,
            "source": "voice"
        }
        response = await client.post("/api/v1/agent/create-reservation", json=request_data)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["reservation"] is not None
        assert data["reservation"]["customer_name"] == "John Doe"
    
    async def test_create_reservation_non_working_day(self, client, test_restaurant, test_tables):
        """Test reservation creation on non-working day"""
        request_data = {
            "restaurant_slug": test_restaurant.slug,
            "customer_name": "John Doe",
            "customer_phone": "+1234567890",
            "date": "2024-07-14",  # Sunday
            "time": "19:00",
            "guests": 2,
            "source": "voice"
        }
        response = await client.post("/api/v1/agent/create-reservation", json=request_data)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert "closed" in data["message"].lower()


class TestProtectedEndpoints:
    async def test_get_reservations_unauthorized(self, client):
        """Test accessing reservations without authentication"""
        response = await client.get("/api/v1/reservations?restaurant_id=1")
        assert response.status_code == 401
    
    async def test_get_reservations_authorized(self, client, auth_headers, test_restaurant):
        """Test accessing reservations with authentication"""
        response = await client.get(
            f"/api/v1/reservations?restaurant_id={test_restaurant.id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "pages" in data
    
    async def test_get_tables_authorized(self, client, auth_headers, test_restaurant):
        """Test accessing tables with authentication"""
        response = await client.get(
            f"/api/v1/tables?restaurant_id={test_restaurant.id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 3  # From test_tables fixture
    
    async def test_get_dashboard_stats(self, client, auth_headers, test_restaurant):
        """Test dashboard stats endpoint"""
        response = await client.get(
            f"/api/v1/dashboard/stats?restaurant_id={test_restaurant.id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "today_reservations" in data
        assert "confirmed_reservations" in data
        assert "cancelled_reservations" in data
        assert "occupancy_rate" in data
    
    async def test_get_restaurant_config(self, client, auth_headers, test_restaurant):
        """Test getting restaurant configuration"""
        response = await client.get(
            f"/api/v1/config/{test_restaurant.id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == test_restaurant.name
        assert data["slug"] == test_restaurant.slug
        assert data["work_days"] == test_restaurant.work_days


class TestHealthEndpoints:
    async def test_root_endpoint(self, client):
        """Test root endpoint"""
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
    
    async def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"