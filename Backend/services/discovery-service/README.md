# Discovery Service — Attack Surface Discovery

> **Port:** 4002 · **Base URL:** `http://localhost:4000/api/v1/discovery` (via Gateway)

---

## 🧠 Arsitektur

```
                     ┌──────────────────┐
  POST /scan ───────▶│   API Gateway    │
                     │   (port 4000)    │
                     └────────┬─────────┘
                              │ proxy
                              ▼
                     ┌──────────────────┐     ┌────────────┐
                     │ Discovery Svc    │────▶│  MongoDB   │
                     │ (port 4002)      │     └────────────┘
                     └────────┬─────────┘
                              │ publish
                              ▼
                     ┌──────────────────┐     ┌────────────┐
                     │   BullMQ Queue   │────▶│   Redis    │
                     │ discover-scans   │     └────────────┘
                     └────────┬─────────┘
                              │ consume
                              ▼
                     ┌──────────────────┐     ┌────────────┐
                     │  Worker (async)  │────▶│  MongoDB   │
                     │   scanner.ts     │     │ (results)  │
                     └──────────────────┘
```

- **API** menerima request → publish job ke **BullMQ** queue → return `202 Accepted`
- **Worker** mengambil job dari queue → menjalankan scanner → simpan hasil ke **MongoDB**
- Scanner melakukan **real DNS resolution** untuk subdomain + port scan simulasi

---

## 📋 Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/discovery/scan` | ✅ Bearer | Start a domain scan (async) |
| GET | `/api/v1/discovery/scan/:jobId` | ✅ Bearer | Get scan status & results |
| GET | `/api/v1/discovery/scans` | ✅ Bearer | List all scan jobs |
| GET | `/api/v1/discovery/domains` | ✅ Bearer | List discovered assets |
| GET | `/api/v1/discovery/domains/:id` | ✅ Bearer | Get domain details |
| GET | `/api/v1/health` | ❌ | Health check |
| GET | `/api/v1/health/ready` | ❌ | Readiness (MongoDB + Redis) |

---

## 🧪 Contoh Payload Postman

### 1. Start Scan

> **POST** `http://localhost:4000/api/v1/discovery/scan`

**Headers:** `Authorization: Bearer <token-from-auth>`

```json
{
  "domain": "example.com"
}
```

**Response 202:**
```json
{
  "message": "Scan queued successfully.",
  "jobId": "665a1b2c3d4e5f6a7b8c9d0e",
  "domain": "example.com",
  "status": "QUEUED"
}
```

---

### 2. Get Scan Status

> **GET** `http://localhost:4000/api/v1/discovery/scan/665a1b2c3d4e5f6a7b8c9d0e`

**Headers:** `Authorization: Bearer <token>`

**Response 200 (RUNNING):**
```json
{
  "jobId": "665a1b2c3d4e5f6a7b8c9d0e",
  "domain": "example.com",
  "status": "RUNNING",
  "progress": 45,
  "subdomainsFound": 0,
  "openPortsFound": 0,
  "startedAt": "2026-07-19T10:30:00.000Z",
  "completedAt": null,
  "error": null,
  "resultSummary": null,
  "createdAt": "2026-07-19T10:29:59.000Z"
}
```

**Response 200 (COMPLETED):**
```json
{
  "jobId": "665a1b2c3d4e5f6a7b8c9d0e",
  "domain": "example.com",
  "status": "COMPLETED",
  "progress": 100,
  "subdomainsFound": 12,
  "openPortsFound": 8,
  "startedAt": "2026-07-19T10:30:00.000Z",
  "completedAt": "2026-07-19T10:31:15.000Z",
  "error": null,
  "resultSummary": {
    "totalSubdomainsChecked": 48,
    "resolvableSubdomains": [
      "www.example.com",
      "mail.example.com",
      "api.example.com"
    ],
    "openPorts": [
      { "port": 80, "service": "HTTP", "protocol": "TCP" },
      { "port": 443, "service": "HTTPS", "protocol": "TCP" },
      { "port": 22, "service": "SSH", "protocol": "TCP" }
    ],
    "technologies": [
      { "name": "Nginx", "category": "WEB_SERVER" },
      { "name": "Cloudflare", "category": "CDN" }
    ]
  },
  "createdAt": "2026-07-19T10:29:59.000Z"
}
```

---

### 3. List Scan Jobs

> **GET** `http://localhost:4000/api/v1/discovery/scans?page=1&limit=10`

**Headers:** `Authorization: Bearer <token>`

```json
{
  "data": [
    {
      "jobId": "665a...",
      "domain": "example.com",
      "status": "COMPLETED",
      "progress": 100,
      "subdomainsFound": 12,
      "openPortsFound": 8,
      "createdAt": "2026-07-19T10:29:59.000Z",
      "completedAt": "2026-07-19T10:31:15.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### 4. List Discovered Domains

> **GET** `http://localhost:4000/api/v1/discovery/domains?page=1&limit=20`

```json
{
  "data": [
    {
      "id": "665b...",
      "domain": "www.example.com",
      "parentDomain": "example.com",
      "ipAddress": "93.184.216.34",
      "ports": [
        { "port": 80, "service": "HTTP" },
        { "port": 443, "service": "HTTPS" }
      ],
      "technologies": [
        { "name": "Nginx", "category": "WEB_SERVER" }
      ],
      "isActive": true,
      "lastSeenAt": "2026-07-19T10:31:15.000Z"
    }
  ],
  "pagination": {
    "total": 12,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### 5. Get Single Domain Detail

> **GET** `http://localhost:4000/api/v1/discovery/domains/665b...`

```json
{
  "id": "665b...",
  "domain": "www.example.com",
  "parentDomain": "example.com",
  "ipAddress": "93.184.216.34",
  "ports": [
    { "port": 80, "service": "HTTP", "protocol": "TCP", "isOpen": true },
    { "port": 443, "service": "HTTPS", "protocol": "TCP", "isOpen": true }
  ],
  "technologies": [
    { "name": "Nginx", "category": "WEB_SERVER" }
  ],
  "ssl": null,
  "isActive": true,
  "lastSeenAt": "2026-07-19T10:31:15.000Z",
  "scanJobId": "665a...",
  "createdAt": "2026-07-19T10:31:15.000Z"
}
```

---

## ⚙️ Cara Menjalankan

```bash
# Prasyarat: Redis harus berjalan di localhost:6379

# 1. Install dependencies (dari root Backend/)
pnpm install

# 2. Jalankan service + worker (dalam satu proses — mode dev)
pnpm --filter @cyfirma/discovery-service run dev

# Atau jalankan worker terpisah (scaling):
pnpm --filter @cyfirma/discovery-service run dev:worker
```

### Skenario Scaling

```
# Production — jalankan di instance terpisah:
# Instance 1: API server
node dist/index.js

# Instance 2-N: Workers (horizontal scaling)
node dist/worker.js
```
