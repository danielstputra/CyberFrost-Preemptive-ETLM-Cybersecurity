# CyberFrost Backend -- Preemptive ETLM Platform

> **Cybersecurity Platform** -- Attack Surface Management, Vulnerability Intelligence, Dark Web Monitoring, AI-Powered Threat Analysis, and Real-Time Automated Mitigation.
>
> Microservices architecture built with Node.js + TypeScript, event-driven via BullMQ (Redis) and RabbitMQ, real-time via Socket.io, and AI-powered via Google Gemini.

---

## Table of Contents

- [Architecture & Ports](#architecture--ports)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Installation & Setup](#installation--setup)
- [How to Run](#how-to-run)
- [Database Seeding](#database-seeding)
- [API Endpoints](#api-endpoints)
- [Folder Structure](#folder-structure)
- [CORS Configuration](#cors-configuration)
- [Deployment (Railway)](#deployment-railway)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Architecture & Ports

```
                                     ┌──────────────────┐
      Client (Frontend) ────────────▶│   API Gateway    │◀────── Socket.io (real-time)
                                     │   (port 4000)    │
                                     └────────┬─────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
                    ▼                         ▼                         ▼
        ┌────────────────────┐   ┌────────────────────┐   ┌────────────────────┐
        │   Auth Service     │   │ Discovery Service  │   │ Intelligence Svc   │
        │   (port 4001)      │   │ (port 4002)        │   │ (port 4003)        │
        │   PostgreSQL       │   │ MongoDB            │   │ MongoDB            │
        │   Prisma ORM       │   │ BullMQ (Redis)     │   │ node-cron          │
        └────────────────────┘   └────────┬───────────┘   └────────────────────┘
                                          │
        ┌─────────────────────────────────┼─────────────────────────────────┐
        │                                 │                                 │
        ▼                                 ▼                                 ▼
┌────────────────────┐   ┌────────────────────┐   ┌────────────────────────────┐
│   OSINT Service    │   │ Notification Svc   │   │ Action & Mitigation        │
│   (port 4004)      │   │ (port 4005)        │   │ (port 4006)                │
│   MongoDB          │   │ MongoDB            │   │ MongoDB                    │
│   Puppeteer        │   │ Nodemailer         │   │ BullMQ (Redis)             │
│   BullMQ (Redis)   │   │ BullMQ + Socket.io │   └────────────────────────────┘
└────────────────────┘   └────────────────────┘
                                    │
                                    ▼
                        ┌────────────────────┐
                        │   AI Service       │
                        │   (port 4007)      │
                        │   MongoDB          │
                        │   Google Gemini AI │
                        └────────────────────┘
```

| Service | Port | Database | Message Broker | Key Function |
|---------|------|----------|---------------|-------------|
| **API Gateway** | `4000` | -- | Socket.io | Routing, JWT auth, rate limiting, reverse proxy |
| **Auth Service** | `4001` | PostgreSQL (Prisma) | -- | Multi-tenant auth, RBAC, JWT, profile management |
| **Discovery Service** | `4002` | MongoDB (Mongoose) | BullMQ (Redis) | Subdomain enumeration, port scanning, asset discovery, EASM |
| **Intelligence Service** | `4003` | MongoDB (Mongoose) | node-cron | CVE database, threat intelligence, dashboard, threat actors |
| **OSINT Service** | `4004` | MongoDB (Mongoose) | BullMQ (Redis) | Dark web leaks, brand impersonation, pastebin monitoring |
| **Notification Service** | `4005` | MongoDB (Mongoose) | BullMQ + Socket.io | Real-time push, email alerts, Slack/Teams integration |
| **Action & Mitigation** | `4006` | MongoDB (Mongoose) | BullMQ (Redis) | Takedown requests, firewall blocking, abuse email, tickets, webhooks, workflows |
| **AI Service** | `4007` | MongoDB (Mongoose) | -- | AI insights, text summarization, threat analysis, semantic search, rule generation |

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Runtime** | Node.js 20+, TypeScript 5 |
| **Framework** | Express.js 4 |
| **Package Manager** | pnpm workspaces (monorepo) |
| **Relational DB** | PostgreSQL + Prisma ORM (Auth) |
| **NoSQL DB** | MongoDB + Mongoose (Discovery, Intel, OSINT, Notification, Action, AI) |
| **Message Broker** | BullMQ + Redis, RabbitMQ |
| **Real-Time** | Socket.io |
| **Full-Text Search** | Meilisearch |
| **Web Scraping** | Puppeteer (OSINT) |
| **Email** | Nodemailer (SendGrid) |
| **AI / LLM** | Google Gemini AI |
| **Validation** | Zod |
| **Testing** | Jest + Axios |
| **Deployment** | Railway.app |

---

## Prerequisites

| Tool | Minimum Version | Check |
|------|----------------|-------|
| **Node.js** | >= 20.0.0 | `node --version` |
| **pnpm** | >= 9.0.0 | `pnpm --version` |
| **Redis** | >= 6.0 | `redis-cli ping` -> `PONG` |
| **MongoDB** | >= 6.0 | `mongosh --eval "db.version()"` |
| **PostgreSQL** | >= 14 | `psql --version` |
| **Git** | >= 2.0 | `git --version` |

### Install pnpm (if not installed)

```bash
npm install -g pnpm
```

---

## Environment Variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | API Gateway port | `4000` |
| `CORS_ORIGIN` | Comma-separated allowed origins | `http://localhost:3000` |
| `JWT_SECRET` | JWT signing secret | -- |
| `JWT_EXPIRES_IN` | JWT access token expiration | `24h` |
| `JWT_REFRESH_EXPIRES_IN` | JWT refresh token expiration | `7d` |
| `BCRYPT_SALT_ROUNDS` | BCrypt salt rounds | `12` |
| `AUTH_DATABASE_URL` | PostgreSQL connection string (primary) | -- |
| `AUTH_DATABASE_URL_FALLBACK` | PostgreSQL connection string (fallback) | -- |
| `MONGODB_URI` | MongoDB connection string | -- |
| `REDIS_URL` | Redis connection string (BullMQ) | `redis://localhost:6379` |
| `RABBITMQ_URL` | RabbitMQ connection string (event bus) | `amqp://localhost:5672` |
| `MEILI_HOST` | Meilisearch host URL | `http://localhost:7700` |
| `MEILI_MASTER_KEY` | Meilisearch master API key | -- |
| `SMTP_HOST` | SMTP server host | `smtp.resend.com` |
| `SMTP_PORT` | SMTP server port | `465` |
| `SMTP_USER` | SMTP username | `resend` |
| `SMTP_PASS` | SMTP password / API key | -- |
| `SMTP_FROM_EMAIL` | Sender email address | `onboarding@resend.dev` |
| `SLACK_WEBHOOK_URL` | Slack webhook URL for alerts | -- |
| `TEAMS_WEBHOOK_URL` | Microsoft Teams webhook URL | -- |
| `GEMINI_API_KEY` | Google Gemini AI API key | -- |
| `GSB_API_KEY` | Google Safe Browsing API key | -- |
| `PHISHTANK_API_KEY` | PhishTank API key | -- |
| `CF_API_TOKEN` | Cloudflare API token | -- |
| `CF_ZONE_ID` | Cloudflare zone ID | -- |
| `AUTH_SERVICE_URL` | Internal auth service URL | `http://localhost:4001` |
| `DISCOVERY_SERVICE_URL` | Internal discovery service URL | `http://localhost:4002` |
| `INTELLIGENCE_SERVICE_URL` | Internal intelligence service URL | `http://localhost:4003` |
| `OSINT_SERVICE_URL` | Internal OSINT service URL | `http://localhost:4004` |
| `NOTIFICATION_SERVICE_URL` | Internal notification service URL | `http://localhost:4005` |
| `ACTION_MITIGATION_SERVICE_URL` | Internal action & mitigation URL | `http://localhost:4006` |
| `AI_SERVICE_URL` | Internal AI service URL | `http://localhost:4007` |

---

## Installation & Setup

### 1. Navigate to the project directory

```bash
cd Backend
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Generate Prisma client and push schema

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to PostgreSQL (create tables)
pnpm db:push
```

### 4. Build all packages

```bash
pnpm build
```

---

## How to Run

### Development (all services)

```bash
pnpm dev
```

This starts all 8 services in parallel:

```
[API Gateway]           http://localhost:4000
[Auth Service]          http://localhost:4001
[Discovery Service]     http://localhost:4002
[Intelligence Service]  http://localhost:4003
[OSINT Service]         http://localhost:4004
[Notification Service]  http://localhost:4005
[Action & Mitigation]   http://localhost:4006
[AI Service]            http://localhost:4007
```

### Run a specific service

```bash
pnpm --filter @cyberfrost/auth-service run dev
pnpm --filter @cyberfrost/discovery-service run dev
pnpm --filter @cyberfrost/intelligence-service run dev
pnpm --filter @cyberfrost/osint-service run dev
pnpm --filter @cyberfrost/notification-service run dev
pnpm --filter @cyberfrost/action-mitigation-service run dev
pnpm --filter @cyberfrost/ai-service run dev
```

### Run workers separately

```bash
# Discovery worker
pnpm --filter @cyberfrost/discovery-service run dev:worker

# OSINT worker
pnpm --filter @cyberfrost/osint-service run dev:worker
```

### Production

```bash
pnpm start:all
```

This uses `concurrently` to run all 8 compiled services with labeled output.

---

## Database Seeding

### Auth Service -- Seed admin user and test data

```bash
pnpm --filter @cyberfrost/auth-service run seed
```

### Intelligence Service -- Seed CVE and threat intelligence

```bash
pnpm --filter @cyberfrost/intelligence-service run seed
```

### MongoDB Seeding (all services)

```bash
pnpm db:seed-mongo
```

This populates:
- **Auth**: Sample users, tenants, and roles
- **Intelligence**: Sample CVE entries and threat intel reports
- **Discovery**: Sample domain scan data
- **OSINT**: Sample leaks and exposures
- **Notifications**: Sample notification data
- **Action & Mitigation**: Sample takedowns and mitigations
- **AI**: Sample AI insights

Threat data is automatically updated via cron job every 30 minutes (Intelligence Service).

---

## API Endpoints

All requests route through the **API Gateway** at `http://localhost:4000/api/v1`.

### Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | No | Root health check (used by Railway) |
| `GET` | `/api/v1/health` | No | Service health status |
| `GET` | `/api/v1/health/live` | No | Liveness probe |
| `GET` | `/api/v1/health/ready` | No | Readiness probe |

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/auth/register` | No | Register new tenant and admin user |
| `POST` | `/api/v1/auth/login` | No | Login, returns JWT access + refresh tokens |
| `POST` | `/api/v1/auth/refresh` | No | Exchange refresh token for new JWT |
| `GET` | `/api/v1/auth/me` | JWT | Get current user profile |
| `PUT` | `/api/v1/auth/me` | JWT | Update user profile (name, email, avatar) |
| `POST` | `/api/v1/auth/logout` | JWT | Invalidate refresh token |
| `POST` | `/api/v1/auth/change-password` | JWT | Change password with strength validation |

### Discovery

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/discovery/scan` | JWT | Start domain scan (queued via BullMQ) |
| `GET` | `/api/v1/discovery/scan/:jobId` | JWT | Get scan job status |
| `GET` | `/api/v1/discovery/scans` | JWT | List all scans (paginated) |
| `GET` | `/api/v1/discovery/domains` | JWT | List discovered assets/domains |
| `GET` | `/api/v1/discovery/domains/:id` | JWT | Get domain details |
| `GET` | `/api/v1/discovery/easm/shadow-it` | JWT | List shadow IT assets |
| `PATCH` | `/api/v1/discovery/easm/shadow-it/:id/owner` | JWT | Assign owner to shadow IT asset |
| `GET` | `/api/v1/discovery/easm/digital-footprint` | JWT | Digital footprint summary |

### Intelligence

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v1/intelligence/vulnerabilities` | JWT | List CVEs (paginated, filterable by severity) |
| `GET` | `/api/v1/intelligence/vulnerabilities/:id` | JWT | Get CVE detail |
| `PATCH` | `/api/v1/intelligence/vulnerabilities/:id/status` | JWT | Update CVE review status |
| `GET` | `/api/v1/intelligence/threats` | JWT | List threat intelligence reports |
| `GET` | `/api/v1/intelligence/threats/:id` | JWT | Get threat detail with IOCs |
| `GET` | `/api/v1/intelligence/dashboard` | JWT | Summary statistics dashboard |
| `GET` | `/api/v1/intelligence/threat-actors` | JWT | List threat actors |
| `GET` | `/api/v1/intelligence/threat-actors/:id` | JWT | Get threat actor detail |
| `GET` | `/api/v1/intelligence/threat-actors/mitre/:technique` | JWT | Find actors by MITRE technique |

### OSINT

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/osint/scan` | JWT | Start OSINT scan (dark web, pastebin, typo-squatting) |
| `GET` | `/api/v1/osint/scan/:jobId` | JWT | Get OSINT scan job status |
| `GET` | `/api/v1/osint/scans` | JWT | List OSINT scans |
| `GET` | `/api/v1/osint/leaks` | JWT | List dark web data leaks |
| `GET` | `/api/v1/osint/leaks/:id` | JWT | Get leak detail |
| `PATCH` | `/api/v1/osint/leaks/:id/status` | JWT | Update leak investigation status |
| `GET` | `/api/v1/osint/exposures` | JWT | List brand exposures |
| `GET` | `/api/v1/osint/exposures/:id` | JWT | Get exposure detail |
| `PATCH` | `/api/v1/osint/exposures/:id/status` | JWT | Update exposure status |
| `GET` | `/api/v1/osint/dashboard` | JWT | OSINT summary dashboard |

### Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v1/notifications` | JWT | List notifications (paginated) |
| `GET` | `/api/v1/notifications/unread-count` | JWT | Get unread notification count |
| `PATCH` | `/api/v1/notifications/:id/read` | JWT | Mark single notification as read |
| `POST` | `/api/v1/notifications/read-all` | JWT | Mark all notifications as read |
| `POST` | `/api/v1/notifications/send-test` | JWT | Send a test notification |

### Action & Mitigation

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/action/takedown` | JWT | Submit a phishing takedown request |
| `GET` | `/api/v1/action/takedown` | JWT | List takedown requests |
| `GET` | `/api/v1/action/takedown/:id` | JWT | Get takedown detail |
| `PATCH` | `/api/v1/action/takedown/:id/status` | JWT | Update takedown status |
| `POST` | `/api/v1/action/takedown/generate-email` | JWT | Generate abuse report email template |
| `POST` | `/api/v1/action/mitigation/block` | JWT | Manually block an IP or domain |
| `GET` | `/api/v1/action/mitigation` | JWT | List mitigation actions |
| `GET` | `/api/v1/action/mitigation/:id` | JWT | Get mitigation detail |
| `PATCH` | `/api/v1/action/mitigation/:id/status` | JWT | Update mitigation status |
| `GET` | `/api/v1/action/mitigation/stats/overview` | JWT | Mitigation statistics overview |
| `POST` | `/api/v1/action/ticket` | JWT | Create incident ticket (Jira/ServiceNow) |
| `GET` | `/api/v1/action/ticket` | JWT | List incident tickets |
| `PATCH` | `/api/v1/action/ticket/:id/status` | JWT | Update ticket status |
| `POST` | `/api/v1/action/webhook/send` | JWT | Send webhook to SIEM/SOAR |
| `POST` | `/api/v1/action/webhook/test` | JWT | Test webhook connectivity |
| `POST` | `/api/v1/action/workflow` | JWT | Create/trigger automation workflow rule |
| `GET` | `/api/v1/action/workflow` | JWT | List workflow rules |

### AI Service

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/ai/generate` | JWT | Generate AI insight (summary, scenario, rule) |
| `POST` | `/api/v1/ai/summarize` | JWT | AI text summarization |
| `POST` | `/api/v1/ai/analyze-threat` | JWT | Analyze threat using Google Gemini AI |
| `GET` | `/api/v1/ai/insights` | JWT | List AI-generated insights |
| `GET` | `/api/v1/ai/insights/:id` | JWT | Get AI insight detail |
| `GET` | `/api/v1/ai/omnibar` | JWT | Semantic search across AI insights |

### Global Search

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/v1/search?q=keyword&type=all` | JWT | Global IOC search (CVEs, threats, actors) |

### Route Map Summary

| Prefix | Service | Auth Required |
|--------|---------|---------------|
| `/api/v1/auth/*` | Auth Service | No (public) |
| `/api/v1/discovery/*` | Discovery Service | Yes (JWT) |
| `/api/v1/discovery/easm/*` | Discovery -- EASM | Yes (JWT) |
| `/api/v1/intelligence/*` | Intelligence Service | Yes (JWT) |
| `/api/v1/intelligence/threat-actors/*` | Intel -- Threat Actors | Yes (JWT) |
| `/api/v1/osint/*` | OSINT Service | Yes (JWT) |
| `/api/v1/notifications/*` | Notification Service | Yes (JWT) |
| `/api/v1/action/*` | Action & Mitigation | Yes (JWT) |
| `/api/v1/action/ticket/*` | Action -- Ticketing | Yes (JWT) |
| `/api/v1/action/webhook/*` | Action -- Webhook | Yes (JWT) |
| `/api/v1/action/workflow/*` | Action -- Workflow | Yes (JWT) |
| `/api/v1/ai/*` | AI Service | Yes (JWT) |
| `/api/v1/search` | Global Search | Yes (JWT) |
| `/api/v1/health` | -- | No |

---

## Database Architecture

| Database | Technology | Used By |
|----------|-----------|---------|
| **PostgreSQL** | Prisma ORM | Auth Service (users, tenants, roles, refresh tokens) |
| **MongoDB** | Mongoose ODM | Discovery, Intelligence, OSINT, Notification, Action & Mitigation, AI Service |

### Connection details

- **PostgreSQL**: Single database for Auth, connection via `AUTH_DATABASE_URL`
- **MongoDB**: Single database instance shared across services via `MONGODB_URI`
- **Redis**: BullMQ job queues + caching via `REDIS_URL`
- **RabbitMQ**: Event bus for cross-service events via `RABBITMQ_URL`
- **Meilisearch**: Full-text search indexing via `MEILI_HOST`

### PostgreSQL Schema (Auth Service)

| Table | Description |
|-------|-------------|
| `tenants` | Organizations / client companies |
| `users` | Admin, Analyst, Viewer per tenant |
| `subscriptions` | Subscription plans (STARTER, PROFESSIONAL, ENTERPRISE) |
| `configurations` | Key-value config per tenant |

### MongoDB Collections

| Collection | Service | Description |
|------------|---------|-------------|
| `discovered_domains` | Discovery | Discovered subdomains with IP, ports, technologies |
| `scan_jobs` | Discovery | Domain scan job records with progress |
| `shadow_it_assets` | Discovery | EASM shadow IT assets |
| `vulnerabilities` | Intelligence | CVE entries from NVD API |
| `threat_intel` | Intelligence | Threat intelligence reports (CISA KEV) |
| `threat_actors` | Intelligence | Threat actor profiles with MITRE ATT&CK |
| `dark_web_leaks` | OSINT | Dark web data leak findings |
| `brand_exposures` | OSINT | Brand impersonation / typo-squatting detections |
| `osint_scan_jobs` | OSINT | OSINT scan job records |
| `notifications` | Notification | System notifications |
| `takedown_requests` | Action & Mitigation | Phishing takedown submissions |
| `mitigation_actions` | Action & Mitigation | Firewall block / mitigation actions |
| `incident_tickets` | Action & Mitigation | Incident tickets (Jira/ServiceNow) |
| `workflow_rules` | Action & Mitigation | Automation workflow rules |
| `ai_insights` | AI Service | AI-generated threat analysis and insights |

---

## Folder Structure

```
Backend/
├── package.json                  # Root monorepo (scripts, devDeps)
├── pnpm-workspace.yaml           # Workspace config
├── tsconfig.base.json            # Base TypeScript config
├── .env.example                  # Template environment variables
├── .gitignore
├── .prettierrc
├── eslint.config.js
├── railway.json                  # Railway deployment config
├── jest.config.ts                # Jest test configuration
├── postman-collection.json       # Postman API collection
│
├── api-gateway/                  # Express + Socket.io + http-proxy-middleware
│   ├── package.json
│   ├── Dockerfile
│   └── src/
│       ├── index.ts
│       ├── app.ts
│       ├── server.ts
│       ├── config/
│       ├── middleware/
│       │   ├── auth.ts           # JWT authentication + RBAC
│       │   ├── rateLimit.ts      # Rate limiting
│       │   └── proxy.ts          # Service proxy factory
│       ├── routes/
│       │   ├── index.ts          # Route aggregation
│       │   └── health.ts
│       ├── socket/
│       └── types/
│
├── services/
│   ├── auth-service/             # PostgreSQL + Prisma + JWT
│   ├── discovery-service/        # MongoDB + BullMQ + DNS/port scanners
│   ├── intelligence-service/     # MongoDB + node-cron + CVE fetcher
│   ├── osint-service/            # MongoDB + BullMQ + Puppeteer
│   ├── notification-service/     # MongoDB + BullMQ + Nodemailer + Socket.io
│   ├── action-mitigation-service/ # MongoDB + BullMQ (takedown, firewall, tickets)
│   └── ai-service/               # MongoDB + Google Gemini AI
│
├── shared/                       # @cyberfrost/shared — shared types & constants
│   ├── package.json
│   └── src/
│       ├── types/
│       └── constants/
│
└── tests/
    ├── api.test.ts               # Integration test suite
    └── ...                       # Additional test files
```

---

## CORS Configuration

The API Gateway accepts multiple origins configured via the `CORS_ORIGIN` environment variable (comma-separated list):

```
CORS_ORIGIN=http://localhost:3000,https://cyberfrost.vercel.app,https://humble-wonder-production-913c.up.railway.app
```

This enables:
- Local development frontend (`http://localhost:3000`)
- Production Vercel deployment (`https://cyberfrost.vercel.app`)
- Railway internal URLs

Supported methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`
Allowed headers: `Content-Type`, `Authorization`

---

## Deployment (Railway)

The project is configured for deployment on Railway.app:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link project
railway login
railway link

# Deploy all services
railway up
```

### railway.json

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm install && pnpm build"
  },
  "deploy": {
    "numReplicas": 1,
    "startCommand": "pnpm start:all",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

The API Gateway has its own `Dockerfile` for containerized deployment. Environment variables for production are available in `.env.railway`.

---

## Testing

### Run all tests

```bash
pnpm test
```

### Run tests by service

```bash
pnpm test:auth          # Auth Service tests
pnpm test:discovery     # Discovery Service tests
pnpm test:intel         # Intelligence Service tests
pnpm test:osint         # OSINT Service tests
pnpm test:notify        # Notification Service tests
pnpm test:mitigation    # Action & Mitigation tests
pnpm test:ai            # AI Service tests
```

### Test Configuration

Tests use Jest with Axios for HTTP requests.

**Integration Tests** -- `tests/api.test.ts` runs against running services (requires `pnpm dev` first).

**Unit Tests** -- Each service has its own `__tests__/` directory with isolated unit tests that mock database connections (Prisma/Mongoose) and external dependencies:

| Service | Test File | Coverage |
|---------|-----------|----------|
| Auth | `services/auth-service/src/__tests__/auth.test.ts` | Registration, login, token generation, password hashing, JWT middleware, validation |
| Discovery | `services/discovery-service/src/__tests__/discovery.test.ts` | Scan creation, domain listing, scanner DNS resolution, pagination |
| Intelligence | `services/intelligence-service/src/__tests__/intelligence.test.ts` | Vulnerability listing, threat listing, dashboard stats, CVE severity |
| OSINT | `services/osint-service/src/__tests__/osint.test.ts` | OSINT scan, leak listing, exposure listing, dashboard |
| Notification | `services/notification-service/src/__tests__/notification.test.ts` | Notification CRUD, mark as read, unread count, send test |
| Action & Mitigation | `services/action-mitigation-service/src/__tests__/mitigation.test.ts` | Takedown CRUD, mitigation actions, block, stats overview |
| Action & Mitigation | `services/action-mitigation-service/src/__tests__/takedown.test.ts` | Takedown submission, email generation, status updates |
| AI | `services/ai-service/src/__tests__/ai.test.ts` | Insight generation, summarization, insights listing, analyze-threat, omnibar |

Unit tests run independently of any running services and do not require a database connection.

---

## Testing with Postman

Import the root `postman-collection.json` file for a complete collection covering all endpoints.

### Quick Test via cURL

```bash
# 1. Register
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Test123!","name":"Admin","tenantName":"Test Corp","tenantSlug":"test-corp"}'

# 2. Login -> save token
export TOKEN=$(curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Test123!"}' | jq -r '.accessToken')

# 3. Dashboard Intel
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/v1/intelligence/dashboard

# 4. Start OSINT scan
curl -X POST http://localhost:4000/api/v1/osint/scan \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"target":"example.com","scanType":"DOMAIN"}'

# 5. AI Generate Insight
curl -X POST http://localhost:4000/api/v1/ai/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Threat Analysis","insightType":"THREAT_SUMMARY"}'

# 6. Health check
curl http://localhost:4000/api/v1/health
```

---

## Troubleshooting

### Error: `Stream isn't writeable and enableOfflineQueue options is false`

Redis is not running. Solution:

```bash
redis-server
```

### Error: `Cannot find module '@prisma/client'`

Prisma client has not been generated:

```bash
pnpm db:generate
```

### Error: `The Prisma engine could not be found`

Prisma build is blocked by `allowBuilds` in `pnpm-workspace.yaml`:

```bash
pnpm approve-builds @prisma/client prisma
pnpm install
pnpm db:generate
```

### Error: `port is already in use`

Another service is using the port. Change the port in `.env`:

```env
AUTH_SERVICE_PORT=4006  # change if 4001 is taken
```

### Error: `GEMINI_API_KEY not configured`

AI Service runs in simulated mode without Gemini API key. AI responses will use template data instead of real AI generation. To enable full AI capabilities, set `GEMINI_API_KEY` in `.env`.

---

## Service Documentation

Each service has its own README and Postman Collection:

| Service | README | Postman |
|---------|--------|---------|
| Auth | `services/auth-service/README.md` | `services/auth-service/postman-collection.json` |
| Discovery | `services/discovery-service/README.md` | `services/discovery-service/postman-collection.json` |
| Intelligence | `services/intelligence-service/README.md` | `services/intelligence-service/postman-collection.json` |
| OSINT | `services/osint-service/README.md` | `services/osint-service/postman-collection.json` |
| Notification | `services/notification-service/README.md` | -- |
| Action & Mitigation | `services/action-mitigation-service/README.md` | -- |
| AI Service | `services/ai-service/README.md` | -- |

---

> **Built with** Node.js, TypeScript, Express, MongoDB, PostgreSQL, Redis, BullMQ, Socket.io, RabbitMQ, Meilisearch, Google Gemini AI

---

## Developer

**CyberFrost Platform** developed by **Daniels Trysyahputra**

| Contact | Detail |
|---------|--------|
| Email | [danielstputra@gmail.com](mailto:danielstputra@gmail.com) |
| Role | Full-Stack Developer & Cybersecurity Platform Architect |
| Tech | Node.js, TypeScript, Express, Next.js, MongoDB, PostgreSQL, Redis, BullMQ, Socket.io, Google Gemini AI |

> (c) 2026 Daniels Trysyahputra. All rights reserved.
