# kratos-nextjs-sso

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen?style=flat-square)](https://kratos-nextjs-sso.vercel.app)
[![CI](https://img.shields.io/github/actions/workflow/status/KroderDev/kratos-nextjs-sso/ci.yml?branch=master&label=CI&style=flat-square)](https://github.com/KroderDev/kratos-nextjs-sso/actions/workflows/ci.yml)
[![codecov](https://codecov.io/github/KroderDev/kratos-nextjs-sso/graph/badge.svg?token=G5MF0O5IFS)](https://codecov.io/github/KroderDev/kratos-nextjs-sso)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.12-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0.3-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/node-24-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-11.17.0-F69220?style=flat-square&logo=pnpm&logoColor=white)](https://pnpm.io)

## Fork it. Make it yours. Ship production-ready SSO.

This is a **polished Next.js App Router frontend** for [Ory Kratos](https://www.ory.com/kratos), ready to become the identity surface for your product.

**Fork it, replace the neutral branding, connect your Ory project, and deploy** a complete sign-in experience without building auth screens from scratch.

[Open the live demo](https://kratos-nextjs-sso.vercel.app) to see the full experience.

## What You Get

- **Complete auth flows:** login, registration, recovery, verification, and account settings.
- **Protected dashboard routes** with server-side session checks.
- **Accessible native form controls** rendered from Ory UI nodes.
- **Theme-aware branding:** logos, favicons, dark mode, and shadcn/ui theming.
- **Automatic English and Spanish support** with a typed locale system.
- **WebAuthn/passkey support** through a safe trigger allowlist.
- **Security hardening:** provider URL validation, security headers, origin checks, and server-only API tokens.
- **Production packaging:** standalone Docker output, non-root runtime, and a `/api/health` endpoint.
- **Automated coverage** with unit, security, and Playwright smoke tests.

## Fork And Run

### Requirements

- Node.js 24 or newer
- pnpm 11.17 or newer
- An Ory Network project or another compatible public identity API

### 1. **Fork and install**

```bash
git clone https://github.com/YOUR_USERNAME/kratos-nextjs-sso.git
cd kratos-nextjs-sso
pnpm install
```

### 2. **Configure your identity project**

Copy `.env.example` to `.env.local` and set your public app URL and Ory SDK URL:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ORY_SDK_URL=https://your-project.projects.oryapis.com
NEXT_PUBLIC_ORY_PROJECT_NAME=Your Platform
ORY_PROJECT_API_TOKEN=ory_pat_...
```

`ORY_PROJECT_API_TOKEN` is **server-only**. Never expose it through a `NEXT_PUBLIC_*` variable, Docker build argument, client component, or browser bundle.

### 3. **Start customizing**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Make It Yours

**Your brand, your theme, your identity experience.**

### Brand your identity surface

Set these values in `.env.local` or in your deployment build configuration:

```env
NEXT_PUBLIC_BRAND_NAME=Your Platform
NEXT_PUBLIC_BRAND_MARK=YP
NEXT_PUBLIC_BRAND_LOGO_LIGHT=/your-logo.svg
NEXT_PUBLIC_BRAND_LOGO_DARK=/your-logo-dark.svg
NEXT_PUBLIC_BRAND_FAVICON_LIGHT=/your-favicon.ico
NEXT_PUBLIC_BRAND_FAVICON_DARK=/your-favicon-dark.ico
```

Put custom assets under `public/`. `NEXT_PUBLIC_*` values are **embedded at build time**, so set them before `next build` or before building a Docker image. If favicon paths are omitted, the app uses `app/favicon.ico`.

### Shape the interface

- Change colors and typography through the semantic tokens in `app/globals.css`.
- Apply a shadcn preset with `pnpm dlx shadcn@latest apply --preset PRESET_ID --only theme`.
- Apply only a font preset with `pnpm dlx shadcn@latest apply --preset PRESET_ID --only font`.
- Add another locale in `lib/i18n/locales/`; the typed dictionary and tests enforce complete key coverage.

See [`docs/i18n.md`](docs/i18n.md) for localization details.

## Deploy To Production

Deploy the app wherever you run Next.js reliably: **Vercel, Coolify, Netlify, Render, Railway, AWS, a container platform, or your own Node.js host**. The repository includes standalone Docker output for platforms that deploy from a `Dockerfile`, but Docker is not required.

### **Managed Next.js Platforms**

Import your fork into a managed Next.js platform such as Vercel, Coolify, Netlify, Render, Railway, or AWS. Use the platform's native Next.js build or its Dockerfile deployment, then configure the public `NEXT_PUBLIC_*` values as build environment variables. Set `ORY_PROJECT_API_TOKEN` as a server-side runtime secret only when your Ory setup requires the application proxy. Do not expose it to the browser or include it in build arguments.

Set the public domain as `NEXT_PUBLIC_APP_URL`, enable HTTPS, configure Ory return URLs and allowed origins, and point health checks at `/api/health`.

### **Docker**

The application builds as a Next.js standalone server and runs in Docker as the non-root `nextjs` user.

```bash
docker build \
  --build-arg "NEXT_PUBLIC_APP_URL=https://auth.example.com" \
  --build-arg "NEXT_PUBLIC_BRAND_NAME=Your Platform" \
  --build-arg "NEXT_PUBLIC_BRAND_MARK=YP" \
  --build-arg "NEXT_PUBLIC_ORY_SDK_URL=https://your-project.projects.oryapis.com" \
  -t kratos-nextjs-sso:latest .

docker run --rm -p 3000:3000 \
  -e ORY_PROJECT_API_TOKEN=ory_pat_... \
  kratos-nextjs-sso:latest
```

Before going live, confirm:

- **Set `NEXT_PUBLIC_APP_URL`** to the exact HTTPS origin users will visit.
- **Set public branding and Ory values** before the image build.
- **Provide `ORY_PROJECT_API_TOKEN` only at runtime** when proxying requires it.
- **Put the app behind an ingress or reverse proxy** that terminates TLS and correctly sets `Host`, `X-Forwarded-Host`, and `X-Forwarded-Proto`.
- **Configure Ory return URLs and allowed origins** for the deployed application URL.
- **Point health checks at `/api/health`.**
- **Run the complete validation suite against staging** before release.

Read [`docs/security.md`](docs/security.md) for the threat model, proxy requirements, browser security headers, provider URL validation, credential protection, and production checklist.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Public landing page |
| `/auth/login` | Login browser flow |
| `/auth/registration` | Registration browser flow |
| `/auth/recovery` | Account recovery browser flow |
| `/auth/verification` | Address verification browser flow |
| `/dashboard/settings` | Protected settings browser flow |
| `/auth/error` | Safe error destination for failed flows |
| `/dashboard` | Protected session dashboard |

## How It Works

- `ory.config.ts` keeps Ory URLs and provider configuration in one place.
- `proxy.ts` proxies Ory self-service endpoints, rewrites redirect URLs, and forwards cookies safely.
- `@ory/nextjs/app` creates and loads browser flows and sessions on the server.
- `components/ory/ory-node.tsx` preserves Ory actions, methods, hidden fields, and CSRF tokens while rendering native controls.
- `components/ory/ory-trigger-runtime.tsx` loads WebAuthn only when needed and never evaluates arbitrary provider-supplied inline JavaScript.
- `/dashboard` checks the server session and redirects unauthenticated users to login.

## Validate Your Fork

**Ship with confidence:**

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:coverage
pnpm build
pnpm test:e2e
```

The automated suite covers Ory flow helpers, security boundaries, localization key parity, health behavior, and the unconfigured smoke experience. Real sign-in, registration, recovery, verification, and settings behavior requires a configured Ory project.

## Keep Exploring

- [Ory cookie-based security model](https://www.ory.com/docs/security-model)
- [Ory Next.js example](https://github.com/ory/kratos-nextjs-react-example)
- [Ory Elements App Router example](https://github.com/ory/elements/tree/main/examples/nextjs-app-router)
- [Next.js proxy convention](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)

Fork the project, make the identity experience fit your product, and open a pull request when you improve the foundation for the next team.

## License

This project is licensed under the [MIT License](LICENSE).
