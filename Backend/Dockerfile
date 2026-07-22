# ─────────────────────────────────────────────
#  CyberFrost Backend — Single-stage Docker Build
# ─────────────────────────────────────────────

FROM node:22-alpine AS base

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace manifests
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./

# Copy all package.json files for workspace resolution
COPY api-gateway/package.json ./api-gateway/
COPY shared/package.json ./shared/
COPY services/*/package.json ./services/

# Install ALL dependencies (including devDeps needed for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY api-gateway/ ./api-gateway/
COPY shared/ ./shared/
COPY services/ ./services/

# Build all services
RUN pnpm build

# Prisma generate for auth-service
RUN cd services/auth-service && npx prisma generate --no-hints 2>/dev/null || true

# Remove devDependencies to reduce image size
RUN pnpm prune --prod 2>/dev/null || true

EXPOSE 4000

# Non-sensitive runtime arg only
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

# Start all services via concurrently (gateway must be first for healthcheck)
CMD ["sh", "-c", "node --no-deprecation api-gateway/dist/server.js & \
  node services/auth-service/dist/index.js & \
  node services/discovery-service/dist/index.js & \
  node services/intelligence-service/dist/index.js & \
  node services/osint-service/dist/index.js & \
  node services/notification-service/dist/index.js & \
  node services/action-mitigation-service/dist/index.js & \
  node services/ai-service/dist/index.js & \
  node services/report-service/dist/index.js & \
  wait"]
