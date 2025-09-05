# ===============================
# Stage 1: Base com dependências
# ===============================
FROM node:20.11.1-slim AS base
WORKDIR /app

# Instala dependências do sistema necessárias para build de pacotes nativos
RUN apt-get update && \
    apt-get install -y dumb-init python3 make g++ build-essential && \
    rm -rf /var/lib/apt/lists/*

# Copia package.json e package-lock.json
COPY package.json package-lock.json* ./

# Instala todas as dependências (dev + prod) sem rodar scripts ainda
RUN npm ci --ignore-scripts

# ===============================
# Stage 2: Builder
# ===============================
FROM base AS builder
WORKDIR /app

# Copia o resto do código
COPY . .

# Recompila better-sqlite3 para o ambiente atual
RUN npm rebuild better-sqlite3 --build-from-source

# Build do Next.js
RUN npm run build

# ===============================
# Stage 3: Runner / Produção
# ===============================
FROM node:20.11.1-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=48321
ENV NEXT_TELEMETRY_DISABLED=1

# Instala dumb-init (para receber sinais corretamente)
RUN apt-get update && \
    apt-get install -y dumb-init && \
    rm -rf /var/lib/apt/lists/*

# Cria usuário não-root
RUN groupadd -g 1001 nodejs && useradd -r -u 1001 -g nodejs nextjs

# Copia node_modules já compiladas e build do Next.js
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/init-sqlite.js ./init-sqlite.js

# Cria diretório de dados para SQLite
RUN mkdir -p data && chown nextjs:nodejs data

# Define usuário não-root
USER nextjs

# Inicializa banco SQLite
RUN node init-sqlite.js

# Expõe porta do Next.js
EXPOSE 48321

# Comando para iniciar o Next.js em produção
CMD ["dumb-init", "next", "start", "-p", "48321"]
