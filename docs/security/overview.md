# Security Overview

## Authentication

- **JWT-based** authentication with access + refresh token pattern
- Access tokens expire in 24 hours (configurable)
- Refresh tokens expire in 7 days with rotation + reuse detection
- Token blacklisting on logout
- Passwords hashed with bcrypt (salt rounds: 12)

## Multi-Factor Authentication (MFA)

- TOTP-based 2FA (Google Authenticator / Microsoft Authenticator)
- QR code setup with manual key fallback
- Enforced on login if enabled — returns `requires2fa` flag
- Disable requires current password verification
- Window: 2 steps (±60s tolerance for time drift)

## Password Policy

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character
- Rate-limited: 5 attempts per 15 minutes per IP

## RBAC (Role-Based Access Control)

7 roles with granular permissions:
- `SUPER_ADMIN` — Full system access
- `SOC_MANAGER` — Operations management
- `SOC_ANALYST` — Investigation & response
- `TENANT_ADMIN` — Tenant administration
- `SECURITY_OPERATOR` — Monitoring & operations
- `COMPLIANCE_OFFICER` — Audit & compliance
- `EXECUTIVE_VIEWER` — Read-only executive view

## API Security

- JWT verification at API Gateway + service level (defense in depth)
- Rate limiting: 100 req/15min global, 30 req/15min auth endpoints
- CORS restricted to configured origins only
- Helmet security headers on all services
- SSRF protection — blocks access to private IP ranges
- Input validation via Zod schemas on every endpoint

## Data Protection

- Multi-tenant data isolation via `tenantId` filtering
- Passwords: bcrypt hashed (never stored in plaintext)
- JWT secrets: validated at startup in production
- Environment variables for all secrets (no hardcoded credentials)
- Push protection enabled on GitHub (blocks accidental secret commits)

## Audit Trail

All status changes and analyst actions are logged:
- Takedown status changes with analyst ID, timestamp, and notes
- Login history with timestamps
- API token creation and revocation
- Configuration changes