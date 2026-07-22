# Intelligence Service — Vulnerability & Threat Intelligence

> **Port:** 4003 · **Base URL:** `http://localhost:4000/api/v1/intelligence` (via Gateway)

---

## 📋 Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/intelligence/vulnerabilities` | ✅ | List CVE with pagination + filtering |
| `GET` | `/intelligence/vulnerabilities/:id` | ✅ | Single CVE detail |
| `PATCH` | `/intelligence/vulnerabilities/:id/status` | ✅ | Update vuln status |
| `GET` | `/intelligence/threats` | ✅ | List threat intelligence |
| `GET` | `/intelligence/threats/:id` | ✅ | Threat detail (with IOCs) |
| `GET` | `/intelligence/dashboard` | ✅ | Summary statistics |

### Query Parameters (for list endpoints)

| Param | Type | Example | Description |
|-------|------|---------|-------------|
| `page` | int | `1` | Page number |
| `limit` | int | `20` | Items per page (max 100) |
| `severity` | string | `CRITICAL` | Filter: LOW, MEDIUM, HIGH, CRITICAL |
| `status` | string | `NEW` | Filter: NEW, REVIEWING, PATCHED, ACCEPTED |
| `search` | string | `Apache` | Full-text search in title/description |
| `exploitAvailable` | bool | `true` | Filter by exploit availability |
| `sortBy` | string | `publishedAt` | Sort field |
| `sortOrder` | string | `desc` | asc / desc |

---

## 🧪 Contoh Payload Postman

### 1. List Vulnerabilities (with filter)

> **GET** `http://localhost:4000/api/v1/intelligence/vulnerabilities?severity=CRITICAL&page=1&limit=10&exploitAvailable=true`

**Headers:** `Authorization: Bearer <token>`

```json
{
  "data": [
    {
      "id": "665a...",
      "cveId": "CVE-2026-10001",
      "title": "Critical RCE in Apache HTTP Server 2.4.x",
      "description": "A heap-based buffer overflow...",
      "cvss": { "score": 9.8, "vector": "CVSS:3.1/AV:N/AC:L/..." },
      "severity": "CRITICAL",
      "affectedProducts": ["Apache HTTP Server 2.4.59"],
      "exploitAvailable": true,
      "publishedAt": "2026-07-19T...",
      "source": "NVD",
      "status": "NEW",
      "tags": ["critical", "remote-exploit"]
    }
  ],
  "pagination": { "total": 2, "page": 1, "limit": 10, "totalPages": 1 },
  "filters": { "severity": "CRITICAL", "status": null, "search": null, "exploitAvailable": true }
}
```

### 2. Update Vulnerability Status

> **PATCH** `http://localhost:4000/api/v1/intelligence/vulnerabilities/<id>/status`

```json
{ "status": "REVIEWING" }
```

### 3. Dashboard

> **GET** `http://localhost:4000/api/v1/intelligence/dashboard`

```json
{
  "totalVulnerabilities": 150,
  "severityBreakdown": { "CRITICAL": 12, "HIGH": 38, "MEDIUM": 65, "LOW": 35 },
  "exploitsAvailable": 18,
  "recentVulnerabilities": [...],
  "activeThreats": [...],
  "threatTypeBreakdown": { "APT": 3, "RANSOMWARE": 2, "PHISHING": 1, ... }
}
```

---

## ⏰ Cron Job

Service ini menjalankan **node-cron** yang mensimulasikan penarikan data ancaman dari sumber eksternal setiap **30 menit** (dapat diubah via env `INTEL_CRON_INTERVAL`).

Pada setiap tick, cron akan:
1. Generate 5 CVE baru (random realistic data) ke koleksi `vulnerabilities`
2. Generate 2-3 threat intel baru ke koleksi `threat_intel`
3. Melewatkan duplikat (berdasarkan `cveId` / `title`)

### Cara Menjalankan

```bash
# Seed data awal (6 sample CVE + 5 sample threats)
pnpm --filter @cyfirma/intelligence-service run seed

# Jalankan service (API + cron otomatis mulai)
pnpm --filter @cyfirma/intelligence-service run dev
```
