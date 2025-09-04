-- Script para migrar de email para username
-- Adicionar coluna username à tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;

-- Atualizar usuários existentes para ter username baseado no email (temporário)
UPDATE users SET username = SPLIT_PART(email, '@', 1) WHERE username IS NULL;

-- Tornar username obrigatório
ALTER TABLE users ALTER COLUMN username SET NOT NULL;

-- Adicionar usuário ikedoebber
-- Senha: zeus120511 (será hasheada pela aplicação)
INSERT INTO users (username, email, password_hash) 
VALUES ('ikedoebber', 'ikedoebber@example.com', '$2a$12$placeholder_hash_will_be_replaced')
ON CONFLICT (username) DO NOTHING;

-- Criar índice para username
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);