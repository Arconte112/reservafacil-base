# RestaurantApp - Sistema de Reservas Completo

Sistema completo de gestión de reservas de restaurante con backend FastAPI y frontend Next.js, diseñado para que cada restaurante tenga su propia instancia.

## 🏗️ Arquitectura

### Backend (FastAPI)
- **API REST** con autenticación JWT
- **Base de datos PostgreSQL** con soporte de timezone
- **Endpoints públicos para agentes IA** (voice/chat bots)
- **Endpoints protegidos para dashboard administrativo**
- **Sistema de disponibilidad inteligente** con turnover de mesas y cutoff de reservas

### Frontend (Next.js)
- **Dashboard administrativo** con autenticación
- **Gestión de reservas, mesas y configuración**
- **Interfaz responsive** con componentes shadcn/ui
- **Integración completa con la API**

## 🚀 Instalación y Configuración

### Prerrequisitos
- Python 3.8+
- Node.js 18+
- PostgreSQL 12+

### 1. Configuración de la Base de Datos

```sql
-- Ejecutar como superusuario de PostgreSQL
psql -U postgres

-- Crear usuario y base de datos
CREATE USER restaurant_user WITH PASSWORD 'password';
CREATE DATABASE restaurant_db
    WITH OWNER = restaurant_user
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.utf8'
    LC_CTYPE = 'en_US.utf8';

-- Configurar timezone
ALTER DATABASE restaurant_db SET TIMEZONE TO 'America/Santo_Domingo';
GRANT ALL PRIVILEGES ON DATABASE restaurant_db TO restaurant_user;
```

### 2. Configuración del Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Ejecutar migraciones
alembic upgrade head

# Crear usuario administrador
python scripts/create_user.py admin@restaurant.com password123

# Crear datos de ejemplo (opcional)
python scripts/create_sample_data.py

# Ejecutar servidor de desarrollo
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Configuración del Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" > .env.local

# Ejecutar servidor de desarrollo
npm run dev
```

## 📊 Estructura del Proyecto

### Backend (`/backend`)
```
backend/
├── app/
│   ├── core/           # Configuración global
│   ├── db/             # Modelos de base de datos
│   ├── schemas/        # Esquemas Pydantic
│   ├── services/       # Lógica de negocio
│   ├── routers/        # Endpoints de la API
│   └── security/       # Autenticación y seguridad
├── scripts/            # Scripts de utilidad
├── tests/              # Pruebas automatizadas
├── alembic/            # Migraciones de DB
└── requirements.txt
```

### Frontend (`/frontend`)
```
frontend/
├── app/                # Páginas de Next.js
├── components/         # Componentes React
├── contexts/           # Contextos (Auth, etc.)
├── lib/                # Utilidades y API client
└── package.json
```

## 🔌 API Endpoints

### Endpoints Públicos (para Agentes IA)
- `POST /api/v1/agent/check-availability` - Verificar disponibilidad
- `POST /api/v1/agent/create-reservation` - Crear reserva

### Endpoints Protegidos (Dashboard)
- `POST /api/v1/token` - Autenticación
- `GET /api/v1/dashboard/stats` - Estadísticas del dashboard
- `GET /api/v1/reservations` - Listar reservas (con filtros y paginación)
- `PUT /api/v1/reservations/{id}` - Actualizar reserva
- `GET /api/v1/tables` - Listar mesas
- `PUT /api/v1/tables/{id}` - Actualizar mesa
- `GET /api/v1/config/{restaurant_id}` - Obtener configuración
- `PUT /api/v1/config/{restaurant_id}` - Actualizar configuración

## 🤖 Integración con Agentes IA

### Verificar Disponibilidad
```json
POST /api/v1/agent/check-availability
{
  "restaurant_slug": "restaurante-central",
  "date": "2024-07-15",
  "guests": 4
}

Response:
{
  "available_slots": {
    "02:00 PM": [1, 5, 8],
    "02:30 PM": [1, 5, 8],
    "07:00 PM": [2, 3, 4]
  }
}
```

### Crear Reserva
```json
POST /api/v1/agent/create-reservation
{
  "restaurant_slug": "restaurante-central",
  "customer_name": "Juan Pérez",
  "customer_phone": "+1809555123",
  "date": "2024-07-15",
  "time": "19:00",
  "guests": 4,
  "source": "voice"
}

Response:
{
  "success": true,
  "reservation": {...},
  "message": "Reservation created successfully"
}
```

## ⚙️ Configuración del Restaurante

El sistema permite configurar:
- **Días de trabajo** (Lun-Dom)
- **Horarios de operación** (hora inicio/fin)
- **Tiempo de rotación de mesa** (minutos)
- **Tiempo límite para última reserva** (minutos antes del cierre)

## 🧪 Pruebas

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

## 📈 Características Avanzadas

### Sistema de Disponibilidad Inteligente
- Considera el tiempo de rotación de mesas
- Aplica reglas de cutoff para reservas tardías
- Optimiza asignación de mesas por capacidad
- Maneja zonas horarias correctamente

### Seguridad
- Autenticación JWT para dashboard
- Endpoints públicos para agentes IA
- Validación estricta de datos
- Manejo seguro de contraseñas

### Experiencia de Usuario
- Dashboard responsive
- Notificaciones en tiempo real
- Estados de carga y error
- Filtros y paginación avanzados

## 🔧 Personalización

### Agregar Nuevos Campos
1. Actualizar modelos en `backend/app/db/models.py`
2. Crear migración con Alembic
3. Actualizar esquemas Pydantic
4. Modificar componentes del frontend

### Integrar con Otros Servicios
- SMS/Email notifications
- Sistemas de pago
- Integración con POS
- Analytics avanzados

## 🚀 Despliegue en Producción

### Backend
- Usar servidor ASGI (uvicorn, gunicorn)
- Configurar proxy reverso (nginx)
- Base de datos PostgreSQL dedicada
- Variables de entorno seguras

### Frontend
- Build optimizado (`npm run build`)
- Servir archivos estáticos
- Configurar dominio y SSL

### Docker (Recomendado)
```bash
# Backend
docker build -t restaurant-api ./backend
docker run -p 8000:8000 restaurant-api

# Frontend  
docker build -t restaurant-frontend ./frontend
docker run -p 3000:3000 restaurant-frontend
```

## 📞 Soporte

Para problemas o consultas:
1. Revisar logs del backend y frontend
2. Verificar configuración de base de datos
3. Confirmar variables de entorno
4. Probar endpoints con herramientas como Postman

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.