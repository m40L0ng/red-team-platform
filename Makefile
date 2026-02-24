## Red Team Platform — production commands

.PHONY: install build start stop restart logs

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
