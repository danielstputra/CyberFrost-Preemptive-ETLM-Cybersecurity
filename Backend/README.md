# CyberFrost Backend

**Node.js • Express • TypeScript • Microservices • pnpm Workspace**

## Architecture

```
API Gateway (:4000)
├── Auth Service (:4001)       — PostgreSQL (users, tenants, RBAC, 2FA)
├── Discovery Service (:4002)  — MongoDB (scan jobs, domains)
├── Intelligence Service (:4003)— MongoDB (CVE, threats, actors)
├── OSINT Service (:4004)      — MongoDB (leaks, exposures, TPRM)
├── Notification Service (:4005)— MongoDB (notifications, queue)
├── Action & Mitigation (:4006)— MongoDB (takedowns, blocks)
├── AI Service (:4007)         — MongoDB (insights, Gemini)
└── Report Service (:4008)     — Puppeteer (PDF generation)
```

## Services

| Service | Port | Database | Purpose |
|---|---|---|---|
| API Gateway | 4000 | — | Reverse proxy, JWT, rate limit |
| Auth | 4001 | PostgreSQL | Auth, RBAC, 2FA, tenants |
| Discovery | 4002 | MongoDB | DNS scan, port scan |
| Intelligence | 4003 | MongoDB | CVE, threats, search |
| OSINT | 4004 | MongoDB | Dark web, brand, TPRM |
| Notification | 4005 | MongoDB | Email, Socket.io, queue |
| Action & Mitigation | 4006 | MongoDB | Takedown, block, SOAR |
| AI | 4007 | MongoDB | Gemini AI, insights |
| Report | 4008 | — | PDF generation |

## Quick Start

```bash
cd Backend
pnpm install
cp .env.example .env
# Edit .env with database credentials
pnpm dev
```

## Environment Variables

Key variables (see `.env.example` for full list):

| Variable | Required |
|---|---|
| `AUTH_DATABASE_URL` | ✅ |
| `MONGODB_URI` | ✅ |
| `REDIS_URL` | ✅ |
| `JWT_SECRET` | ✅ |

## Documentation

Full documentation: [docs/](../docs/README.md)

---

**Developer:** Daniels Trysyahputra — danielstputra@gmail.com
