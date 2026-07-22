# OSINT & Scraper Service — Dark Web & Digital Risk Protection

> **Port:** 4004 · **Base URL:** `http://localhost:4000/api/v1/osint` (via Gateway)

---

## 🧠 Arsitektur

```
                    ┌──────────────────┐
 POST /osint/scan ─▶│   API Gateway    │  JWT check
                    └────────┬─────────┘
                             │ proxy
                             ▼
  ┌─────────────────────────────────────────────────┐
  │           OSINT Service (4004)                   │
  │                                                  │
  │  1. API handler → create OsintScanJob            │
  │  2. Publish ke BullMQ "osint-scans"              │
  │  3. Return 202 Accepted                          │
  └───────────────────────┬─────────────────────────┘
                           │ consume
                           ▼
  ┌─────────────────────────────────────────────────┐
  │  Worker (scanner.ts)                             │
  │                                                  │
  │  Phase 1: Pastebin & Code Repos    (0% → 30%)   │
  │    - Cari credential dump                         │
  │    - Cari source code leak                        │
  │    - Cari internal document leak                  │
  │                                                  │
  │  Phase 2: Typo-squatting          (30% → 55%)   │
  │    - Deteksi domain typo-squat                    │
  │    - Deteksi lookalike domain                     │
  │                                                  │
  │  Phase 3: Social Media           (55% → 75%)    │
  │    - Deteksi akun impersonasi                     │
  │                                                  │
  │  Phase 4: Dark Web Forums        (75% → 95%)    │
  │    - Cari mention di breachforums                │
  │    - Cari thread jual akses                      │
  │                                                  │
  │  Phase 5: Finalisasi            (95% → 100%)    │
  │    - Simpan semua ke MongoDB                     │
  └─────────────────────────────────────────────────┘
```

---

## 📋 API Endpoints

| Method | Path | Deskripsi |
|--------|------|-----------|
| `POST` | `/osint/scan` | 🆕 Trigger OSINT scan (domain/company) |
| `GET` | `/osint/scan/:jobId` | Status scan |
| `GET` | `/osint/scans` | Riwayat scan |
| `GET` | `/osint/leaks` | 🔴 Daftar kebocoran dark web |
| `GET` | `/osint/leaks/:id` | Detail leak (isi lengkap) |
| `PATCH` | `/osint/leaks/:id/status` | Update status leak |
| `GET` | `/osint/exposures` | ⚠️ Daftar brand exposure |
| `GET` | `/osint/exposures/:id` | Detail exposure |
| `PATCH` | `/osint/exposures/:id/status` | Update status exposure |
| `GET` | `/osint/dashboard` | 📊 Statistik ringkasan |

---

## 🧪 Contoh Payload Postman

### 1. Start OSINT Scan

> **POST** `http://localhost:4000/api/v1/osint/scan`

**Headers:** `Authorization: Bearer <token>`

```json
{ "target": "example.com", "scanType": "DOMAIN" }
```

**Response 202:**
```json
{
  "message": "OSINT scan queued.",
  "jobId": "665a...",
  "target": "example.com",
  "scanType": "DOMAIN",
  "status": "QUEUED"
}
```

### 2. Cek Hasil Leaks

> **GET** `http://localhost:4000/api/v1/osint/leaks?severity=CRITICAL`

```json
{
  "data": [
    {
      "_id": "665b...",
      "title": "example.com — Internal Employee Credentials Leaked",
      "source": "pastebin.com",
      "domain": "example.com",
      "leakType": "CREDENTIAL_DUMP",
      "severity": "CRITICAL",
      "leakedCredentials": true,
      "emailsInvolved": 342,
      "discoveredAt": "2026-07-18T..."
    }
  ],
  "pagination": { "total": 3, "page": 1, "limit": 20, "totalPages": 1 }
}
```

### 3. Cek Brand Exposure

> **GET** `http://localhost:4000/api/v1/osint/exposures`

```json
{
  "data": [
    {
      "_id": "665c...",
      "brandName": "Example.com",
      "domain": "examp1e.com",
      "exposureType": "TYPOSQUATTING",
      "severity": "HIGH",
      "url": "https://examp1e.com",
      "status": "NEW",
      "discoveredAt": "2026-07-19T..."
    }
  ]
}
```

### 4. Dashboard

> **GET** `http://localhost:4000/api/v1/osint/dashboard`

```json
{
  "totalLeaks": 15,
  "criticalLeaks": 3,
  "totalExposures": 7,
  "criticalExposures": 1,
  "severityBreakdown": { "CRITICAL": 3, "HIGH": 5, "MEDIUM": 4, "LOW": 3 },
  "recentLeaks": [...]
}
```

---

## 🔍 Apa yang Dideteksi?

### Dark Web Leaks
| Tipe | Contoh |
|------|--------|
| Credential Dump | `admin@example.com:P@ssw0rd2024!` |
| Source Code | Repo GitHub internal bocor |
| Internal Document | Konfigurasi VPN, API keys |
| Customer Data | Database klien 5000 record |
| Dark Web Mention | Thread jual akses RDP |

### Brand Exposures
| Tipe | Contoh |
|------|--------|
| Typo-squatting | `examp1e.com`, `example-secure.com` |
| Impersonation | Akun Instagram palsu |
| Lookalike Domain | `example.net`, `my-example.com` |

---

## 🚀 Cara Menjalankan

```bash
# Prasyarat: MongoDB + Redis running

# Install dependencies
pnpm install

# Jalankan service (API + worker in-proc)
pnpm --filter @cyfirma/osint-service run dev

# Atau worker terpisah
pnpm --filter @cyfirma/osint-service run dev:worker
```
