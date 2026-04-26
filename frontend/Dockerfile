# syntax=docker/dockerfile:1.7

# ─── 1. deps ─────────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* npm-shrinkwrap.json* ./
RUN if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; \
    else npm install --no-audit --no-fund; fi

# ─── 2. builder ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* values must be present at build time so they get inlined.
ARG NEXT_PUBLIC_BFF_URL
ARG NEXT_PUBLIC_USE_MOCKS
ENV NEXT_PUBLIC_BFF_URL=${NEXT_PUBLIC_BFF_URL}
ENV NEXT_PUBLIC_USE_MOCKS=${NEXT_PUBLIC_USE_MOCKS}
RUN npm run build

# ─── 3. runner ───────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as a non-root user for safety.
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy the standalone server output (next.config: output: 'standalone').
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public          ./public

USER nextjs
EXPOSE 3000

# Lightweight health check — relies on Node, no curl/wget needed.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
