# Quick Start Guide

## Prerequisites
- Node.js >= 18 (recommended: 22)
- pnpm >= 9
- MongoDB, PostgreSQL, Redis (or use Railway cloud)

## 1. Clone & Install

```bash
git clone <repo-url>
cd Website

# Backend
cd Backend && pnpm install
cd ..

# Frontend
cd Frontend && pnpm install
cd ..
```

## 2. Configure Environment

```bash
cd Backend
cp .env.example .env
# Edit .env with your database credentials and API keys
```

## 3. Database Setup

```bash
cd Backend/services/auth-service
npx prisma db push
npx tsx prisma/seed.ts
```

## 4. Run

```bash
# Terminal 1 - Backend
cd Backend && pnpm dev

# Terminal 2 - Frontend
cd Frontend && pnpm dev
```

## 5. Login

**URL:** http://localhost:3000  
**Admin:** `admin@cyberfrost.vercel.app` / `Cyber123!`

## Test Accounts

| Email | Password | Role |
|---|---|---|
| `admin@cyberfrost.vercel.app` | `Cyber123!` | SUPER_ADMIN |
| `manager@cyberfrost.vercel.app` | `Cyber123!` | SOC_MANAGER |
| `analyst@cyberfrost.vercel.app` | `Cyber123!` | SOC_ANALYST |
| `viewer@cyberfrost.vercel.app` | `Cyber123!` | EXECUTIVE_VIEWER |
