# API Endpoints

## Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | No | Register new tenant + admin |
| POST | `/api/v1/auth/login` | No | Login (returns JWT) |
| POST | `/api/v1/auth/refresh` | No | Refresh JWT token |
| POST | `/api/v1/auth/logout` | Yes | Logout + blacklist token |
| GET | `/api/v1/auth/me` | Yes | Get current user profile |
| POST | `/api/v1/auth/change-password` | Yes | Change password |
| PUT | `/api/v1/auth/me` | Yes | Update profile |
| POST | `/api/v1/auth/2fa/setup` | Yes | Generate TOTP secret + QR |
| POST | `/api/v1/auth/2fa/verify` | Yes | Verify TOTP + enable 2FA |
| POST | `/api/v1/auth/2fa/disable` | Yes | Disable 2FA |
| GET | `/api/v1/auth/2fa/status` | Yes | Check 2FA status |
| POST | `/api/v1/auth/2fa/authenticate` | No | TOTP login step-2 |
| POST | `/api/v1/auth/tokens` | Yes | Create API token |
| GET | `/api/v1/auth/tokens` | Yes | List API tokens |

## Discovery

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/discovery/scan` | Yes | Start domain scan |
| GET | `/api/v1/discovery/scan/:jobId` | Yes | Get scan status |
| GET | `/api/v1/discovery/scans` | Yes | List all scans |
| GET | `/api/v1/discovery/domains` | Yes | List discovered assets |

## Intelligence

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/intelligence/vulnerabilities` | Yes | List CVEs with filters |
| GET | `/api/v1/intelligence/vulnerabilities/:id` | Yes | CVE detail |
| PATCH | `/api/v1/intelligence/vulnerabilities/:id/status` | Yes | Update CVE status |
| GET | `/api/v1/intelligence/threats` | Yes | List threat intel |
| GET | `/api/v1/intelligence/threats/:id` | Yes | Threat detail |
| GET | `/api/v1/intelligence/dashboard` | Yes | Summary statistics |
| GET | `/api/v1/intelligence/search?q=` | Yes | Global search |

## Action & Mitigation

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/action/takedown` | Yes | Submit takedown request |
| GET | `/api/v1/action/takedown` | Yes | List takedowns |
| PATCH | `/api/v1/action/takedown/:id/status` | Yes | Update status |
| POST | `/api/v1/action/takedown/:id/dispatch-email` | Yes | Dispatch legal email |
| POST | `/api/v1/action/takedown/:id/execute-one-click` | Yes | SOAR auto-execute |
| POST | `/api/v1/action/mitigation/block` | Yes | Manual IP/domain block |
| POST | `/api/v1/action/webhook/send` | Yes | Send webhook |

## Notifications

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/notifications` | Yes | List notifications |
| GET | `/api/v1/notifications/:id` | Yes | Get notification detail |
| PATCH | `/api/v1/notifications/:id/read` | Yes | Mark as read |
| POST | `/api/v1/notifications/read-all` | Yes | Mark all as read |

## OSINT

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/osint/scan` | Yes | Trigger OSINT scan |
| GET | `/api/v1/osint/leaks` | Yes | List dark web leaks |
| GET | `/api/v1/osint/exposures` | Yes | List brand exposures |
| GET | `/api/v1/osint/executive` | Yes | List executive profiles |

## AI

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/ai/generate` | Yes | Generate AI insight |
| POST | `/api/v1/ai/summarize` | Yes | Summarize text |
| POST | `/api/v1/ai/analyze-threat` | Yes | Analyze threat |
| GET | `/api/v1/ai/insights` | Yes | List AI insights |

## Reports

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/reports/generate` | Yes | Generate PDF report |
