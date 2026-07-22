# CyberFrost Frontend

**Next.js 16 • React 19 • TypeScript • Tailwind CSS v4 • Capacitor 8**

## Tech Stack

| Technology | Version |
|---|---|
| Next.js | 16.2.10 |
| React | 19.2.4 |
| TypeScript | 5.9 |
| Tailwind CSS | v4 |
| State | Zustand + TanStack Query |
| UI | Shadcn UI + Custom HUD Cyberpunk |
| Animation | Framer Motion |
| Charts | Recharts |
| Mobile | Capacitor 8 (Android APK) |

## Pages

| Route | Description |
|---|---|
| `/` | Landing page |
| `/login` | Login with 2FA |
| `/register` | Registration |
| `/dashboard` | Executive view |
| `/dashboard/vulnerabilities` | CVE database |
| `/dashboard/threat-intel` | Threat intelligence |
| `/dashboard/action-mitigation` | Takedown & blocking |
| `/dashboard/settings/profile` | Profile, 2FA, API tokens |
| *(16+ pages total)* | |

## Quick Start

```bash
cd Frontend
pnpm install
pnpm dev
# → http://localhost:3000
```

## Environment Variables

| Variable | Default | Required |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | ✅ |
| `NEXT_PUBLIC_APP_NAME` | `CyberFrost` | |

## Build APK

```bash
APK_BUILD=true pnpm build
node scripts/copy-export.js
npx cap sync android
cd android && gradlew assembleDebug
```

Or via GitHub Actions (push to `main` → auto-build).

## Documentation

Full documentation: [docs/](../docs/README.md)

---

**Developer:** Daniels Trysyahputra — danielstputra@gmail.com
