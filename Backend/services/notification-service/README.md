# Notification Service — Real-Time Alerts & Email

> **Port:** 4005 · **Base URL:** `http://localhost:4000/api/v1/notifications` (via Gateway)

---

## 🧠 Arsitektur

```
                    ┌──────────────────────────────────────────┐
                    │            API Gateway (4000)             │
                    │  ┌────────────────────────────────────┐   │
                    │  │  Socket.io Server                  │   │
                    │  │  - Rooms: tenant:xxx, user:xxx    │   │
                    │  │  - Listens for notification:push   │   │
                    │  └──────────┬─────────────────────────┘   │
                    └─────────────┼───────────────────────────┘
                                  │
                    ┌─────────────┴──────────────┐
                    │                            │
                    ▼                            ▼
  ┌──────────────────────────┐      ┌──────────────────────────┐
  │  Notification Service    │      │  Frontend (Next.js)      │
  │  (4005)                  │      │  Socket.io-client        │
  │                          │◀─────│  - subscribe:alerts      │
  │  1. BullMQ consumer      │      │  - on('notification')    │
  │  2. Save to MongoDB      │      └──────────────────────────┘
  │  3. Push to Gateway      │
  │  4. Send email (nodemailer)│
  └──────────────────────────┘
```

### Alur Event Global

```
Discovery Service ──┐
Intelligence Svc  ──┤──→ BullMQ "notifications" queue
OSINT Service     ──┘          │
                                ▼
                    Notification Service
                    ├── Save to MongoDB
                    ├── Push via Socket.io → Gateway → Frontend
                    └── If CRITICAL/HIGH → Send email
```

---

## 📋 Endpoints

| Method | Path | Deskripsi |
|--------|------|-----------|
| `GET` | `/notifications` | Daftar notifikasi (pagination + filter) |
| `GET` | `/notifications/unread-count` | 🔴 Jumlah unread |
| `PATCH` | `/notifications/:id/read` | Tandai sudah dibaca |
| `POST` | `/notifications/read-all` | Tandai semua sudah dibaca |
| `POST` | `/notifications/send-test` | 🧪 Kirim notifikasi test |

---

## 🧪 Cara Test

### 1. Kirim Test Notification

> **POST** `http://localhost:4000/api/v1/notifications/send-test`

```json
{
  "title": "🚨 Critical RCE Detected",
  "message": "A critical remote code execution vulnerability was found affecting Apache HTTP Server. Patch immediately.",
  "severity": "CRITICAL",
  "eventType": "VULNERABILITY_FOUND"
}
```

Cek terminal notification-service, akan muncul:
```
📧 EMAIL NOTIFICATION (simulated)
  To:      ciso@company.com
  Subject: [CRITICAL] 🚨 Critical RCE Detected
```

### 2. Lihat Notifikasi

> **GET** `http://localhost:4000/api/v1/notifications`

```json
{
  "data": [
    {
      "_id": "665d...",
      "title": "🚨 Critical RCE Detected",
      "message": "A critical remote code execution vulnerability...",
      "type": "CRITICAL",
      "eventType": "VULNERABILITY_FOUND",
      "source": "notification-service",
      "read": false,
      "createdAt": "2026-07-19T..."
    }
  ],
  "pagination": { "total": 1, "page": 1, "limit": 20, "totalPages": 1 }
}
```

### 3. Cek Unread Count

> **GET** `http://localhost:4000/api/v1/notifications/unread-count`

```json
{ "total": 15, "unread": 3, "criticalUnread": 1 }
```

### 4. Tandai Dibaca

> **PATCH** `http://localhost:4000/api/v1/notifications/<id>/read`

---

## 📧 Email Simulation (Nodemailer)

Di `development`, semua email di-log ke console:

```
╔══════════════════════════════════════════════╗
║  📧 EMAIL NOTIFICATION (simulated)          ║
╠══════════════════════════════════════════════╣
║  To:      ciso@company.com                   ║
║  Subject: 🚨 [CRITICAL] Critical RCE...      ║
╠══════════════════════════════════════════════╣
║  (HTML template...)                          ║
╚══════════════════════════════════════════════╝
```

Di `production`, kirim via SMTP (konfigurasi di `.env`).

---

## 🔌 Socket.io Real-Time

Frontend Next.js sudah bisa menerima notifikasi real-time:

```typescript
// Frontend: socket.ts
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  auth: { token: 'jwt-token-here' }
});

// Subscribe ke notifikasi tenant
socket.emit('subscribe:alerts', tenantId);

// Terima notifikasi real-time
socket.on('notification', (data) => {
  console.log('🔔 New notification:', data.title);
  // Show toast / update badge
});
```
