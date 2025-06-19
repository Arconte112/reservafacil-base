# Docker Deployment Guide

This guide explains how to deploy the RestaurantApp using Docker Compose.

## Quick Start

1. **Clone and setup**:
   ```bash
   git clone <repository-url>
   cd reservafacil-base
   cp .env.example .env
   ```

2. **Start all services**:
   ```bash
   docker-compose up -d
   ```

3. **Access the application**:
   - Frontend: http://localhost
   - API: http://localhost/api/v1
   - Database: localhost:5432

## Services

### PostgreSQL Database
- **Container**: `reservafacil_postgres`
- **Port**: 5432
- **Database**: `reservas_db`
- **Credentials**: postgres/postgres (change in production)

### FastAPI Backend
- **Container**: `reservafacil_backend`
- **Port**: 8000 (internal)
- **Health check**: `/health` endpoint
- **Auto-migrations**: Runs `alembic upgrade head` on startup

### Next.js Frontend
- **Container**: `reservafacil_frontend`
- **Port**: 3000 (internal)
- **Build**: Multi-stage Docker build with development/production targets

### Nginx Reverse Proxy
- **Container**: `reservafacil_nginx`
- **Port**: 80
- **Routes**:
  - `/` → Frontend (Next.js)
  - `/api/` → Backend (FastAPI)
  - `/health` → Backend health check

## Development vs Production

### Development Mode (default)
```bash
docker-compose up
```
- Uses `docker-compose.override.yml`
- Hot reload for both frontend and backend
- Mounted volumes for live code changes
- Extended token expiration (60 minutes)

### Production Mode
```bash
docker-compose -f docker-compose.yml up -d
```
- Optimized production builds
- No volume mounts
- Security-focused configuration
- Shorter token expiration (30 minutes)

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/reservas_db

# Security (CHANGE THESE IN PRODUCTION!)
SECRET_KEY=your-secret-key-change-in-production
POSTGRES_PASSWORD=secure-password

# Application
TIMEZONE=America/Santo_Domingo
NEXT_PUBLIC_API_URL=http://localhost/api/v1
```

## Common Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f [service-name]

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up --build -d

# Run database migrations
docker-compose exec backend alembic upgrade head

# Create admin user
docker-compose exec backend python scripts/create_user.py admin@restaurant.com password123

# Access database
docker-compose exec postgres psql -U postgres -d reservas_db
```

## Data Persistence

- **Database data**: Stored in `postgres_data` Docker volume
- **Backups**: Use `pg_dump` through the postgres container

## Health Checks

All services include health checks:
- **PostgreSQL**: `pg_isready`
- **Backend**: HTTP check on `/health`
- **Frontend**: Built-in Next.js health
- **Nginx**: Depends on upstream services

## Scaling

Scale individual services:
```bash
# Scale backend to 3 instances
docker-compose up -d --scale backend=3

# Scale frontend to 2 instances  
docker-compose up -d --scale frontend=2
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in `docker-compose.yml`
2. **Database connection**: Ensure PostgreSQL is healthy before backend starts
3. **CORS errors**: Check nginx configuration and API_URL environment variable
4. **Build failures**: Clean Docker cache with `docker system prune`

### Logs and Debugging

```bash
# View all logs
docker-compose logs

# Follow specific service logs
docker-compose logs -f backend

# Execute commands in containers
docker-compose exec backend bash
docker-compose exec frontend sh
```

## Security Considerations

### For Production:

1. **Change default passwords**:
   ```env
   POSTGRES_PASSWORD=strong-random-password
   SECRET_KEY=long-random-secret-key
   ```

2. **Use environment-specific configs**:
   ```bash
   # Production deployment
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

3. **Enable HTTPS**: Add SSL termination to nginx configuration

4. **Restrict CORS**: Update backend CORS settings for production domains

5. **Database security**: Use connection encryption and restricted user permissions