# CyberFrost Frontend Dashboard

**CyberFrost Frontend Dashboard — connected to 8 Backend Microservices.**

A Next.js-based dashboard application for cyber threat intelligence, attack surface discovery, vulnerability management, OSINT / dark web monitoring, brand protection, takedown & mitigation workflow orchestration, third-party risk management (TPRM), real-time war room collaboration, and AI-powered threat insights.

---

## Tech Stack

| Category | Library / Tool |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS v4 |
| **UI Components** | shadcn/ui (base-nova style with @base-ui/react) |
| **State (Client)** | Zustand v5 |
| **State (Server)** | TanStack React Query v5 |
| **HTTP Client** | Axios |
| **Real-time** | Socket.io-client v4 |
| **Icons** | Lucide React |
| **Animation** | Framer Motion |
| **Translation** | Custom TranslationProvider (EN / ID) |
| **Utilities** | class-variance-authority, tailwind-merge, clsx |

---

## Features

- **Executive View** — High-level dashboard with KPIs, severity breakdowns, and real-time status
- **Attack Surface Discovery** — Domain scanning, subdomain enumeration, port & technology detection
- **Vulnerability Intelligence** — CVE database with CVSS scoring, severity filtering, and exploit availability
- **Threat Intelligence** — Curated threat feeds with sector targeting and source attribution
- **OSINT & Dark Web Monitoring** — Dark web leak detection, credential exposure alerts, brand impersonation tracking
- **Brand Protection** — Brand exposure identification, phishing detection, domain squatting alerts
- **Action & Mitigation** — Takedown request lifecycle, firewall mitigation rules, auto-triggered responses
- **TPRM** — Third-party risk management with vendor assessment and scoring
- **War Room** — Real-time incident collaboration room with live updates
- **AI Insights** — AI-powered threat analysis, recommendations, and predictive scoring
- **Real-time Notifications** — Socket.io-powered live alerts for scan progress, new threats, and system events
- **Language Switcher** — Toggle between English (EN) and Indonesian (ID) with instant translation
- **Multi-tenant** — Organization-scoped data isolation with tenant-aware API calls
- **RBAC** — Role-based access control (SUPER_ADMIN, ADMIN, ANALYST, VIEWER)

---

## Folder Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx                # Root layout
│   ├── login/
│   │   ├── layout.tsx
│   │   └── page.tsx              # Login form
│   ├── register/
│   │   ├── layout.tsx
│   │   └── page.tsx              # Registration form
│   ├── dashboard/
│   │   ├── layout.tsx            # Dashboard layout (sidebar + header)
│   │   ├── page.tsx              # Executive View
│   │   ├── attack-surface/page.tsx
│   │   ├── vulnerabilities/page.tsx
│   │   ├── threat-intel/page.tsx
│   │   ├── brand-protection/page.tsx
│   │   ├── action-mitigation/page.tsx
│   │   ├── tprm/page.tsx         # Third-Party Risk Management
│   │   ├── war-room/page.tsx     # Real-time incident collaboration
│   │   ├── ai-insights/page.tsx  # AI-powered insights
│   │   ├── settings/
│   │   │   ├── page.tsx          # Organization settings
│   │   │   └── profile/page.tsx  # Profile settings
│   │   └── notifications/page.tsx
│   └── simple/page.tsx           # Simple test page
│
├── components/
│   ├── ui/                       # 19 shadcn/ui components
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── breadcrumb.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── collapsible.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── popover.tsx
│   │   ├── scroll-area.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── sidebar.tsx
│   │   ├── skeleton.tsx
│   │   ├── table.tsx
│   │   ├── textarea.tsx
│   │   └── tooltip.tsx
│   │
│   ├── dashboard/                # 4 dashboard layout components
│   │   ├── app-sidebar.tsx       # Application sidebar (shadcn Sidebar)
│   │   ├── sidebar.tsx           # Navigation sidebar
│   │   ├── header.tsx            # Top header bar with language switcher
│   │   └── stat-card.tsx         # KPI statistic card
│   │
│   ├── cyber/                    # 12 cyber-styled HUD components
│   │   ├── HUDCard.tsx
│   │   ├── HUDButton.tsx
│   │   ├── HUDInput.tsx
│   │   ├── GlitchText.tsx
│   │   ├── CyberBackground.tsx
│   │   ├── TerminalPanel.tsx
│   │   ├── HackerText.tsx
│   │   ├── TypewriterText.tsx
│   │   ├── GridBackground.tsx
│   │   ├── Scanlines.tsx
│   │   ├── ThreatBadge.tsx
│   │   └── CyberSelect.tsx
│   │
│   └── auth/
│       └── AuthHydrator.tsx      # Rehydrates auth state on mount
│
├── hooks/
│   ├── use-auth.ts               # Login, register, logout mutations
│   ├── use-discovery.ts          # Attack surface scan queries & mutations
│   ├── use-intel.ts              # Threat intelligence queries & mutations
│   ├── use-osint.ts              # OSINT scan queries & mutations
│   ├── use-mitigation.ts         # Takedown & mitigation queries & mutations
│   ├── use-notifications.ts      # Notification queries & mutations
│   ├── use-socket.ts             # Socket.io connection hook (re-exports from provider)
│   ├── use-mobile.ts             # Mobile detection hook
│   └── use-sortable-table.ts     # Sortable table state hook
│
├── lib/
│   ├── api-client.ts             # Axios instance with JWT interceptor & refresh logic
│   ├── constants.ts              # API endpoints, severity colors, navigation items
│   └── utils.ts                  # cn() helper, formatDate, formatNumber
│
├── providers/
│   ├── query-provider.tsx        # TanStack React Query provider + Devtools
│   ├── socket-provider.tsx       # Socket.io context provider
│   └── translation-provider.tsx  # EN/ID translation context provider
│
├── store/
│   ├── auth-store.ts             # Zustand auth state (user, token, tenant)
│   └── ui-store.ts               # Zustand UI state (sidebar, theme)
│
└── types/
    └── index.ts                  # All TypeScript interfaces
