# Red Team Management Platform

A management platform for Red Team operations — track engagements, manage team capacity, log findings with evidence, and generate professional reports.

> **Languages:** English · [Português](README.pt-BR.md)

## Features

- **Engagement Management** — Full CRUD with status tracking (planning → active → completed → archived), date ranges, and operator assignment
- **Findings Tracker** — Log vulnerabilities with severity (critical/high/medium/low/informational), CVSS score, status, and evidence notes
- **Evidence Files** — Attach screenshots, PDFs, and archives to findings (drag-and-drop upload, inline preview)
- **Team Capacity** — Monitor team workload, active engagement assignments per operator
- **Report Generator** — Export professional reports as PDF or Markdown per engagement
- **Dashboard** — Real-time KPIs, findings-by-severity chart, recent activity feed
- **Role-based Access** — Operator, Lead, and Manager roles with granular permissions

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router, Tailwind CSS |
| Backend | Node.js, Express |
| Database | PostgreSQL 16 + Prisma ORM |
| Auth | JWT + bcrypt |
| File uploads | multer (10 MB limit, image/PDF/txt/zip) |
| Reports | pdfkit (PDF), Markdown |
| Process manager | PM2 (cluster mode) |
| Reverse proxy | Nginx |
| Containers | Docker + Docker Compose |

## Project Structure

```
red-team-platform/
├── client/
│   └── src/
│       ├── components/         # Layout, modals, EvidencePanel, Pagination
│       ├── context/            # AuthContext (JWT)
│       ├── pages/              # Dashboard, Engagements, Findings, TeamCapacity, Reports
│       └── utils/api.js        # Axios instance
├── server/
│   ├── prisma/
│   │   ├── schema.prisma       # User, Engagement, Finding, EvidenceFile models
│   │   └── migrations/
│   └── src/
│       ├── middleware/auth.js  # JWT verification + role guard
│       ├── routes/             # auth, engagements, findings, team, dashboard, reports, evidence
│       └── index.js
├── docker/
│   └── nginx.conf              # Nginx config for the Docker container (HTTP proxy)
├── docs/
│   ├── architecture.md
│   └── production.md           # Step-by-step production deploy guide
├── Dockerfile                  # Multi-stage build (Alpine frontend + Debian slim server)
├── docker-compose.yml          # db + app + nginx services
├── nginx.conf                  # Host-level Nginx config (HTTPS + SSL termination)
├── ecosystem.config.js         # PM2 cluster config
├── Makefile                    # Shortcuts for both PM2 and Docker workflows
└── .env.example                # Required environment variables for Docker Compose
```

## Running with Docker (recommended)

The Docker stack runs three containers, each with a single responsibility:

```
Browser
  └── redteam_frontend :443  (nginx — HTTPS, serves React SPA, proxies /api/* → api)
        └── redteam_api       (Express — REST API only)
              └── redteam_db  (PostgreSQL)
```

