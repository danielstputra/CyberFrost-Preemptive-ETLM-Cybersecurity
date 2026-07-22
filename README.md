# CyberFrost — Preemptive ETLM Cybersecurity Platform

**AI-Powered External Threat Landscape Management**

CyberFrost is an enterprise-grade B2B cybersecurity platform that provides continuous attack surface discovery, real-time threat intelligence, automated mitigation, and executive protection — all through a unified dashboard.

---

## Architecture

```
Website/
├── Backend/          # Node.js Microservices (pnpm workspace)
│   ├── api-gateway/        # API Gateway (Express + Socket.io)
│   ├── services/
│   │   ├── auth-service/          # Authentication, RBAC, 2FA, Multi-Tenancy
│   │   ├── action-mitigation-service/ # Takedown, Blocking, Webhook, Kominfo
│   │   ├── ai-service/            # Google Gemini AI Integration
│   │   ├── discovery-service/     # Attack Surface Discovery (DNS, Port Scan)
│   │   ├── intelligence-service/  # CVE, Threat Intel, Threat Actors
│   │   ├── notification-service/  # Email, Socket.io, Slack Notifications
│   │   ├── osint-service/         # Dark Web, Brand Protection, TPRM
│   │   ├── report-service/        # PDF Report Generation (Puppeteer)
│   │   └── shared/                # Shared Types, Middleware, Utilities
│   └── shared/                    # Shared library (errors, logger, types)
│
├── Frontend/          # Next.js 16 App Router
│   ├── src/
│   │   ├── app/                  # Pages (dashboard, login, register)
│   │   ├── components/           # UI Components (Shadcn, HUD Cyberpunk)
│   │   ├── hooks/                # React Hooks (auth, socket, queries)
│   │   ├── store/                # Zustand State (auth, UI)
│   │   ├── lib/                  # API Client, Constants, Utils
│   │   └── providers/            # React Providers (Query, Socket, i18n)
│   ├── capacitor.config.json     # Capacitor APK config
│   └── scripts/copy-export.js    # Static export helper for APK
│
├── .github/workflows/android-build.yml  # CI/CD Android APK
├── run.bat          # Quick start menu (Windows)
├── cyber-git.bat    # Git helper menu (Windows)
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| **State** | Zustand, TanStack React Query |
| **UI** | Shadcn UI, Framer Motion, Recharts |
| **Mobile** | Capacitor 8 (Android APK) |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL (Auth), MongoDB (Services) |
| **Message Queue** | BullMQ (Redis), RabbitMQ |
| **Auth** | JWT, bcrypt, TOTP (2FA), RBAC |
| **AI** | Google Gemini API |
| **Search** | $regex + escape, Meilisearch |
| **Realtime** | Socket.io |
| **CI/CD** | GitHub Actions (APK), Vercel (Frontend), Railway (Backend) |
| **Monitoring** | Sentry, Pino Logger |

---

## Backend Services

### 1. Auth Service (`:4001`)
- Registration / Login / Logout with JWT (access + refresh tokens)
- Role-Based Access Control (7 roles: SUPER_ADMIN, SOC_MANAGER, SOC_ANALYST, TENANT_ADMIN, SECURITY_OPERATOR, COMPLIANCE_OFFICER, EXECUTIVE_VIEWER)
- Multi-Tenant data isolation
- Two-Factor Authentication (TOTP — Google/Microsoft Authenticator)
- API Token management
- Active Session management
- Rate limiting (login: 5/15min, register: 3/60min)
- Refresh token rotation with reuse detection
- Token blacklisting on logout

### 2. API Gateway (`:4000`)
- Reverse proxy to all microservices
- JWT verification at gateway level (defense in depth)
- Global rate limiting
- Security headers (Helmet)
- CORS with configurable origins

### 3. Action & Mitigation Service (`:4006`)
- Phishing takedown requests (Google Safe Browsing, PhishTank)
- Social media impersonation takedown (Meta BRP API, email fallback)
- One-click SOAR execution
- Kominfo Trust+ integration (Indonesia government reporting)
- Legal draft generation
- Manual IP/domain blocking (Cloudflare)
- SIEM webhook dispatch (Jira, ServiceNow, Splunk)
- Workflow automation

### 4. AI Service (`:4007`)
- Google Gemini AI threat analysis
- MITRE ATT&CK mapping
- Automated threat scenario generation
- Vector embeddings for semantic search

### 5. Discovery Service (`:4002`)
- Subdomain enumeration
- Port scanning (25 common ports)
- Technology stack detection
- Shadow IT asset discovery
- BullMQ job queue with Redis

### 6. Intelligence Service (`:4003`)
- Real-time CVE monitoring (NVD, CISA KEV)
- Threat intelligence feeds
- Threat actor catalog (APT groups)
- Search across vulnerabilities, threats, actors
- Automated threat fetcher cron job

### 7. Notification Service (`:4005`)
- Multi-channel notifications (Socket.io, Email, Slack, Teams)
- Notification queue (BullMQ consumers)
- MongoDB persistence with read/unread state
- Gateway connector for Socket.io

### 8. OSINT Service (`:4004`)
- Dark web monitoring
- Credential leak detection
- Brand impersonation tracking
- Vendor risk assessment (TPRM)
- Executive protection monitoring

### 9. Report Service (`:4008`)
- PDF report generation (Puppeteer)
- Security posture reports
- Scheduled report delivery

---

## Frontend Pages

| Route | Description |
|---|---|
| `/` | Landing page (hero, features, platform showcase) |
| `/login` | Login with 2FA support |
| `/register` | Tenant registration |
| `/dashboard` | Executive view — metrics, severity charts, active threats |
| `/dashboard/attack-surface` | Discovered domains, ports, Shadow IT |
| `/dashboard/vulnerabilities` | CVE database with filters, search, sort |
| `/dashboard/threat-intel` | MITRE ATT&CK, active threats |
| `/dashboard/threat-actors` | APT group catalog |
| `/dashboard/brand-protection` | Dark web leaks, brand exposures |
| `/dashboard/action-mitigation` | Takedown requests, mitigation actions |
| `/dashboard/tprm` | Third-party risk management |
| `/dashboard/ai-insights` | AI-generated threat analysis |
| `/dashboard/notifications` | Notification center |
| `/dashboard/war-room` | Real-time incident response |
| `/dashboard/executives` | Executive protection monitoring |
| `/dashboard/integrations` | SIEM/ITSM integrations |
| `/dashboard/settings` | Account overview |
| `/dashboard/settings/profile` | Profile, password, 2FA, API tokens |

---

## Quick Start

### Prerequisites
- Node.js >= 18 (recommended: 22)
- pnpm >= 9
- MongoDB, PostgreSQL, Redis (or use Railway cloud instances)

### 1. Clone & Install

```bash
git clone <repo-url>
cd Website

