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

# Accept build arguments
ARG GEMINI_API_KEY
ARG DATABASE_URL
ARG DB_PATH
ARG NEXTAUTH_SECRET
ARG NEXTAUTH_URL
ARG JWT_SECRET
ARG GIT_SHA

# Set environment variables from build arguments
ENV GEMINI_API_KEY=${GEMINI_API_KEY}
ENV DATABASE_URL=${DATABASE_URL}
ENV DB_PATH=${DB_PATH}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV JWT_SECRET=${JWT_SECRET}
ENV GIT_SHA=${GIT_SHA}
ENV NODE_ENV=production 
ENV NEXT_TELEMETRY_DISABLED=1

COPY . .
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