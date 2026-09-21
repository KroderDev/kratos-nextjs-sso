# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=24.15.0
ARG PNPM_VERSION=11.17.0

FROM node:${NODE_VERSION}-bookworm-slim AS base
ARG PNPM_VERSION
ENV PNPM_HOME=/pnpm
ENV PATH=${PNPM_HOME}:${PATH}
RUN corepack enable pnpm \
    && corepack install --global pnpm@${PNPM_VERSION}
WORKDIR /app

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=kratos-nextjs-sso-pnpm,target=/pnpm/store \
    pnpm fetch

FROM dependencies AS builder
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_BRAND_NAME="Your Platform"
ARG NEXT_PUBLIC_BRAND_MARK="YP"
ARG NEXT_PUBLIC_BRAND_LOGO_LIGHT="/next.svg"
ARG NEXT_PUBLIC_BRAND_LOGO_DARK="/next-dark.svg"
ARG NEXT_PUBLIC_BRAND_FAVICON_LIGHT=""
ARG NEXT_PUBLIC_BRAND_FAVICON_DARK=""
ARG NEXT_PUBLIC_ORY_SDK_URL
ARG NEXT_PUBLIC_ORY_CANONICAL_URL
ARG NEXT_PUBLIC_ORY_OAUTH_ORIGINS
ARG NEXT_PUBLIC_ORY_FORM_ACTION_ORIGINS
ARG NEXT_PUBLIC_ORY_PROJECT_NAME="Your Platform"
ARG NEXT_PUBLIC_ORY_REGISTRATION_ENABLED=true

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL}" \
    NEXT_PUBLIC_BRAND_NAME="${NEXT_PUBLIC_BRAND_NAME}" \
    NEXT_PUBLIC_BRAND_MARK="${NEXT_PUBLIC_BRAND_MARK}" \
    NEXT_PUBLIC_BRAND_LOGO_LIGHT="${NEXT_PUBLIC_BRAND_LOGO_LIGHT}" \
    NEXT_PUBLIC_BRAND_LOGO_DARK="${NEXT_PUBLIC_BRAND_LOGO_DARK}" \
    NEXT_PUBLIC_BRAND_FAVICON_LIGHT="${NEXT_PUBLIC_BRAND_FAVICON_LIGHT}" \
    NEXT_PUBLIC_BRAND_FAVICON_DARK="${NEXT_PUBLIC_BRAND_FAVICON_DARK}" \
    NEXT_PUBLIC_ORY_SDK_URL="${NEXT_PUBLIC_ORY_SDK_URL}" \
    NEXT_PUBLIC_ORY_CANONICAL_URL="${NEXT_PUBLIC_ORY_CANONICAL_URL}" \
    NEXT_PUBLIC_ORY_OAUTH_ORIGINS="${NEXT_PUBLIC_ORY_OAUTH_ORIGINS}" \
    NEXT_PUBLIC_ORY_FORM_ACTION_ORIGINS="${NEXT_PUBLIC_ORY_FORM_ACTION_ORIGINS}" \
    NEXT_PUBLIC_ORY_PROJECT_NAME="${NEXT_PUBLIC_ORY_PROJECT_NAME}" \
    NEXT_PUBLIC_ORY_REGISTRATION_ENABLED="${NEXT_PUBLIC_ORY_REGISTRATION_ENABLED}"

RUN --mount=type=cache,id=kratos-nextjs-sso-pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --offline

COPY . .
RUN pnpm build

FROM node:${NODE_VERSION}-bookworm-slim AS runner
WORKDIR /app

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000
STOPSIGNAL SIGTERM

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["node", "server.js"]