# Install all dependencies (Backend + Frontend)
cd Backend && pnpm install
cd ../Frontend && pnpm install
cd ..
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:
```bash
cd Backend
cp .env.example .env
# Edit .env with your database URLs and API keys
```

### 3. Run

**Option A — Using run.bat (Windows):**
```bash
run.bat
# Menu 1 → Start All (Backend + Frontend)
```

**Option B — Manual:**

Terminal 1 — Backend:
```bash
cd Backend
pnpm dev
```

Terminal 2 — Frontend:
```bash
cd Frontend
pnpm dev
```

The app will be available at:
- **Frontend:** http://localhost:3000
- **API Gateway:** http://localhost:4000
- **Auth Service:** http://localhost:4001

### 4. Seed Database

```bash
cd Backend/services/auth-service
npx prisma db push
npx tsx prisma/seed.ts
```

### Test Accounts (after seeding)

| Email | Password | Role |
|---|---|---|
| `admin@cyberfrost.vercel.app` | `Cyber123!` | SUPER_ADMIN |
| `manager@cyberfrost.vercel.app` | `Cyber123!` | SOC_MANAGER |
| `analyst@cyberfrost.vercel.app` | `Cyber123!` | SOC_ANALYST |
| `tenant-admin@cyberfrost.vercel.app` | `Cyber123!` | TENANT_ADMIN |
| `operator@cyberfrost.vercel.app` | `Cyber123!` | SECURITY_OPERATOR |
| `viewer@cyberfrost.vercel.app` | `Cyber123!` | EXECUTIVE_VIEWER |

---

## Build Android APK

GitHub Actions will automatically build the APK on every push to `main`:

1. Push to GitHub → workflow triggers
2. Builds Next.js static export
3. Syncs with Capacitor
4. Builds APK via Gradle
5. Uploads artifact

**Manual build:**
```bash
cd Frontend
run.bat → Menu 5 (Build Android APK)
```

Download APK from **GitHub → Actions → Build Android APK → Artifacts**.

---

## Deployment

| Platform | Service | URL |
|---|---|---|
| **Vercel** | Frontend | Auto-deploy on push to `main` |
| **Railway** | Backend | 9 microservices, PostgreSQL, MongoDB, Redis |

### Environment Variables (Frontend)

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://your-backend.railway.app` |
| `NEXT_PUBLIC_APP_NAME` | `CyberFrost` |
| `NEXT_PUBLIC_WS_URL` | `https://your-backend.railway.app` |

### Environment Variables (Backend)

See `Backend/.env.example` for all required variables.

---

## Git Helper (`cyber-git.bat`)

```bash
cyber-git.bat

  Menu  →  Function
  1     →  Login GitHub (simpan token)
  2     →  Check profile
  3     →  Status
  4     →  Add files (git add)
  5     →  Commit
  6     →  Push
  7     →  Pull
  8     →  Branch manager
  9     →  Remote setup
```

---

## Security Features

- **RBAC** — 7 roles with granular permissions per endpoint
- **Multi-Tenancy** — Complete data isolation between clients
- **2FA** — TOTP via Google/Microsoft Authenticator
- **JWT Rotation** — Refresh tokens with reuse detection
- **Rate Limiting** — Per-endpoint rate limits (login, register, API)
- **SSRF Protection** — URL validation blocking internal IPs
- **Security Headers** — Helmet middleware on all services
- **Input Validation** — Zod schemas on every endpoint
- **SQL/NoSQL Injection Prevention** — Prisma + Mongoose parameterized queries
- **CORS** — Configurable origins, only API Gateway exposes headers
- **Secret Scanning** — GitHub push protection for API keys

---

## Audit History

A comprehensive full-system audit was completed on July 2026:
- **14 Critical** issues identified → **14 fixed** (RBAC, JWT, SSRF, TLS, etc.)
- **20 Warnings** identified → **20 fixed** (rate limiting, refresh rotation, etc.)
- **14 Suggestions** implemented → **14 done** (TTL indexes, error boundaries, etc.)

See `Instruksi_Claude_Full_System_Audit.md` for full audit report.

---

## 👨‍💻 Developer & Contact

| | |
|---|---|
| **Developer** | **Daniels Trysyahputra** |
| **Role** | Lead Software Engineer / Security Architect |
| **GitHub** | [github.com/danielstputra](https://github.com/danielstputra) |
| **Email** | danielstputra@gmail.com |
| **Platform** | [CyberFrost App](https://frontend-d076et461-danielstputradev-6548s-projects.vercel.app) |

## License

MIT — see [LICENSE](./LICENSE)

---

*Built with Claude Code • Preemptive ETLM Cybersecurity Platform*
