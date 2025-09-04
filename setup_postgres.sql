-- Script para configurar PostgreSQL
-- Execute este script como superusuário do PostgreSQL

-- Criar usuário postgres se não existir
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'postgres') THEN
      
      CREATE ROLE postgres LOGIN PASSWORD 'password';
   END IF;
END
$do$;

-- Dar privilégios de superusuário ao postgres
ALTER ROLE postgres SUPERUSER CREATEDB CREATEROLE;

-- Criar banco de dados nextkanban se não existir
SELECT 'CREATE DATABASE nextkanban'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'nextkanban')\gexec

-- Dar privilégios ao usuário postgres no banco nextkanban
GRANT ALL PRIVILEGES ON DATABASE nextkanban TO postgres;

-- Conectar ao banco nextkanban e dar privilégios no schema public
\c nextkanban
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Definir privilégios padrão para futuras tabelas
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;