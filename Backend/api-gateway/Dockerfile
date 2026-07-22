# ─────────────────────────────────────────────
#  API Gateway — Multi-stage Docker Build
# ─────────────────────────────────────────────

# ── Stage 1: Install deps & build ──
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-lock.yaml package.json ./
COPY api-gateway/ api-gateway/
COPY shared/ shared/

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @cyfirma/api-gateway run build

# ── Stage 2: Production image ──
FROM node:22-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=builder /app/pnpm-lock.yaml /app/package.json ./
COPY --from=builder /app/api-gateway/package.json ./api-gateway/
COPY --from=builder /app/api-gateway/dist ./api-gateway/dist
COPY --from=builder /app/shared ./shared

RUN pnpm install --prod --frozen-lockfile

EXPOSE 4000

CMD ["node", "api-gateway/dist/index.js"]
