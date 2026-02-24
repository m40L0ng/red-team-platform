## Red Team Platform — production commands

.PHONY: install build start stop restart logs \
        docker-up docker-down docker-build docker-logs docker-shell

install:
	cd server && npm install --omit=dev
	cd client && npm install

build:
	cd client && npm run build

start: build
	NODE_ENV=production pm2 start ecosystem.config.js --env production

stop:
	pm2 stop red-team-api

restart:
	pm2 restart red-team-api

logs:
	pm2 logs red-team-api

migrate:
	cd server && npx prisma migrate deploy

status:
	pm2 status

## ── Docker ──────────────────────────────────────────────────────────────────

docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-build:
	docker compose build --no-cache

docker-logs:
	docker compose logs -f app

docker-shell:
	docker compose exec app sh
