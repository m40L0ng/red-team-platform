# Red Team Management Platform

A management platform for Red Team operations — track engagements, manage team capacity, log findings with evidence, and generate professional reports.

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

```bash
# 1. Copy and configure environment
cp .env.example .env
# Edit .env — set JWT_SECRET and POSTGRES_PASSWORD

# 2. Start the full stack (db + app + nginx)
docker compose up -d

# 3. Check status
docker compose ps
docker compose logs app

# 4. Stop
docker compose down
```

The stack exposes port `80`. In production, put a TLS-terminating Nginx in front using the provided `nginx.conf`.

### Make shortcuts

```bash
make docker-up       # docker compose up -d
make docker-down     # docker compose down
make docker-build    # rebuild images from scratch
make docker-logs     # tail app logs
make docker-shell    # open shell inside app container
```

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
