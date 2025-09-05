FROM node:20.11.1-slim AS builder
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files first for better caching
COPY package.json package-lock.json* ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Set build arguments as environment variables
ARG GEMINI_API_KEY
ARG DATABASE_URL
ARG DB_PATH
ARG NEXTAUTH_SECRET
ARG NEXTAUTH_URL
ARG JWT_SECRET
ARG GIT_SHA

ENV GEMINI_API_KEY=${GEMINI_API_KEY}
ENV DATABASE_URL=${DATABASE_URL}
ENV DB_PATH=${DB_PATH}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV JWT_SECRET=${JWT_SECRET}
ENV GIT_SHA=${GIT_SHA}
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

FROM node:20.11.1-slim AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=48321

RUN apt-get update && apt-get install -y dumb-init && rm -rf /var/lib/apt/lists/*
RUN groupadd -g 1001 nodejs && useradd -r -u 1001 -g nodejs nextjs

# Install only production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/init-sqlite.js ./init-sqlite.js

RUN mkdir -p data && chown nextjs:nodejs data
USER nextjs
RUN node init-sqlite.js
EXPOSE 48321
CMD ["dumb-init", "next", "start", "-p", "48321"]
