from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, reservations, tables, dashboard, config, agent
from app.core.config import settings


def create_app() -> FastAPI:
    app = FastAPI(
        title="Restaurant Reservation API",
        description="API para gestión de reservas de restaurante con agente IA",
        version="1.0.0"
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Frontend URLs
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(auth.router, prefix="/api/v1", tags=["authentication"])
    app.include_router(agent.router, prefix="/api/v1", tags=["agent"])
    app.include_router(reservations.router, prefix="/api/v1", tags=["reservations"])
    app.include_router(tables.router, prefix="/api/v1", tags=["tables"])
    app.include_router(dashboard.router, prefix="/api/v1", tags=["dashboard"])
    app.include_router(config.router, prefix="/api/v1", tags=["configuration"])

    @app.get("/")
    async def root():
        return {
            "message": "Restaurant Reservation API",
            "version": "1.0.0",
            "timezone": settings.timezone
        }

    @app.get("/health")
    async def health():
        return {"status": "healthy"}

    return app


app = create_app()