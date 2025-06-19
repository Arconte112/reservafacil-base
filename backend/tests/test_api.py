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
    
    async def test_get_tables_authorized(self, client, auth_headers, test_restaurant, test_tables):
        """Test accessing tables with authentication"""
        response = await client.get(
            f"/api/v1/tables?restaurant_id={test_restaurant.id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= len(test_tables)  # Should have at least the test tables
    
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


class TestRestaurantEndpoints:
    async def test_get_restaurants(self, client, auth_headers, test_restaurant):
        """Test GET /restaurants endpoint"""
        response = await client.get("/api/v1/restaurants", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        
        restaurant = data[0]
        assert "id" in restaurant
        assert "name" in restaurant
        assert "slug" in restaurant
        assert restaurant["name"] == test_restaurant.name
        assert restaurant["slug"] == test_restaurant.slug

    async def test_get_restaurants_unauthorized(self, client):
        """Test GET /restaurants without authentication"""
        response = await client.get("/api/v1/restaurants")
        assert response.status_code == 401


class TestDashboardEndpoints:
    async def test_get_weekly_stats(self, client, auth_headers, test_restaurant):
        """Test GET /dashboard/weekly-stats endpoint"""
        response = await client.get(
            f"/api/v1/dashboard/weekly-stats?restaurant_id={test_restaurant.id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 7  # Should return 7 days
        
        if data:
            day_stat = data[0]
            assert "day" in day_stat
            assert "date" in day_stat
            assert "reservations" in day_stat
            assert "confirmed" in day_stat

    async def test_get_top_customers(self, client, auth_headers, test_restaurant):
        """Test GET /dashboard/top-customers endpoint"""
        response = await client.get(
            f"/api/v1/dashboard/top-customers?restaurant_id={test_restaurant.id}&limit=5",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 5  # Should respect limit
        
        if data:
            customer = data[0]
            assert "name" in customer
            assert "total_reservations" in customer
            assert isinstance(customer["total_reservations"], int)

    async def test_dashboard_unauthorized(self, client, test_restaurant):
        """Test dashboard endpoints without authentication"""
        endpoints = [
            f"/api/v1/dashboard/weekly-stats?restaurant_id={test_restaurant.id}",
            f"/api/v1/dashboard/top-customers?restaurant_id={test_restaurant.id}"
        ]
        
        for endpoint in endpoints:
            response = await client.get(endpoint)
            assert response.status_code == 401


class TestTableEndpoints:
    async def test_get_tables_with_reservations(self, client, auth_headers, test_restaurant, test_tables):
        """Test GET /tables/with-reservations endpoint"""
        response = await client.get(
            f"/api/v1/tables/with-reservations?restaurant_id={test_restaurant.id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= len(test_tables)
        
        if data:
            table = data[0]
            assert "id" in table
            assert "number" in table
            assert "capacity" in table
            assert "status" in table
            assert "restaurant_id" in table
            # current_reservation is optional and may be None
            
    async def test_tables_unauthorized(self, client, test_restaurant):
        """Test tables endpoints without authentication"""
        response = await client.get(
            f"/api/v1/tables/with-reservations?restaurant_id={test_restaurant.id}"
        )
        assert response.status_code == 401