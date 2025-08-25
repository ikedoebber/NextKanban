# 1. Instalar dependências
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
# Use `npm ci` para instalações mais rápidas e determinísticas se você tiver um package-lock.json
RUN npm install

# 2. Construir e remover dependências desnecessárias
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# A variável de ambiente NEXT_TELEMETRY_DISABLED desativa a telemetria durante a construção.
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# 3. Imagem final para produção
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1

# Copiar os artefatos de construção e as dependências necessárias da etapa anterior
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# O Next.js cria um usuário `nextjs` sem privilégios por padrão.
# Isso melhora a segurança ao não executar o aplicativo como root.
USER nextjs

EXPOSE 3000

# O comando `next start` é otimizado para produção.
CMD ["npm", "start"]
