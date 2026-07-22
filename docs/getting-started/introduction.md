# Introduction

CyberFrost is a **Preemptive External Threat Landscape Management (ETLM)** platform designed for enterprise security teams. It provides continuous monitoring, AI-powered threat analysis, and automated mitigation across your entire digital footprint.

## Key Capabilities

| Capability | Description |
|---|---|
| **Attack Surface Discovery** | Automated subdomain enumeration, port scanning, and technology detection |
| **Vulnerability Intelligence** | Real-time CVE monitoring from NVD and CISA KEV |
| **Threat Intelligence** | MITRE ATT&CK mapping, IoC extraction, threat actor tracking |
| **OSINT & Dark Web** | Credential leak detection, brand impersonation monitoring |
| **Action & Mitigation** | One-click takedown, firewall blocking, Kominfo integration |
| **AI-Powered Analysis** | Google Gemini for threat analysis and scenario generation |
| **Executive Protection** | VIP monitoring, dark web leak detection, impersonation takedown |
| **Third-Party Risk** | Vendor risk assessment and supply chain monitoring |
| **War Room** | Real-time incident response collaboration |

## Architecture

CyberFrost uses a **microservices architecture** with:
- **Frontend:** Next.js 16 (React 19) with Shadcn UI
- **Backend:** 9 Node.js microservices behind an API Gateway
- **Database:** PostgreSQL (Auth) + MongoDB (Services)
- **Message Queue:** BullMQ (Redis) + RabbitMQ
- **Realtime:** Socket.io for live notifications
- **Mobile:** Capacitor 8 (Android APK)
