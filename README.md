# Red Team Management Platform

A comprehensive management platform for Red Team operations — track engagements, manage team capacity, log findings, and generate reports.

## Features

- **Engagement Management** — Create and track authorized pentest engagements
- **Team Capacity Dashboard** — Monitor team workload and availability
- **Findings Tracker** — Log, categorize, and prioritize vulnerabilities
- **Report Generator** — Export professional reports (PDF/Markdown)
- **Timeline & Kill Chain** — Visualize attack paths and operation timelines
- **Role-based Access** — Operator, Team Lead, and Manager roles

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router, Tailwind CSS |
| Backend | Node.js, Express |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT + bcrypt |
| Docs | Swagger / OpenAPI |

## Project Structure

```
red-team-platform/
├── client/                 # React frontend
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── pages/          # Route pages
│       ├── hooks/          # Custom React hooks
│       ├── context/        # Global state (Auth, Theme)
│       └── utils/          # Helpers and constants
├── server/                 # Node.js backend
│   └── src/
│       ├── routes/         # API route definitions
│       ├── controllers/    # Business logic
│       ├── models/         # Prisma data models
│       ├── middleware/      # Auth, logging, error handling
│       └── services/       # External integrations
└── docs/                   # Architecture and API docs
```

## Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/m40L0ng/red-team-platform.git
cd red-team-platform

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### Environment Setup

```bash
# server/.env
DATABASE_URL="postgresql://user:password@localhost:5432/redteam"
JWT_SECRET="your-secret-key"
PORT=3001

# client/.env
VITE_API_URL=http://localhost:3001
```

### Running

```bash
# Start backend (from /server)
npm run dev

# Start frontend (from /client)
npm run dev
```

## License

MIT — For authorized security assessments only. Misuse is strictly prohibited.
