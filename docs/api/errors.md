# Error Codes

## HTTP Status Codes

| Code | Meaning | Description |
|---|---|---|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created |
| 202 | Accepted | Request queued |
| 400 | Bad Request | Invalid input / validation error |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |
| 502 | Bad Gateway | Upstream service unavailable |

## Application Error Codes

| Code | HTTP | Description |
|---|---|---|
| `VALIDATION` | 400 | Zod validation failed |
| `UNAUTHORIZED` | 401 | Invalid credentials |
| `TOKEN_EXPIRED` | 401 | JWT has expired |
| `INVALID_TOKEN` | 401 | JWT is malformed |
| `TOKEN_BLACKLISTED` | 401 | Token was invalidated |
| `TOKEN_REUSED` | 401 | Refresh token reuse detected |
| `FORBIDDEN` | 403 | Role lacks required permission |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL` | 500 | Unexpected error |
| `SERVICE_UNAVAILABLE` | 502 | Upstream service is down |

## 2FA Error Codes

| Code | HTTP | Description |
|---|---|---|
| `2FA_NOT_CONFIGURED` | 401 | User has 2FA enabled but no secret |
| `2FA_ALREADY_ENABLED` | 400 | 2FA already active |
| `INVALID_2FA` | 401 | Wrong TOTP code |
| `INVALID_TOKEN` | 400 | Wrong verification code |
| `NO_SECRET` | 400 | Run /2fa/setup first |

## Response Format

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description"
}
```

Validation errors include details:
```json
{
  "error": "VALIDATION",
  "details": [
    { "field": "email", "message": "Valid email is required" }
  ]
}
```
