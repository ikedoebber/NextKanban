# ===============================
# 1. Base image e dependências
# ===============================
FROM node:20.11.1-slim AS base
WORKDIR /app

# Instalar dependências do sistema necessárias para build e sqlite
RUN apt-get update && \
    apt-get install -y dumb-init python3 make g++ build-essential && \
    rm -rf /var/lib/apt/lists/*

# ===============================
# 2. Instalar dependências Node
# ===============================
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# ===============================
# 3. Build da aplicação
# ===============================
COPY . .
# Recompila o better-sqlite3 no ambiente de build
RUN npm rebuild better-sqlite3 --build-from-source
RUN npm run build

# ===============================
# 4. Imagem final
# ===============================
FROM node:20.11.1-slim AS runner
WORKDIR /app

# Dependências de runtime
RUN apt-get update && \
    apt-get install -y dumb-init python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

# Criar usuário
RUN groupadd -g 1001 nodejs && useradd -r -u 1001 -g nodejs nextjs

# Copiar artefatos da build
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/.next ./.next
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/init-sqlite.js ./init-sqlite.js
COPY --from=base /app/data ./data

# Ajustar permissões
RUN mkdir -p data && chown nextjs:nodejs data
USER nextjs

# Garantir que o better-sqlite3 está compilado para o container final
RUN npm rebuild better-sqlite3 --build-from-source

# Inicializar banco e rodar aplicação
RUN node init-sqlite.js
EXPOSE 48321
CMD ["dumb-init", "next", "start", "-p", "48321"]
