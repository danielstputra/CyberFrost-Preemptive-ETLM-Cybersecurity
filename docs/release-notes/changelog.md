# Changelog

## v4.2.0 (July 2026)

### 🆕 New Features
- **Two-Factor Authentication** — TOTP-based 2FA (Google/Microsoft Authenticator)
  - Setup with QR code, verify, disable
  - Login flow with 2FA step
  - Profile page 2FA management
- **Android APK** — Capacitor 8 build via GitHub Actions
  - Static export with relative asset paths
  - Automated CI/CD pipeline
- **Enterprise Profile Page** — Photo, personal info, password strength meter, sessions, API tokens
- **API Token Management** — Create, list, revoke tokens with expiry
- **Kominfo Integration** — Automated SOAR dispatch to Indonesia's Kominfo

### 🔒 Security Improvements
- **Full System Audit** — 14 critical, 20 warnings, 14 suggestions — ALL fixed
- JWT role types aligned with Prisma schema (`ValidRole`)
- RBAC middleware applied to all API routes
- SSRF protection in webhook and Kominfo dispatchers
- TLS validation enforced in production
- Rate limiting on auth endpoints (login: 5/15min, register: 3/60min)
- Refresh token rotation with reuse detection
- Access token blacklisting on logout
- Helmet security headers on all services
- CORS restricted to API Gateway only

### 🛠 Improvements
- Nodemailer singleton transporter (connection pooling)
- Gemini API timeout (30s generate, 15s embed)
- Event loop yielding in discovery scanner
- analystLogs capped at 200 entries
- ErrorBoundary in dashboard layout
- Graceful shutdown in report service
- All dynamic imports → static imports
- `next-env.d.ts` types updated
- Sitemap + robots.txt generated

### 🐛 Fixed
- `set /p` typos in batch files (backslash vs forward slash)
- Duplicate `router.post` in twofa.ts syntax error
- CORS double-header issue (gateway + services)
- Login redirect loop (cookie + window.location.href)
- Global search hardcoded localhost URL
- Integration page not persisting config
- Hardcoded personal email in test flow
- `.md` and `.bat` files in `.gitignore`

## v4.1.0 (June 2026)

### 🆕 New Features
- Action & Mitigation module — takedown requests, blocking, SOAR
- AI-powered threat analysis with Gemini
- Dark web monitoring and brand protection
- War Room real-time incident response
- Executive protection monitoring
- Third-party risk management

### 🔒 Security
- JWT-based authentication
- Multi-tenant data isolation
- Role-based access control (7 roles)
- Input validation with Zod

## v4.0.0 (May 2026)

### 🆕 Initial Release
- Attack surface discovery (DNS, port scanning)
- CVE vulnerability database
- MITRE ATT&CK threat intelligence
- OSINT scanning and dark web monitoring
- Notification system with Socket.io
- API Gateway with microservices architecture
