# syntax=docker/dockerfile:1

# Stage 1: Base Alpine runtime environment (Prisma aur Node ke system libraries ke saath)
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Stage 2: Dependencies install karo package-lock.json se
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Stage 3: Prisma client generate karo aur Next.js standalone build banao
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma client generation
RUN npx prisma generate

# Production standalone build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npx next build

# Stage 4: Production runner (secure non-root user ke saath)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Security ke liye non-root user setup karo
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Static files aur standalone bundle copy karo
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000

    CMD ["node", "server.js"]
