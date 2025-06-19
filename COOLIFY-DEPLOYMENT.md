# Coolify Deployment Instructions

## Environment Variables Configuration

Set these environment variables in Coolify for your application:

### Required Variables
```bash
# Application Configuration
APP_URL=https://your-coolify-domain.com
ENVIRONMENT=production

# Database Configuration  
DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/reservas_db
POSTGRES_DB=reservas_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# JWT Configuration
SECRET_KEY=your-secure-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application Settings
TIMEZONE=America/Santo_Domingo

# Docker/Node Configuration
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

## Post-Deployment Setup

After the first deployment, you need to create sample data:

1. **Run database migrations:**
   ```bash
   docker-compose exec backend alembic upgrade head
   ```

2. **Create sample restaurants and tables:**
   ```bash
   docker-compose exec backend python scripts/create_additional_restaurants.py
   ```

3. **Create an admin user:**
   ```bash
   docker-compose exec backend python scripts/create_user.py admin@restaurant.com password123
   ```

## Testing the Agent Endpoint

Test availability endpoint:
```bash
curl -X POST https://your-domain.com/api/v1/agent/check-availability \
  -H "Content-Type: application/json" \
  -d '{
    "restaurant_slug": "restaurante-central",
    "date": "2025-06-20",  
    "guests": 2
  }'
```

Should return available time slots with table numbers.

## Available Restaurant Slugs
- `restaurante-central` - Open Mon-Sat, 9AM-10PM
- `el-comedor` - Open daily, 8AM-11PM

## Troubleshooting

1. **Empty JSON response**: Check if sample data was created
2. **Database connection errors**: Verify DATABASE_URL format
3. **CORS errors**: Ensure APP_URL matches your domain exactly
4. **Development override conflict**: The `docker-compose.override.yml` file has been renamed to `.dev` to prevent conflicts in production