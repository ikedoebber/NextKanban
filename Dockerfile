# ===============================
# 1. Dependências
# ===============================
FROM node:20-slim AS deps
WORKDIR /app

RUN apt-get update && apt-get install -y python3 make g++ git curl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm ci

# ===============================
# 2. Build da aplicação
# ===============================
FROM node:20-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ===============================
# 3. Imagem final para produção
# ===============================
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=48321

RUN groupadd -g 1001 nodejs \
    && useradd -u 1001 -g nodejs -m nextjs

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

USER nextjs

EXPOSE 48321

# Start for correct port
CMD ["npx", "next", "start", "-p", "48321"]
