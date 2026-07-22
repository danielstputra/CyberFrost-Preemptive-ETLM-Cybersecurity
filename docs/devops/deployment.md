# Deployment Guide

## Frontend (Vercel)

Auto-deploys on push to `main` branch via Vercel Git integration.

**Environment Variables:**

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend Railway URL |
| `NEXT_PUBLIC_APP_NAME` | CyberFrost |

## Backend (Railway)

Each microservice is deployed as a separate Railway service.

**Services & Ports:**

| Service | Port | Railway Entry |
|---|---|---|
| API Gateway | 4000 | `api-gateway` |
| Auth Service | 4001 | `auth-service` |
| Discovery | 4002 | `discovery-service` |
| Intelligence | 4003 | `intelligence-service` |
| OSINT | 4004 | `osint-service` |
| Notification | 4005 | `notification-service` |
| Action & Mitigation | 4006 | `action-mitigation-service` |
| AI Service | 4007 | `ai-service` |
| Report Service | 4008 | `report-service` |

**Dependencies:**
- PostgreSQL (Railway plugin)
- MongoDB (Railway plugin)
- Redis (Railway plugin)

## Android APK (GitHub Actions)

Workflow: `.github/workflows/android-build.yml`

Triggers on push to `main` or `develop`, or manual via Actions tab.

**Build process:**
1. Checkout code
2. Setup Node.js 22 + pnpm
3. Install dependencies
4. Setup Java 21 + Android SDK
5. Build Next.js static export (`APK_BUILD=true`)
6. Copy export to `out/`
7. Add Android platform via Capacitor
8. Build APK via Gradle
9. Upload as artifact

## Environment Variables

All services read from `Backend/.env` file. Key variables:

| Variable | Required | Description |
|---|---|---|
| `AUTH_DATABASE_URL` | ✅ | PostgreSQL connection string |
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `REDIS_URL` | ✅ | Redis connection string |
| `JWT_SECRET` | ✅ | JWT signing key |
| `NEXT_PUBLIC_API_URL` | ✅ | Frontend API target |
