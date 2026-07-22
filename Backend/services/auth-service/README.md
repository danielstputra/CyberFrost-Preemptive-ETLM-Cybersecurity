# Auth & Tenant Service

> **Port:** 4001 · **Base URL:** `http://localhost:4001/api/v1/auth`

---

## 📋 Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | ❌ | Register new tenant + admin user |
| POST | `/api/v1/auth/login` | ❌ | Login, returns JWT pair |
| POST | `/api/v1/auth/refresh` | ❌ | Exchange refresh token for new JWT pair |
| GET | `/api/v1/auth/me` | ✅ Bearer | Current user profile |
| POST | `/api/v1/auth/logout` | ✅ Bearer | Invalidate refresh token |
| GET | `/api/v1/health` | ❌ | Health check |
| GET | `/api/v1/health/ready` | ❌ | Readiness probe (pings DB) |

---

## 🧪 Contoh Payload Postman

### 1. Register (Tenant + Admin User)

> **POST** `http://localhost:4000/api/v1/auth/register`

Melalui API Gateway (port 4000), request akan di-proxy ke auth-service (port 4001).

```json
{
  "email": "admin@ptcysolusi.com",
  "password": "Cyber123!",
  "name": "Budi Santoso",
  "tenantName": "PT Cyber Solusi Nusantara",
  "tenantSlug": "pt-cyber-solusi"
}
```

**Response 201:**
```json
{
  "message": "Registration successful.",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "a1b2c3d4-...",
    "email": "admin@ptcysolusi.com",
    "name": "Budi Santoso",
    "role": "ADMIN",
    "tenantId": "e5f6g7h8-...",
    "createdAt": "2026-07-19T..."
  },
  "tenant": {
    "id": "e5f6g7h8-...",
    "name": "PT Cyber Solusi Nusantara",
    "slug": "pt-cyber-solusi"
  }
}
```

---

### 2. Login

> **POST** `http://localhost:4000/api/v1/auth/login`

```json
{
  "email": "admin@ptcysolusi.com",
  "password": "Cyber123!"
}
```

**Response 200:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "a1b2c3d4-...",
    "email": "admin@ptcysolusi.com",
    "name": "Budi Santoso",
    "role": "ADMIN",
    "lastLoginAt": "2026-07-19T10:30:00.000Z",
    "tenant": {
      "id": "e5f6g7h8-...",
      "name": "PT Cyber Solusi Nusantara",
      "slug": "pt-cyber-solusi"
    }
  }
}
```

**Error Response 401:**
```json
{
  "error": "UNAUTHORIZED",
  "message": "Invalid email or password."
}
```

---

### 3. Refresh Token

> **POST** `http://localhost:4000/api/v1/auth/refresh`

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs... (dari login / register)"
}
```

**Response 200:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs... (baru)",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs... (baru)"
}
```

**Error Response 401 (expired):**
```json
{
  "error": "TOKEN_EXPIRED",
  "message": "Refresh token has expired. Login again."
}
```

---

### 4. Get Profile (Me)

> **GET** `http://localhost:4000/api/v1/auth/me`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Response 200:**
```json
{
  "user": {
    "id": "a1b2c3d4-...",
    "email": "admin@ptcysolusi.com",
    "name": "Budi Santoso",
    "role": "ADMIN",
    "isActive": true,
    "lastLoginAt": "2026-07-19T10:30:00.000Z",
    "createdAt": "2026-07-19T10:00:00.000Z",
    "tenant": {
      "id": "e5f6g7h8-...",
      "name": "PT Cyber Solusi Nusantara",
      "slug": "pt-cyber-solusi",
      "logoUrl": null
    }
  }
}
```

---

### 5. Logout

> **POST** `http://localhost:4000/api/v1/auth/logout`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Body:** (kosong / `{}`)

**Response 200:**
```json
{
  "message": "Logged out successfully."
}
```

---

### 6. Health Check

> **GET** `http://localhost:4000/api/v1/health`

```json
{
  "status": "healthy",
  "service": "api-gateway",
  "uptime": 1234.56,
  "timestamp": "2026-07-19T10:00:00.000Z",
  "version": "1.0.0"
}
```

> **GET** `http://localhost:4001/api/v1/health/ready`

```json
{
  "ready": true,
  "database": "connected"
}
```

---

## 🔐 Alur Autentikasi

```
┌──────────┐       ┌──────────────┐       ┌──────────────┐       ┌────────────┐
│  Client  │ ──1──▶│ API Gateway  │ ──2──▶│ Auth Service │ ──3──▶│ PostgreSQL │
│ (Postman)│       │  (port 4000) │       │  (port 4001) │       │            │
└──────────┘       └──────────────┘       └──────────────┘       └────────────┘
     ▲                    │                       │                     │
     └──────── 4 ─────────┴────── JWT Token ──────┴─────────────────────┘

1. Client mengirim credential (email + password)
2. Gateway meneruskan ke Auth Service (proxy)
3. Auth Service verifikasi ke PostgreSQL
4. JWT dikembalikan ke client via Gateway
5. Request berikutnya: client kirim Bearer token di header
```

---

## 🚀 Cara Test Manual (Postman)

1. **Register** — buat tenant + admin user
2. **Login** — dapatkan `accessToken` + `refreshToken`
3. Copy `accessToken` → tab **Authorization** pilih `Bearer Token`
4. **GET /me** — lihat profile user
5. **POST /refresh** — refresh token jika expired
6. **POST /logout** — logout untuk invalidate session

> **Catatan:** Akses melalui **API Gateway (port 4000)**, bukan langsung ke auth-service (4001). Gateway yang handle rate limiting dan routing.
