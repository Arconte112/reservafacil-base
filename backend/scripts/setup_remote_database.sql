-- Script para configurar la base de datos remota PostgreSQL
-- Ejecutar esto conectándose a la base de datos remota

-- Configurar timezone para la base de datos
ALTER DATABASE reservafacilbase SET TIMEZONE TO 'America/Santo_Domingo';

-- Si necesitas crear extensiones adicionales (opcional)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verificar la configuración
SELECT name, setting FROM pg_settings WHERE name = 'timezone';

-- Mostrar información de la base de datos
SELECT current_database(), current_user, version();