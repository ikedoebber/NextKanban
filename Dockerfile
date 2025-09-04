# ===============================
# 1. Dependências
# ===============================
FROM node:20-slim AS deps
WORKDIR /app

# Instala dependências do sistema necessárias
RUN apt-get update && apt-get install -y python3 make g++ git curl && rm -rf /var/lib/apt/lists/*

# Copia package.json e package-lock.json e instala todas dependências
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

# Recebe secrets via build-args
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG GEMINI_API_KEY
ARG DATABASE_URL
ARG DB_HOST
ARG DB_PORT
ARG DB_NAME
ARG DB_USER
ARG DB_PASSWORD
ARG NEXTAUTH_SECRET
ARG NEXTAUTH_URL
ARG JWT_SECRET
ARG GIT_SHA

# Define variáveis de ambiente
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY
ENV DATABASE_URL=$DATABASE_URL
ENV DB_HOST=$DB_HOST
ENV DB_PORT=$DB_PORT
ENV DB_NAME=$DB_NAME
ENV DB_USER=$DB_USER
ENV DB_PASSWORD=$DB_PASSWORD
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV JWT_SECRET=$JWT_SECRET

# Garante que a pasta public existe
RUN mkdir -p public

# Build da aplicação
RUN npm run build

# ===============================
# 3. Imagem final para produção
# ===============================
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=48321

# Cria usuário não-root
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -m nextjs

# Copia arquivos essenciais do build
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules

# Instala apenas dependências de produção (caso necessário)
RUN npm ci --omit=dev --ignore-scripts || true

# Executa como usuário não-root
USER nextjs

# Porta que o Next irá rodar
EXPOSE 48321

# Start da aplicação
CMD ["npm", "run", "start", "--", "-p", "48321"]
