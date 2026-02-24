# ── Stage 1: Build React frontend ────────────────────────────────────────────
FROM node:20-alpine AS frontend
WORKDIR /build/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ── Stage 2: Production server ───────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

# Install server production dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# Copy server source
COPY server/ ./server/

# Generate Prisma client
RUN cd server && npx prisma generate

# Copy built frontend (Express serves this as static files)
COPY --from=frontend /build/client/dist ./client/dist

# Evidence upload directory
RUN mkdir -p ./server/uploads/evidence

EXPOSE 3001
WORKDIR /app/server

# Run DB migrations, then start
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
