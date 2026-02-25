# ── Stage 1: Build React frontend ────────────────────────────────────────────
FROM node:20-alpine AS frontend-build

# Network workarounds for SSL-inspection proxy environments
ENV NODE_OPTIONS="--dns-result-order=ipv4first"
RUN npm config set strict-ssl false

WORKDIR /build/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ── Stage 2: Frontend container (nginx serves React + proxies API) ────────────
FROM nginx:1.27-alpine AS frontend

COPY --from=frontend-build /build/client/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# ── Stage 3: API container (Express) ─────────────────────────────────────────
FROM node:20-slim AS api

# Network workarounds for SSL-inspection proxy environments
ENV NODE_OPTIONS="--dns-result-order=ipv4first"
RUN npm config set strict-ssl false

# openssl required by Prisma's schema engine (migrate deploy)
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends openssl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY server/package*.json ./server/
# NODE_TLS_REJECT_UNAUTHORIZED=0: Prisma downloads engine binaries through proxy
RUN cd server && NODE_TLS_REJECT_UNAUTHORIZED=0 npm ci --omit=dev

COPY server/ ./server/
RUN cd server && NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma generate

# Evidence upload directory
RUN mkdir -p ./server/uploads/evidence

EXPOSE 3001
WORKDIR /app/server

# Run DB migrations then start
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
