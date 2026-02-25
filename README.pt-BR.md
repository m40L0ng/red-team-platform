# Red Team Management Platform

Plataforma de gerenciamento para operações de Red Team — acompanhe engagements, gerencie a capacidade da equipe, registre findings com evidências e gere relatórios profissionais.

> **Idiomas:** [English](README.md) · Português

## Funcionalidades

- **Gerenciamento de Engagements** — CRUD completo com rastreamento de status (planejamento → ativo → concluído → arquivado), datas e atribuição de operadores
- **Rastreador de Findings** — Registre vulnerabilidades com severidade (critical/high/medium/low/informational), pontuação CVSS, status e notas de evidência
- **Arquivos de Evidência** — Anexe screenshots, PDFs e arquivos compactados aos findings (upload por drag-and-drop, visualização inline)
- **Capacidade da Equipe** — Monitore a carga de trabalho e os engagements ativos por operador
- **Gerador de Relatórios** — Exporte relatórios profissionais em PDF ou Markdown por engagement
- **Dashboard** — KPIs em tempo real, gráfico de findings por severidade, feed de atividades recentes
- **Controle de Acesso por Função** — Papéis de Operador, Lead e Manager com permissões granulares

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | React 18, Vite, React Router, Tailwind CSS |
| Backend | Node.js, Express |
| Banco de dados | PostgreSQL 16 + Prisma ORM |
| Autenticação | JWT + bcrypt |
| Upload de arquivos | multer (limite de 10 MB, image/PDF/txt/zip) |
| Relatórios | pdfkit (PDF), Markdown |
| Gerenciador de processos | PM2 (modo cluster) |
| Proxy reverso | Nginx |
| Containers | Docker + Docker Compose |

## Estrutura do Projeto

```
red-team-platform/
├── client/
│   └── src/
│       ├── components/         # Layout, modais, EvidencePanel, Pagination
│       ├── context/            # AuthContext (JWT)
│       ├── pages/              # Dashboard, Engagements, Findings, TeamCapacity, Reports
│       └── utils/api.js        # Instância do Axios
├── server/
│   ├── prisma/
│   │   ├── schema.prisma       # Modelos: User, Engagement, Finding, EvidenceFile
│   │   └── migrations/
│   └── src/
│       ├── middleware/auth.js  # Verificação JWT + controle de função
│       ├── routes/             # auth, engagements, findings, team, dashboard, reports, evidence
│       └── index.js
├── docker/
│   └── nginx.conf              # Config do Nginx para o container Docker (proxy HTTP)
├── docs/
│   ├── architecture.md
│   └── production.md           # Guia passo a passo para deploy em produção
├── Dockerfile                  # Build multi-stage (frontend Alpine + servidor Debian slim)
├── docker-compose.yml          # Serviços: db + api + frontend
├── nginx.conf                  # Config do Nginx no host (HTTPS + terminação SSL)
├── ecosystem.config.js         # Config do PM2 em cluster
├── Makefile                    # Atalhos para workflows PM2 e Docker
└── .env.example                # Variáveis de ambiente necessárias para o Docker Compose
```

## Rodando com Docker (recomendado)

O stack Docker executa três containers, cada um com uma responsabilidade única:

```
Navegador
  └── redteam_frontend :80  (nginx — serve React SPA, faz proxy de /api/* → api)
        └── redteam_api      (Express — somente API REST)
              └── redteam_db (PostgreSQL)
```

### Início Rápido

```bash
# 1. Clonar o repositório
git clone https://github.com/m40L0ng/red-team-platform.git
cd red-team-platform

# 2. Configurar o ambiente
cp .env.example .env
```

Edite o `.env` e defina no mínimo:

```env
JWT_SECRET=<string hex de 64 caracteres>
POSTGRES_PASSWORD=<senha forte>
```

Gere um JWT secret seguro:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

```bash
# 3. Fazer o build e iniciar tudo
docker compose up -d

# 4. Verificar se os três containers estão saudáveis
docker compose ps
```

Saída esperada:
```
NAME               SERVICE    STATUS              PORTS
redteam_db         db         Up (healthy)        5432/tcp
redteam_api        api        Up (healthy)        3001/tcp
redteam_frontend   frontend   Up                  0.0.0.0:80->80/tcp
```

Abra **http://localhost** no navegador e registre o primeiro usuário.

### Comandos Úteis

