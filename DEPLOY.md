# 🚀 Guia de Deploy - NextKanban

## 📋 Pré-requisitos

- PostgreSQL configurado e rodando
- Node.js 18+ instalado
- Docker (opcional, mas recomendado)

## 🗄️ Configuração do Banco de Dados

### 1. Criar o banco de dados
```sql
CREATE DATABASE nextkanban;
CREATE USER nextkanban_user WITH PASSWORD 'sua_senha_segura';
GRANT ALL PRIVILEGES ON DATABASE nextkanban TO nextkanban_user;
```

### 2. Executar as migrações
```bash
# Execute os scripts SQL na seguinte ordem:
psql -U postgres -d nextkanban -f init.sql
psql -U postgres -d nextkanban -f migrate_to_username.sql
```

### 3. Configurar extensões necessárias
```sql
-- Conecte ao banco nextkanban
\c nextkanban

-- Habilite a extensão para criptografia
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Torne a coluna email opcional
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
```

## 👤 Criação de Usuários

### Método 1: Usando o script SQL
```bash
# Execute o script create_user.sql
psql -U postgres -d nextkanban -f create_user.sql

# Depois edite o script e adicione seus usuários:
# INSERT INTO users (username, password_hash) VALUES ('admin', crypt('senha_admin', gen_salt('bf')));
```

### Método 2: Comando direto
```sql
-- Conecte ao banco
psql -U postgres -d nextkanban

-- Crie um usuário (substitua os valores)
INSERT INTO users (username, password_hash) 
VALUES ('nome_usuario', crypt('senha_usuario', gen_salt('bf')));

-- Verifique se foi criado
SELECT id, username, created_at FROM users;
```

### Método 3: Via Docker (se usando container)
```bash
# Se o PostgreSQL estiver em container
docker exec -it nome_do_container psql -U postgres -d nextkanban -c \
  "INSERT INTO users (username, password_hash) VALUES ('admin', crypt('admin123', gen_salt('bf')));"
```

## 🌐 Configuração da Aplicação

### 1. Variáveis de ambiente
Crie um arquivo `.env.local` baseado no `.env.example`:

```env
# Database
DATABASE_URL=postgresql://nextkanban_user:sua_senha@localhost:5432/nextkanban

# NextAuth
NEXTAUTH_URL=http://seu-dominio.com
NEXTAUTH_SECRET=sua_chave_secreta_muito_longa_e_segura

# Outras configurações...
```

### 2. Build e Deploy
```bash
# Instalar dependências
npm install

# Build da aplicação
npm run build

# Iniciar em produção
npm start
```

## 🐳 Deploy com Docker

### 1. Build da imagem
```bash
docker build -t nextkanban .
```

### 2. Executar com docker-compose
```bash
# Para produção, crie um docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up -d
```

## ✅ Verificação do Deploy

1. **Teste de conexão com banco:**
   ```sql
   SELECT version();
   SELECT * FROM users LIMIT 1;
   ```

2. **Teste de login:**
   - Acesse a aplicação
   - Tente fazer login com um usuário criado
   - Verifique se consegue criar tarefas e eventos

3. **Logs da aplicação:**
   ```bash
   # Verifique os logs para erros
   npm run dev # ou pm2 logs se usando PM2
   ```

## 🔧 Troubleshooting

### Erro de conexão com banco
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no `.env.local`
- Teste a conexão: `psql -U nextkanban_user -d nextkanban -h localhost`

### Erro de autenticação
- Verifique se a extensão `pgcrypto` está habilitada
- Confirme se os usuários foram criados corretamente
- Verifique se a coluna `email` é opcional

### Erro 401 nas APIs
- Verifique se o `NEXTAUTH_SECRET` está configurado
- Confirme se a sessão está sendo criada corretamente
- Teste o login novamente

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs da aplicação
2. Confirme a configuração do banco de dados
3. Teste a conectividade entre aplicação e banco
4. Verifique se todas as migrações foram executadas