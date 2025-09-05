# ===============================
# Stage 1: Build
# ===============================
FROM node:20.11.1-slim AS builder

# Diretório de trabalho
WORKDIR /app

# Instala dependências de sistema para pacotes nativos
RUN apt-get update && \
    apt-get install -y python3 make g++ build-essential libc6-dev && \
    rm -rf /var/lib/apt/lists/*

# Copia package.json e package-lock.json
COPY package.json package-lock.json* ./

# Instala todas as dependências (incluindo devDependencies)
RUN npm install

# Copia todo o código
COPY . .

# Recompila better-sqlite3 (necessário no build)
RUN npm rebuild better-sqlite3 --build-from-source

# Build do Next.js
RUN npm run build

# ===============================
# Stage 2: Produção
# ===============================
FROM node:20.11.1-slim AS production

WORKDIR /app

# Copia apenas os artefatos necessários do stage de build
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/init-sqlite.js ./init-sqlite.js
COPY --from=builder /app/data ./data

# Expõe a porta que o Next.js vai rodar
EXPOSE 48321

# Comando padrão
CMD ["npm", "start"]