```bash
docker compose logs -f api        # Logs da API (migrations + requisições)
docker compose logs -f frontend   # Logs de acesso do nginx
docker compose exec api sh        # Shell dentro do container da API
docker compose down               # Parar e remover os containers
docker compose down -v            # Parar + apagar o volume do banco de dados
docker compose build --no-cache   # Reconstruir as imagens do zero
```

### Atalhos com Make

```bash
make docker-up       # docker compose up -d
make docker-down     # docker compose down
make docker-build    # reconstruir do zero
make docker-logs     # acompanhar logs da API
make docker-shell    # shell dentro do container da API
```

### Atualizando

```bash
git pull
docker compose build --no-cache
docker compose up -d
```

As migrations são executadas automaticamente na inicialização — nenhuma etapa manual necessária.

### Produção (HTTPS)

Coloque o Nginx do host na frente para terminação SSL:

```bash
sudo cp nginx.conf /etc/nginx/sites-available/red-team
sudo ln -s /etc/nginx/sites-available/red-team /etc/nginx/sites-enabled/
# Edite server_name no nginx.conf, depois:
sudo certbot --nginx -d seu.dominio.com
sudo systemctl reload nginx
```

Defina também `CLIENT_URL=https://seu.dominio.com` no seu `.env` para o CORS.

## Rodando Localmente (desenvolvimento)

### Pré-requisitos

- Node.js >= 18
- PostgreSQL >= 14

### Configuração

```bash
git clone https://github.com/m40L0ng/red-team-platform.git
cd red-team-platform

# Configurar o servidor
cp server/.env.example server/.env
# Edite server/.env com seu DATABASE_URL e JWT_SECRET

# Instalar dependências
cd server && npm install
cd ../client && npm install

# Executar migrations do banco de dados
cd server && npx prisma migrate deploy
```

### Iniciar

```bash
# Backend (de /server) — porta 3001
node src/index.js

# Frontend (de /client) — porta 5173
npm run dev
```

## Rodando em Produção (PM2)

Consulte [`docs/production.md`](docs/production.md) para o guia completo.

```bash
make install    # instalar dependências de produção
make migrate    # executar migrations do banco
make start      # build do frontend + iniciar cluster PM2
make logs       # acompanhar logs
make status     # status do PM2
```

## Endpoints da API

| Método | Rota | Descrição | Função |
|---|---|---|---|
| POST | `/api/auth/register` | Registrar usuário | público |
| POST | `/api/auth/login` | Login, retorna JWT | público |
| GET/POST | `/api/engagements` | Listar / criar engagements | autenticado |
| PATCH/DELETE | `/api/engagements/:id` | Atualizar / excluir | lead, manager |
| GET/POST | `/api/findings` | Listar / criar findings | autenticado |
| PATCH/DELETE | `/api/findings/:id` | Atualizar / excluir | reporter ou lead+ |
| GET/POST | `/api/evidence/finding/:id` | Listar / enviar arquivos | autenticado |
| GET/DELETE | `/api/evidence/:id` | Servir / excluir arquivo | autenticado / lead+ |
| GET/POST | `/api/team` | Listar / criar membros | manager |
| GET | `/api/dashboard/stats` | KPIs + dados dos gráficos | autenticado |
| POST | `/api/reports/generate` | Gerar relatório MD ou PDF | lead, manager |
| GET | `/health` | Verificação de saúde | público |

## Modelo de Dados

```
User         — id, name, email, password, role (operator|lead|manager)
Engagement   — id, name, client, scope, status, startDate, endDate, operators[]
Finding      — id, title, description, severity, cvss, evidence, status, engagementId, userId
EvidenceFile — id, findingId, filename, originalName, mimetype, size
```

## Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `JWT_SECRET` | sim | Secret aleatório de 64 chars para assinar tokens |
| `DATABASE_URL` | sim | String de conexão PostgreSQL |
| `POSTGRES_PASSWORD` | somente Docker | Senha do PostgreSQL (padrão: `redteam_secret`) |
| `POSTGRES_USER` | somente Docker | Usuário do PostgreSQL (padrão: `redteam`) |
| `POSTGRES_DB` | somente Docker | Banco de dados PostgreSQL (padrão: `redteam`) |
| `CLIENT_URL` | somente Docker | Origem permitida pelo CORS (padrão: `http://localhost`) |
| `PORT` | não | Porta da API (padrão: `3001`) |
| `NODE_ENV` | não | Defina como `production` para servir o build do React via Express |

## Licença

MIT — Somente para avaliações de segurança autorizadas. O uso indevido é estritamente proibido.
