# 🚀 Guia de Deploy - NextKanban

## 📋 Pré-requisitos

- Node.js 18+ instalado
- SQLite (incluído no projeto)
- Docker (opcional)

## 🗄️ Configuração do Banco de Dados

### 1. Inicialização Automática
O banco SQLite é criado automaticamente quando você instala as dependências:

```bash
# As tabelas são criadas automaticamente
npm install
```

### 2. Inicialização Manual (se necessário)
```bash
# Execute o script de inicialização
npm run init-db
```

### 3. Localização do Banco
O arquivo do banco SQLite fica em:
- **Desenvolvimento**: `./data/nextkanban.db`
- **Produção**: `/app/data/nextkanban.db` (Docker)

## 👤 Criação de Usuários

### Método 1: Via Interface da Aplicação
1. Acesse a aplicação
2. Use a funcionalidade de registro (se disponível)
3. Ou crie usuários via API

### Método 2: Via API
```bash
# Use a API de registro para criar usuários
curl -X POST http://localhost:48321/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@example.com","password":"sua_senha"}'  
```

## 🌐 Configuração da Aplicação

### 1. Variáveis de ambiente
Crie um arquivo `.env.local` baseado no `.env.example`:

```env
# Database
DB_PATH=./data/nextkanban.db

# NextAuth
NEXTAUTH_URL=http://seu-dominio.com
NEXTAUTH_SECRET=sua_chave_secreta_muito_longa_e_segura
JWT_SECRET=sua_chave_jwt_secreta

# Outras configurações...
```

### 2. Build e Deploy
```bash
# Instalar dependências (inicializa o banco automaticamente)
npm install

# Build da aplicação
npm run build

# Iniciar em produção
npm start
```

## 🐳 Deploy com Docker

### Build da Imagem
```bash
# 1. Build da imagem
docker build -t nextkanban .

# 2. Executar container
docker run -d \
  --name nextkanban \
  -p 48321:48321 \
  -v $(pwd)/data:/app/data \
  -e NEXTAUTH_SECRET=sua_chave_secreta \
  -e JWT_SECRET=sua_chave_jwt \
  nextkanban
```

### Deploy com Volume Persistente
```bash
# Criar volume para dados
docker volume create nextkanban-data

# Executar com volume
docker run -d \
  --name nextkanban \
  -p 48321:48321 \
  -v nextkanban-data:/app/data \
  -e NEXTAUTH_SECRET=sua_chave_secreta \
  -e JWT_SECRET=sua_chave_jwt \
  nextkanban
```

## ✅ Verificação do Deploy

1. **Teste de conexão com banco:**
   ```bash
   # Verifique se o arquivo do banco existe
   ls -la ./data/nextkanban.db
   
   # Teste uma query simples
   sqlite3 ./data/nextkanban.db "SELECT COUNT(*) FROM users;"
   ```

2. **Teste de login:**
   - Acesse a aplicação
   - Tente fazer login com um usuário criado
   - Verifique se consegue criar tarefas e eventos

3. **Logs da aplicação:**
   ```bash
   # Verifique os logs para erros
   npm run dev # ou pm2 logs se usando PM2
   
   # Para Docker
   docker logs nextkanban
   ```

## 📋 Comandos Úteis

### Gerenciamento do Banco SQLite
```bash
# Fazer backup do banco
cp ./data/nextkanban.db ./data/backup-$(date +%Y%m%d).db

# Restaurar backup
cp ./data/backup-20240101.db ./data/nextkanban.db

# Reinicializar banco (cuidado: apaga todos os dados)
npm run init-db

# Verificar status via API
curl http://localhost:48321/api/check-db
```

### Docker
```bash
# Ver logs em tempo real
docker logs -f nextkanban

# Parar container
docker stop nextkanban

# Reiniciar container
docker restart nextkanban

# Remover container
docker rm nextkanban

# Acessar shell do container
docker exec -it nextkanban sh
```

### Backup e Restauração
```bash
# Backup do banco (local)
cp ./data/nextkanban.db ./backups/nextkanban-$(date +%Y%m%d-%H%M%S).db

# Backup do banco (Docker)
docker cp nextkanban:/app/data/nextkanban.db ./backups/

# Restaurar backup (Docker)
docker cp ./backups/nextkanban.db nextkanban:/app/data/
docker restart nextkanban
```

## 🔧 Troubleshooting

### Erro "Database locked"
**Soluções:**
- ✅ Verifique se não há múltiplas instâncias rodando
- ✅ Reinicie a aplicação: `npm restart` ou `docker restart nextkanban`
- ✅ Verifique permissões do arquivo: `ls -la ./data/nextkanban.db`

### Banco não inicializa
- ✅ Verifique se o diretório `data` existe: `mkdir -p ./data`
- ✅ Execute manualmente: `npm run init-db`
- ✅ Verifique permissões de escrita no diretório
- ✅ Verifique logs: `npm run dev` e observe mensagens de erro

### Erro de build do Docker
- ✅ Limpe imagens antigas: `docker system prune -a`
- ✅ Reconstrua sem cache: `docker build --no-cache -t nextkanban .`
- ✅ Verifique se o Dockerfile está presente
- ✅ Verifique logs de build: `docker build -t nextkanban . --progress=plain`

### Problemas de autenticação
- ✅ Verifique se `NEXTAUTH_SECRET` está definido
- ✅ Confirme se `JWT_SECRET` está configurado
- ✅ Verifique se `NEXTAUTH_URL` está correto
- ✅ Teste criação de usuário diretamente no banco

### Container não inicia
- ✅ Verifique portas em uso: `netstat -an | findstr :48321`
- ✅ Verifique logs detalhados: `docker logs nextkanban`
- ✅ Verifique se o volume está montado corretamente
- ✅ Verifique espaço em disco: `docker system df`

### Performance lenta
- ✅ Monitore recursos: `docker stats`
- ✅ Verifique logs de erro: `docker logs nextkanban | grep ERROR`
- ✅ Reinicialize o banco para otimizar: `npm run init-db`
- ✅ Verifique tamanho do banco: `ls -lh ./data/nextkanban.db`

### Corrupção do banco
- ✅ Verifique status via API: `curl http://localhost:48321/api/check-db`
- ✅ Restaure backup mais recente
- ✅ Reinicialize o banco se necessário: `npm run init-db`

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs da aplicação
2. Confirme se o arquivo do banco SQLite existe e tem permissões corretas
3. Teste a conectividade executando queries simples
4. Verifique se todas as tabelas foram criadas corretamente
5. Considere restaurar um backup se houver corrupção de dados