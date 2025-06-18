-- PostgreSQL Database Setup Script for Restaurant Reservation System
-- Run this script as a PostgreSQL superuser or user with CREATEDB privileges

-- Create user
CREATE USER restaurant_user WITH PASSWORD 'password';

-- Create database
CREATE DATABASE restaurant_db
    WITH
    OWNER = restaurant_user
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.utf8'
    LC_CTYPE = 'en_US.utf8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE restaurant_db TO restaurant_user;

-- Connect to the new database and set timezone
\c restaurant_db;

-- Set timezone for the database
ALTER DATABASE restaurant_db SET TIMEZONE TO 'America/Santo_Domingo';

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO restaurant_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO restaurant_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO restaurant_user;