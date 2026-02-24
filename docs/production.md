# Running in Production

## Architecture

In production, a single Node.js process serves everything:

```
Browser → :3001 (Express)
              ├── /api/*     → API routes
              └── /*         → React build (client/dist/)
```

No need for a separate frontend server — Express serves the static files.

## Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- PM2 (`npm install -g pm2`)

## Step-by-step

### 1. Clone and configure

```bash
git clone https://github.com/m40L0ng/red-team-platform.git
cd red-team-platform

cp server/.env.example server/.env
# Edit server/.env with your DATABASE_URL and JWT_SECRET
```

### 2. Generate a secure JWT secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Install dependencies (prod only)

```bash
cd server && npm install --omit=dev
cd ../client && npm install
```

### 4. Run database migrations

```bash
cd server && npx prisma migrate deploy
```

### 5. Build the frontend

```bash
cd client && npm run build
# Output: client/dist/
```

### 6. Start with PM2

```bash
# From project root
NODE_ENV=production pm2 start ecosystem.config.js --env production

# Save to restart on reboot
pm2 save
pm2 startup
```

### Useful PM2 commands

```bash
pm2 status          # Process status
pm2 logs red-team-api   # Live logs
pm2 restart red-team-api
pm2 stop red-team-api
```

## Or use Make

```bash
make install   # Install prod dependencies
make build     # Build frontend
make start     # Build + start with PM2
make logs      # Tail logs
make status    # PM2 status
```

## Environment variables (server/.env)

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Set to `production` |
| `PORT` | API port (default: 3001) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Random 64-char secret for signing tokens |

## Nginx reverse proxy (HTTPS)

A ready-to-use config is at `nginx.conf` in the project root.

```bash
# Copy and enable
sudo cp nginx.conf /etc/nginx/sites-available/red-team
sudo ln -s /etc/nginx/sites-available/red-team /etc/nginx/sites-enabled/

# Edit server_name and SSL cert paths, then:
sudo nginx -t && sudo systemctl reload nginx
```

For free TLS certificates use Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your.domain.com
```

## Health check

```bash
curl http://localhost:3001/health
# {"status":"ok","timestamp":"..."}
```
