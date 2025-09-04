-- Script para criar usuários no NextKanban
-- Execute este script no banco de dados PostgreSQL de produção

-- 1. Primeiro, habilite a extensão pgcrypto (se ainda não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Torne a coluna email opcional (se ainda não foi feito)
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- 3. Exemplo de criação de usuário
-- Substitua 'nome_usuario' e 'senha_do_usuario' pelos valores desejados
-- INSERT INTO users (username, password_hash) VALUES ('nome_usuario', crypt('senha_do_usuario', gen_salt('bf')));

-- Exemplos de usuários:
-- INSERT INTO users (username, password_hash) VALUES ('admin', crypt('admin123', gen_salt('bf')));
-- INSERT INTO users (username, password_hash) VALUES ('user1', crypt('password123', gen_salt('bf')));

-- Para verificar os usuários criados:
-- SELECT id, username, created_at FROM users;