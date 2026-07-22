# System Architecture

## Microservices Overview

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client   │────▶│  Vercel  │────▶│  Railway │
│ (Browser) │     │ (Next.js)│     │ (Backend)│
└──────────┘     └──────────┘     └─────┬────┘
                                        │
                               ┌────────▼────────┐
                               │   API Gateway    │
                               │   (Port 4000)    │
                               └──┬──┬──┬──┬──┬──┘
                                  │  │  │  │  │
        ┌─────────────────────────┘  │  │  │  └──────────┐
        │          ┌──────────────────┘  │  └──────┐      │
        ▼          ▼          ▼          ▼         ▼      ▼
   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────┐ ┌──────┐
   │ Auth   │ │Discov- │ │ Intel  │ │ OSINT  │ │Action│ │ AI   │
   │ Service│ │ery     │ │Service │ │Service │ │& Mit │ │Service│
   │ :4001  │ │:4002   │ │ :4003  │ │ :4004  │ │:4006 │ │:4007 │
   └───┬────┘ └────────┘ └────────┘ └────────┘ └──┬───┘ └──────┘
       │                                           │
       ▼                                           ▼
  ┌────────┐                                 ┌──────────┐
  │PostgreSQL│                                │ MongoDB  │
  │  (Auth)  │                                │ (Events) │
  └────────┘                                 └──────────┘
```

## Database Strategy

| Service | Database | Purpose |
|---|---|---|
| Auth Service | PostgreSQL | Users, tenants, roles, tokens |
| All others | MongoDB | Events, assets, intelligence data |

## Message Queues

| Queue | Technology | Purpose |
|---|---|---|
| BullMQ | Redis | Scan jobs, notifications, async tasks |
| RabbitMQ | AMQP | Event bus for cross-service communication |

## Coding Standards

- **Language:** TypeScript (strict mode)
- **Formatting:** Prettier with single quotes, 120 print width
- **Linting:** ESLint with TypeScript rules
- **Imports:** ES modules (`import`/`export`)
- **Validation:** Zod schemas on all API inputs
- **Error handling:** try/catch with zod discrimination
- **Logging:** Pino structured logger (Backend), console (Frontend)