```

---

## Prerequisites

- **Node.js** 20.x or later
- **pnpm** 9.x or later

---

## Environment Variables

Create a `.env.local` file in the project root:

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API Gateway URL | `http://localhost:4000` |
| `NEXT_PUBLIC_WS_URL` | WebSocket / Socket.io server URL | (falls back to `NEXT_PUBLIC_API_URL`) |
| `NEXT_PUBLIC_APP_NAME` | Application display name | `CyberFrost` |
| `NEXT_PUBLIC_APP_ENV` | Deployment environment | `development` |

---

## Pages / Routes

| Route | Page | Description |
|---|---|---|
| `/` | Landing | Public landing / marketing page |
| `/login` | Login | Email + password authentication form |
| `/register` | Register | Organization registration form |
| `/dashboard` | Executive View | High-level security dashboard with KPIs and charts |
| `/dashboard/attack-surface` | Attack Surface | Domain scan management and discovered assets |
| `/dashboard/vulnerabilities` | Vulnerabilities | CVE database with severity filtering and search |
| `/dashboard/threat-intel` | Threat Intel | Curated threat intelligence feed |
| `/dashboard/brand-protection` | Brand Protection | OSINT scans, dark web leaks, brand exposures |
| `/dashboard/action-mitigation` | Action & Mitigation | Takedown requests and firewall mitigation rules |
| `/dashboard/tprm` | TPRM | Third-party risk management assessments |
| `/dashboard/war-room` | War Room | Real-time incident collaboration and response |
| `/dashboard/ai-insights` | AI Insights | AI-powered threat analysis and recommendations |
| `/dashboard/notifications` | Notifications | Notification history and alerts |
| `/dashboard/settings` | Settings | Organization configuration |
| `/dashboard/settings/profile` | Profile | User profile settings |

All dashboard routes are protected and require authentication.

---

## Authentication Flow

1. User submits credentials via **Login** form (email + password)
2. Backend validates and returns an **access token** (JWT) and **refresh token**
3. Tokens are persisted in **localStorage**
4. The **Axios request interceptor** automatically attaches the JWT as a `Bearer` header
5. On a **401 response**, the **response interceptor** attempts a token refresh via `/api/v1/auth/refresh`
6. If the refresh succeeds, the original request is retried with the new token
7. If the refresh fails, tokens are cleared and the user is redirected to `/login`
8. On page load, `AuthHydrator` calls the Zustand store's `hydrate()` method which validates the stored token against `/api/v1/auth/me`

---

## Real-time Notifications

- The **SocketProvider** establishes a WebSocket connection to the backend via Socket.io
- Connection is authenticated using the stored JWT token
- Listeners handle events: `notification` (new alerts), `scan:progress` (scan job updates)
- The `useSocket` hook provides access to the socket instance, connection status, and the latest notification
- Notification badge counts in the header update in real-time

---

## Translation (EN / ID)

- The **TranslationProvider** wraps the application and provides translation context
- Two language packs: **English (EN)** and **Indonesian (ID)**
- Translations are stored as JSON key-value pairs and loaded dynamically
- The `useTranslation` hook exposes `t(key)` for key-based lookups and `setLanguage()` for runtime switching
- All dashboard pages, components, and notifications are localized

---

## Language Switcher

The language switcher is located in the dashboard **header** and allows users to toggle between English and Indonesian:

- **EN** — English (default)
- **ID** — Indonesian

When toggled:
- All UI text translates immediately via the TranslationProvider
- Notification content is rendered in the selected language
- The preference is persisted so the language choice is remembered across sessions

---

## State Management

| Layer | Tool | Purpose |
|---|---|---|
| **Client state** | Zustand v5 | Auth state (user, token, tenant), UI state (sidebar collapse, theme) |
| **Server state** | TanStack React Query v5 | API data fetching, caching, background refetching, mutations |
| **Real-time** | Socket.io | Live push events for notifications and scan progress |

---

## Installation & Setup

```bash
# Navigate to the frontend directory
cd Frontend

# Install dependencies
pnpm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your backend API URL and other settings
```

---

## How to Run

```bash
# Start development server (with HMR)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint
pnpm lint
```

The development server runs at [http://localhost:3000](http://localhost:3000) by default.

---

## Developer

**CyberFrost Platform** dikembangkan oleh **Daniels Trysyahputra**

| Kontak | Detail |
|---|---|
| Email | danielstputra@gmail.com |
| Role | Full-Stack Developer & Cybersecurity Platform Architect |
| Tech | Next.js, React, TypeScript, Tailwind CSS, Shadcn UI, Framer Motion |

> (c) 2026 Daniels Trysyahputra. All rights reserved.