**HTTPS is enabled by default.** On first start, nginx automatically generates a self-signed certificate stored in the `certs` Docker volume (persists across restarts). HTTP on port 80 redirects to HTTPS. See [SSL Certificates](#ssl-certificates) to swap in a real certificate.

### Quickstart

```bash
# 1. Clone
git clone https://github.com/m40L0ng/red-team-platform.git
cd red-team-platform

# 2. Configure environment
cp .env.example .env
```

Edit `.env` and set at minimum:

```env
JWT_SECRET=<paste 64-char hex string here>
POSTGRES_PASSWORD=<strong password>
```

Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

```bash
# 3. Build and start everything
docker compose up -d

# 4. Check that all three containers are healthy
docker compose ps
```

Expected output:
```
NAME               SERVICE    STATUS              PORTS
redteam_db         db         Up (healthy)        5432/tcp
redteam_api        api        Up (healthy)        3001/tcp
redteam_frontend   frontend   Up                  0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

Open **https://localhost** in your browser and register the first user.

> **Self-signed certificate warning:** The browser will show a security warning on the first visit (expected for self-signed certs). Click **Advanced → Proceed to localhost** to continue. See [SSL Certificates](#ssl-certificates) to use a trusted certificate.

### Useful commands

```bash
docker compose logs -f api        # API logs (migrations + requests)
docker compose logs -f frontend   # nginx access logs
docker compose exec api sh        # shell inside the API container
docker compose down               # stop and remove containers
docker compose down -v            # stop + delete database volume
docker compose build --no-cache   # rebuild images from scratch
```

### Make shortcuts

```bash
make docker-up       # docker compose up -d
make docker-down     # docker compose down
make docker-build    # rebuild from scratch
make docker-logs     # tail API logs
make docker-shell    # shell inside API container
```

### Updating

```bash
git pull
docker compose build --no-cache
docker compose up -d
```

Migrations run automatically on startup — no manual step needed.

### SSL Certificates

#### Default: auto-generated self-signed certificate

On first start, the frontend container generates a self-signed RSA-2048 certificate (valid 10 years) and stores it in the `certs` Docker volume. The cert persists across restarts and is reused automatically.

#### Using Let's Encrypt (production)

Mount your Let's Encrypt certificates directly into the `certs` volume:

```yaml
# In docker-compose.yml, replace the named certs volume with bind mounts:
frontend:
  volumes:
    - /etc/letsencrypt/live/your.domain.com/fullchain.pem:/etc/nginx/certs/cert.pem:ro
    - /etc/letsencrypt/live/your.domain.com/privkey.pem:/etc/nginx/certs/key.pem:ro
```

Or use the host-level Nginx for SSL termination (see `nginx.conf` in the repo root):

```bash
sudo cp nginx.conf /etc/nginx/sites-available/red-team
sudo ln -s /etc/nginx/sites-available/red-team /etc/nginx/sites-enabled/
# Edit server_name in nginx.conf, then:
sudo certbot --nginx -d your.domain.com
sudo systemctl reload nginx
```

Set `CLIENT_URL=https://your.domain.com` in your `.env` for CORS.

## Running locally (development)

### Prerequisites

- Node.js >= 18
- PostgreSQL >= 14

### Setup

```bash
git clone https://github.com/m40L0ng/red-team-platform.git
cd red-team-platform

# Configure the server
cp server/.env.example server/.env
# Edit server/.env with your DATABASE_URL and JWT_SECRET

# Install dependencies
cd server && npm install
cd ../client && npm install

# Run database migrations
cd server && npx prisma migrate deploy
```

### Start

```bash
# Backend (from /server) — port 3001
node src/index.js

# Frontend (from /client) — port 5173
npm run dev
```

## Running in production (PM2)

See [`docs/production.md`](docs/production.md) for the full guide.

```bash
make install    # install prod dependencies
make migrate    # run DB migrations
make start      # build frontend + start PM2 cluster
make logs       # tail logs
make status     # PM2 status
```

## API Endpoints

| Method | Route | Description | Role |
|---|---|---|---|
| POST | `/api/auth/register` | Register user | public |
| POST | `/api/auth/login` | Login, returns JWT | public |
| GET/POST | `/api/engagements` | List / create engagements | authenticated |
| PATCH/DELETE | `/api/engagements/:id` | Update / delete | lead, manager |
| GET/POST | `/api/findings` | List / create findings | authenticated |
| PATCH/DELETE | `/api/findings/:id` | Update / delete | reporter or lead+ |
| GET/POST | `/api/evidence/finding/:id` | List / upload files | authenticated |
| GET/DELETE | `/api/evidence/:id` | Serve / delete file | authenticated / lead+ |
| GET/POST | `/api/team` | List / create members | manager |
| GET | `/api/dashboard/stats` | KPIs + chart data | authenticated |
| POST | `/api/reports/generate` | Generate MD or PDF report | lead, manager |
| GET | `/health` | Health check | public |

## Data Model

```
User         — id, name, email, password, role (operator|lead|manager)
Engagement   — id, name, client, scope, status, startDate, endDate, operators[]
Finding      — id, title, description, severity, cvss, evidence, status, engagementId, userId
EvidenceFile — id, findingId, filename, originalName, mimetype, size
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | yes | Random 64-char secret for signing tokens |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `POSTGRES_PASSWORD` | Docker only | PostgreSQL password (default: `redteam_secret`) |
| `POSTGRES_USER` | Docker only | PostgreSQL user (default: `redteam`) |
| `POSTGRES_DB` | Docker only | PostgreSQL database (default: `redteam`) |
| `PORT` | no | API port (default: `3001`) |
| `NODE_ENV` | no | Set to `production` to serve React build from Express |

## License

MIT — For authorized security assessments only. Misuse is strictly prohibited.
