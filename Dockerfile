FROM node:20.11.1-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y dumb-init python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

FROM node:20.11.1-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts && npm cache clean --force
COPY . .
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20.11.1-slim AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=48321
RUN apt-get update && apt-get install -y dumb-init && rm -rf /var/lib/apt/lists/*
RUN groupadd -g 1001 nodejs && useradd -r -u 1001 -g nodejs nextjs
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/init-sqlite.js ./init-sqlite.js
RUN mkdir -p data && chown nextjs:nodejs data
USER nextjs
RUN node init-sqlite.js
EXPOSE 48321
CMD ["dumb-init", "next", "start", "-p", "48321"]
