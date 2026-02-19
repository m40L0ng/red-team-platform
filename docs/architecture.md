# Architecture

## Overview

```
                  ┌──────────────────┐
                  │   React Client   │
                  │  (Vite + Tailwind)│
                  └────────┬─────────┘
                           │ HTTP / REST
                  ┌────────▼─────────┐
                  │   Express API    │
                  │   (Node.js)      │
                  └────────┬─────────┘
                           │ Prisma ORM
                  ┌────────▼─────────┐
                  │   PostgreSQL     │
                  └──────────────────┘
```

## Roles

| Role | Permissions |
|------|------------|
| `operator` | View engagements, log findings |
| `lead` | All operator + create engagements, manage findings |
| `manager` | All lead + manage team, generate reports, archive |

## Data Models

- **User** — team members with role-based access
- **Engagement** — authorized pentest scope (client, dates, operators)
- **Finding** — vulnerability with severity, CVSS, evidence, status

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/login | Authenticate |
| GET | /api/engagements | List engagements |
| POST | /api/engagements | Create engagement |
| GET | /api/findings | List findings |
| POST | /api/findings | Log finding |
| GET | /api/team/capacity | Team workload |
| POST | /api/reports/generate | Generate report |
