# Repository Guide

## Setup and Commands

- This is a single-package Next.js 16.2.12 App Router application. Use Node.js 24+ and pnpm 11.17+; `pnpm-lock.yaml` is authoritative.
- Install dependencies with `pnpm install`. The root `pnpm-workspace.yaml` only configures pnpm build approvals; there are no workspace packages.
- Full validation follows the documented order: `pnpm typecheck`, `pnpm lint`, `pnpm test`, then `pnpm build`.
- Unit tests are Vitest tests outside `tests/`; run one with `pnpm exec vitest run lib/ory/flow.test.ts`.
- `pnpm test:e2e` runs Playwright against a freshly built `.next/standalone/server.js`. Locally it uses port `3001` (CI uses `3000`) and injects empty Ory settings, so the smoke suite intentionally tests the unconfigured setup state. Run one E2E file with `pnpm exec playwright test tests/smoke.spec.ts`.

## Application Boundaries

- Route entrypoints live in `app/`; Ory UI-node rendering is in `components/ory/`; Ory flow and identity helpers are in `lib/ory/`; `ory.config.ts` is the central provider configuration.
- Next.js 16 uses the root `proxy.ts` convention instead of `middleware.ts`. Keep the named `proxy` export and its Ory route matcher when changing request proxying. Consult the matching local guide under `node_modules/next/dist/docs/` before changing Next.js APIs or conventions.
- `@ory/nextjs/app` performs browser-flow and session calls on the server. Keep `ORY_PROJECT_API_TOKEN` server-only: never put it in a `NEXT_PUBLIC_*` variable, build argument, client component, or browser-exposed value.
- Ory-supplied inline JavaScript is not evaluated. WebAuthn/passkey triggers are invoked only through the allowlist in `components/ory/ory-trigger-runtime.tsx`; preserve that boundary when changing flow rendering.

## Configuration and Builds

- Copy `.env.example` to `.env.local` for a real Ory project. `NEXT_PUBLIC_*` values are embedded at `next build` time, so set branding, app URL, and SDK URL before building or creating a Docker image.
- `NEXT_PUBLIC_ORY_SDK_URL` is the public identity API endpoint. `NEXT_PUBLIC_ORY_CANONICAL_URL` is optional provider URL metadata for proxy rewrites; `NEXT_PUBLIC_ORY_FORM_ACTION_ORIGINS` is the exact origin allowlist for additional form destinations and OAuth client redirects; `ORY_PROJECT_API_TOKEN` is supplied only at runtime when required by the provider setup.
- `next.config.ts` uses `output: "standalone"`; the Dockerfile builds the image with public values as build args and runs the standalone server as the non-root `nextjs` user. The health endpoint is `/api/health`.
