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

### Opção 1: Sistema Completo com Docker Compose (Recomendado)

```bash
# 1. Clone o repositório
git clone <seu-repositorio>
cd NextKanban

# 2. Inicie todo o sistema (PostgreSQL + NextKanban)
docker-compose up --build -d

# OU use o script automatizado (Windows)
.\start-system.ps1
```

**O que o docker-compose.yml faz:**
- 🗄️ Inicia PostgreSQL com configurações otimizadas
- 🚀 Constrói e inicia a aplicação NextKanban
- 🔗 Configura rede interna entre os serviços
- ⚡ Healthcheck automático do banco
- 📊 Volumes persistentes para dados

### Opção 2: Apenas PostgreSQL

```bash
# Para desenvolvimento local
docker-compose -f docker-compose.dev.yml up -d
```

### Opção 3: Build Manual

```bash
# 1. Build da imagem
docker build -t nextkanban .

# 2. Executar com docker-compose
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

## 📋 Comandos Úteis

### Docker Compose
```bash
# Iniciar sistema completo
docker-compose up --build -d

# Ver logs em tempo real
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f nextkanban
docker-compose logs -f postgres

# Parar sistema
docker-compose down

# Reiniciar sistema
docker-compose restart

# Reconstruir apenas um serviço
docker-compose up --build nextkanban -d

# Remover volumes (CUIDADO: apaga dados!)
docker-compose down -v
```

### Acesso ao Banco de Dados
```bash
# Via Docker
docker-compose exec postgres psql -U nextkanban_user -d nextkanban

# Via cliente local
psql -h localhost -U nextkanban_user -d nextkanban

# Executar script SQL
docker-compose exec postgres psql -U nextkanban_user -d nextkanban -f /path/to/script.sql
```

### Monitoramento
```bash
# Status dos containers
docker-compose ps

# Uso de recursos
docker stats

# Inspecionar rede
docker network ls
docker network inspect nextkanban_nextkanban-network
```

## 🔧 Troubleshooting

### Erro de conexão com banco
- ✅ Verifique se o PostgreSQL está rodando: `docker-compose ps postgres`
- ✅ Confirme as credenciais no `.env.production`
- ✅ Teste a conexão: `docker-compose exec postgres psql -U nextkanban_user -d nextkanban`
- ✅ Verifique logs: `docker-compose logs postgres`

### Erro de build do Docker
- ✅ Limpe imagens antigas: `docker system prune -a`
- ✅ Verifique se todas as variáveis estão no Dockerfile
- ✅ Reconstrua sem cache: `docker-compose build --no-cache`
- ✅ Verifique logs de build: `docker-compose logs nextkanban`

### Problemas de autenticação
- ✅ Verifique se `NEXTAUTH_SECRET` está definido
- ✅ Confirme se `NEXTAUTH_URL` está correto (http://localhost:48321)
- ✅ Teste criação de usuário com o script SQL
- ✅ Verifique se a extensão pgcrypto está habilitada

### Container não inicia
- ✅ Verifique portas em uso: `netstat -an | findstr :48321`
- ✅ Verifique logs detalhados: `docker-compose logs --details nextkanban`
- ✅ Teste dependências: `docker-compose up postgres` primeiro
- ✅ Verifique espaço em disco: `docker system df`

### Performance lenta
- ✅ Monitore recursos: `docker stats`
- ✅ Verifique logs de erro: `docker-compose logs | grep ERROR`
- ✅ Reinicie containers: `docker-compose restart`
- ✅ Otimize banco: Execute `VACUUM ANALYZE;` no PostgreSQL

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs da aplicação
2. Confirme a configuração do banco de dados
3. Teste a conectividade entre aplicação e banco
4. Verifique se todas as migrações foram executadas