# ── Stage 1: Build React frontend ────────────────────────────────────────────
FROM node:20-alpine AS frontend

# Network workarounds: force IPv4 and disable strict SSL
# (required for environments with SSL-inspection proxies)
ENV NODE_OPTIONS="--dns-result-order=ipv4first"
RUN npm config set strict-ssl false

WORKDIR /build/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ── Stage 2: Production server ───────────────────────────────────────────────
# node:20-slim (Debian) has libssl3 pre-installed, which Prisma's schema
# engine requires at runtime for prisma migrate deploy.
# node:20-alpine was avoided because apk HTTPS is blocked by the proxy
# and alpine lacks a compatible libssl for Prisma's native binary.
FROM node:20-slim

ENV NODE_OPTIONS="--dns-result-order=ipv4first"
RUN npm config set strict-ssl false

# openssl required by Prisma's schema engine (migrate deploy)
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends openssl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install server production dependencies
# NODE_TLS_REJECT_UNAUTHORIZED=0: Prisma's postinstall downloads engine
# binaries from binaries.prisma.sh through the SSL-inspection proxy
COPY server/package*.json ./server/
RUN cd server && NODE_TLS_REJECT_UNAUTHORIZED=0 npm ci --omit=dev

# Copy server source
COPY server/ ./server/

# Generate Prisma client (may re-download engine binary — needs TLS bypass)
RUN cd server && NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma generate

# Copy built frontend (Express serves this as static files)
COPY --from=frontend /build/client/dist ./client/dist

# Evidence upload directory
RUN mkdir -p ./server/uploads/evidence

EXPOSE 3001
WORKDIR /app/server

# Run DB migrations, then start
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
