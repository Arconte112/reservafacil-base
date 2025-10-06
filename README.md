# RestaurantApp – Plataforma Integral de Reservas

RestaurantApp es una solución end-to-end para la gestión de reservas de restaurantes. Combina un backend construido con **FastAPI** y un dashboard administrativo desarrollado con **Next.js**, permitiendo operar múltiples restaurantes, automatizar la disponibilidad inteligente y habilitar integraciones con agentes de voz o chat.

## Características principales
- **API REST segura** con autenticación JWT y zonas horarias configurables.
- **Motor de disponibilidad** que aplica rotación de mesas, cut-off y control de ocupación.
- **Dashboard responsive** para administrar reservas, mesas y configuración general.
- **Integración para agentes IA** (voz/chat) mediante endpoints públicos optimizados.
- **Pipeline de pruebas automatizadas** para el backend (pytest).

## Arquitectura
```
reservafacil-base/
├── backend/         # FastAPI + SQLAlchemy + Alembic
│   ├── app/         # Routers, servicios y esquemas
│   ├── scripts/     # Scripts utilitarios (bootstrap, seed)
│   └── tests/       # Pruebas unitarias y de servicio
└── frontend/        # Next.js 14 (App Router) + shadcn/ui + Zustand
    ├── app/         # Páginas y layouts
    ├── components/  # UI y vistas reutilizables
    └── lib/         # API client y helpers
```

## Requisitos previos
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- Docker (opcional para despliegue)

## Configuración rápida
### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # En Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Ajusta credenciales y claves JWT
alembic upgrade head  # Migraciones iniciales
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local  # Define NEXT_PUBLIC_API_URL
npm run dev
```

## Variables de entorno
| Servicio  | Variable | Descripción |
|-----------|----------|-------------|
| Backend   | `DATABASE_URL` | Cadena de conexión PostgreSQL (asyncpg). |
|           | `JWT_SECRET_KEY` | Clave para generar tokens JWT. |
|           | `TIMEZONE` | Zona horaria por defecto (ej. `America/Santo_Domingo`). |
| Frontend  | `NEXT_PUBLIC_API_URL` | URL base del backend (por defecto `http://localhost:8000/api/v1`). |

Consulte los archivos `.env.example` en cada paquete para ver el listado completo.

## Comandos útiles
### Tests backend
```bash
cd backend
pytest
```

### Scripts de utilidades
```bash
python scripts/create_user.py admin@example.com supersecure
python scripts/create_sample_data.py
```

### Construcción Docker
```bash
# Backend
docker build -t restaurantapp-api ./backend

# Frontend
docker build -t restaurantapp-dashboard ./frontend
```

## API destacada
- `POST /api/v1/agent/check-availability`: calcula slots disponibles
- `POST /api/v1/agent/create-reservation`: crea una reserva desde asistentes externos
- `GET /api/v1/dashboard/stats`: métricas consolidadas para el panel

La documentación completa de endpoints se puede consultar generando el esquema OpenAPI en `http://localhost:8000/docs`.

## Roadmap sugerido
- Webhooks para notificaciones (SMS/Email).
- Integración con POS y sistemas de facturación.
- Soporte multi-tenant (tenant por restaurante).
- Dashboard en tiempo real con WebSockets.

## Licencia
Este proyecto se distribuye bajo licencia **MIT**. Consulte `LICENSE` para más detalles.
