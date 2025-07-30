-- Initialize the Camino Journal database
-- This script runs when the PostgreSQL container starts for the first time

-- Create database if it doesn't exist (though it should be created by POSTGRES_DB)
SELECT 'CREATE DATABASE camino_journal'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'camino_journal')\gexec

-- Connect to the database
\c camino_journal;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search optimization

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE camino_journal TO camino_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO camino_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO camino_user;
GRANT USAGE ON SCHEMA public TO camino_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO camino_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO camino_user;