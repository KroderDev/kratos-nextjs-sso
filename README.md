# Identity Frontend

A server-rendered identity frontend built with Next.js App Router, React, Tailwind CSS, and shadcn/ui Base UI components.

## Requirements

- Node.js 24 or newer
- pnpm 11.17 or newer
- An Ory Network project or another compatible public identity API

## Local Setup

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Branding

The default UI uses neutral platform branding so the project can be forked without carrying an application identity:

```env
NEXT_PUBLIC_BRAND_NAME=Your Platform
NEXT_PUBLIC_BRAND_MARK=Y
```

These public values are embedded during `next build`. Set them before building a Docker image or deploying the application. The mark accepts up to two characters and falls back to the first character of the brand name.

The interface uses shadcn/ui components with Tailwind CSS semantic tokens. Customize the theme through the existing `components.json` preset and the shadcn CLI, or replace the app icon at `app/favicon.ico` with the platform's production asset.

### Docker

```bash
docker build \
  --build-arg "NEXT_PUBLIC_APP_URL=http://localhost:3000" \
  --build-arg "NEXT_PUBLIC_BRAND_NAME=Your Platform" \
  --build-arg "NEXT_PUBLIC_BRAND_MARK=Y" \
  --build-arg "NEXT_PUBLIC_ORY_SDK_URL=" \
  -t kratos-nextjs-sso:latest .

docker run --rm -p 3000:3000 kratos-nextjs-sso:latest
```

With Ory configured:

```bash
docker build \
  --build-arg "NEXT_PUBLIC_APP_URL=https://auth.example.com" \
  --build-arg "NEXT_PUBLIC_BRAND_NAME=Your Platform" \
  --build-arg "NEXT_PUBLIC_BRAND_MARK=Y" \
  --build-arg "NEXT_PUBLIC_ORY_SDK_URL=https://your-project.projects.oryapis.com" \
  -t kratos-nextjs-sso:latest .

docker run --rm -p 3000:3000 \
  -e ORY_PROJECT_API_TOKEN=ory_pat_... \
  kratos-nextjs-sso:latest
```

The image runs as a non-root `nextjs` user and includes a health check at `/api/health`.

Create `.env.local` from `.env.example` and set the Ory values before using a real browser flow:

```env
NEXT_PUBLIC_BRAND_NAME=Your Platform
NEXT_PUBLIC_BRAND_MARK=Y
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ORY_SDK_URL=https://your-project.projects.oryapis.com
NEXT_PUBLIC_ORY_CANONICAL_URL=
NEXT_PUBLIC_ORY_PROJECT_NAME=Your Platform
ORY_PROJECT_API_TOKEN=ory_pat_...
```

`NEXT_PUBLIC_ORY_SDK_URL` points at the public identity API used by the browser flows. `NEXT_PUBLIC_ORY_PROJECT_NAME` is provider configuration and is not shown to end users. `ORY_PROJECT_API_TOKEN` is server-only and is used by `proxy.ts` when the provider API is proxied through the application.

`NEXT_PUBLIC_*` values are build-time configuration. Keep `ORY_PROJECT_API_TOKEN` out of build arguments, source control, and browser-exposed environment variables.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Public access landing page |
| `/auth/login` | Login browser flow |
| `/auth/registration` | Registration browser flow |
| `/auth/recovery` | Account recovery browser flow |
| `/auth/verification` | Address verification browser flow |
| `/auth/settings` | Protected settings browser flow |
| `/auth/error` | Safe error destination for failed Ory flows |
| `/dashboard` | Protected session dashboard |

## Architecture

- `ory.config.ts` derives Ory UI URLs from `NEXT_PUBLIC_APP_URL` and keeps the SDK URL configuration in one place.
- `proxy.ts` uses `createOryMiddleware` to proxy Ory self-service endpoints, rewrite redirect URLs, and forward cookies safely.
- `@ory/nextjs/app` creates and loads browser flows on the server. The app does not expose Ory API tokens to the browser.
- `components/ory/ory-node.tsx` renders Ory UI nodes as native form controls while preserving Ory's action, method, hidden fields, and CSRF token.
- `components/ory/ory-trigger-runtime.tsx` loads Ory's browser WebAuthn script only when needed and exposes an allowlist of supported trigger names; arbitrary inline Ory `onclick` JavaScript is never evaluated.
- `/dashboard` calls `getServerSession()` and redirects unauthenticated requests to login.
- Shadcn components live in `components/ui` and use the project's Base UI preset with semantic CSS tokens in `app/globals.css`.

## Validation

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

The tests cover the pure Ory node helpers. Real sign-in, registration, recovery, verification, and settings behavior requires a configured Ory project and credentials.

## References

- [Ory browser flows](https://www.ory.com/docs/security-model)
- [Ory Next.js example](https://github.com/ory/kratos-nextjs-react-example)
- [Ory Elements App Router example](https://github.com/ory/elements/tree/main/examples/nextjs-app-router)
- [Next.js proxy convention](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
