# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RestaurantApp is a complete restaurant reservation management system with FastAPI backend and Next.js frontend. Each restaurant gets its own instance with AI agent integration for voice/chat bots.

## Development Commands

### Backend (FastAPI)
```bash
cd backend

# Setup virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Database migrations
alembic upgrade head

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run tests
pytest

# Create sample data
python scripts/create_sample_data.py

# Create admin user
python scripts/create_user.py admin@restaurant.com password123
```

### Frontend (Next.js)
```bash
cd frontend

# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Linting
npm run lint

# Start production server
npm start
```

## Architecture

### Database Schema
- **Users**: Authentication (JWT-based)
- **Restaurants**: Multi-tenant configuration with work_days, hours, table_turnover_minutes, last_booking_cutoff_minutes
- **Tables**: Restaurant tables with capacity, status (available/occupied/reserved/cleaning), location
- **Reservations**: Customer bookings with datetime, guests, status (pending/confirmed/cancelled/completed), source (voice/chat/manual)

### API Structure
- **Public Endpoints**: `/api/v1/agent/*` - For AI bots (no auth required)
- **Protected Endpoints**: `/api/v1/*` - Dashboard functionality (JWT required)
- **Key Services**: `AgentService` handles intelligent availability checking with table turnover logic

### Frontend Architecture  
- **App Router**: Next.js 15 with React 19
- **UI Components**: shadcn/ui with Radix UI primitives
- **State Management**: React contexts (AuthContext)
- **API Client**: Centralized in `lib/api.ts` with automatic token handling
- **Styling**: Tailwind CSS with custom theme

### Key Business Logic

**Intelligent Availability System** (`backend/app/services/agent_service.py`):
- Considers table turnover times between bookings
- Applies last booking cutoff rules before closing time
- Optimizes table assignment by capacity matching
- Handles timezone conversions (America/Santo_Domingo)

**Multi-tenant Design**:
- Each restaurant identified by unique slug
- Restaurant-specific configurations (work days, hours, turnover times)
- Data isolation per restaurant

## Configuration

### Environment Variables
Backend requires:
- Database connection settings
- JWT secret key
- Timezone configuration (defaults to America/Santo_Domingo)

Frontend requires:
- `NEXT_PUBLIC_API_URL` (defaults to http://localhost:8000/api/v1)

### Database Setup
PostgreSQL required with timezone support. Use provided SQL commands in README.md for initial setup.

## Testing

Backend uses pytest with async support configured in `pytest.ini`. Tests located in `backend/tests/`.

Frontend uses Next.js built-in testing capabilities.

## AI Agent Integration

Two main public endpoints for voice/chat bots:
- `POST /api/v1/agent/check-availability`: Returns available time slots with table IDs
- `POST /api/v1/agent/create-reservation`: Creates reservations from AI agents

The system handles timezone-aware bookings and intelligent table assignment without requiring authentication for AI agents.