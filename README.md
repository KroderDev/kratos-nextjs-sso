# kratos-nextjs-sso

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen?style=flat-square)](https://kratos-nextjs-sso.vercel.app)
[![CI](https://img.shields.io/github/actions/workflow/status/KroderDev/kratos-nextjs-sso/ci.yml?branch=master&label=CI&style=flat-square)](https://github.com/KroderDev/kratos-nextjs-sso/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.12-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0.3-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/node-24-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-11.17.0-F69220?style=flat-square&logo=pnpm&logoColor=white)](https://pnpm.io)

Production-ready Next.js App Router identity and SSO frontend for Ory Kratos and Ory Network, built with React 19, Tailwind CSS, and shadcn/ui Base UI components.

## Demo

See the live demo [here](https://kratos-nextjs-sso.vercel.app). It runs against a real Ory Network project and includes the full login, registration, recovery, verification, and settings flows.

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
NEXT_PUBLIC_BRAND_MARK=YP
NEXT_PUBLIC_BRAND_LOGO_LIGHT=/next.svg
NEXT_PUBLIC_BRAND_LOGO_DARK=/next-dark.svg
```

These public values are embedded during `next build`. Set them before building a Docker image or deploying the application. `NEXT_PUBLIC_BRAND_MARK` sets the 1-2 character text mark/initials (e.g. displayed in footers or text fallbacks) up to two characters and falls back to initials derived from `NEXT_PUBLIC_BRAND_NAME`. Set `NEXT_PUBLIC_BRAND_LOGO_LIGHT` and optionally `NEXT_PUBLIC_BRAND_LOGO_DARK` to paths under `public/`. Logo images are displayed whenever present and are not replaced by setting `NEXT_PUBLIC_BRAND_MARK`. The bundled dark logo is used when the dark path is omitted; set it to an empty value to explicitly fall back to the light logo. The bundled Next.js symbols are sourced from the [Geist brand guidelines](https://vercel.com/geist/brands).

The interface uses shadcn/ui components with Tailwind CSS semantic tokens. Customize the theme through the existing `components.json` preset and the shadcn CLI, or replace the app icon at `app/favicon.ico` with the platform's production asset.

### Applying a shadcn Theme

Use the [shadcn theme builder](https://ui.shadcn.com/create) to create or select a preset. The builder provides a preset ID that can be applied from the project root:

```bash
pnpm dlx shadcn@latest apply --preset b0 --only theme
```

Replace `b0` with the preset ID from the builder. The command updates the theme tokens in `app/globals.css`; it may also update `components.json` when the preset includes configuration changes. Commit or stash existing work before applying a preset so the generated changes can be reviewed and reverted safely.

Apply only the font portion when the color theme should remain unchanged:

```bash
pnpm dlx shadcn@latest apply --preset b0 --only font
```

The font preset can update `app/layout.tsx` and `app/globals.css`. The application body uses the shared `--font-sans` token, so imported shadcn fonts are applied across the UI without changing individual components.

After applying a preset, inspect the diff and run the validation suite:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
```

### Docker

```bash
docker build \
  --build-arg "NEXT_PUBLIC_APP_URL=http://localhost:3000" \
  --build-arg "NEXT_PUBLIC_BRAND_NAME=Your Platform" \
  --build-arg "NEXT_PUBLIC_BRAND_MARK=YP" \
  --build-arg "NEXT_PUBLIC_ORY_SDK_URL=" \
  -t kratos-nextjs-sso:latest .

docker run --rm -p 3000:3000 kratos-nextjs-sso:latest
```

With Ory configured:

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

The image runs as a non-root `nextjs` user and includes a health check at `/api/health`.

Create `.env.local` from `.env.example` and set the Ory values before using a real browser flow:

```env
NEXT_PUBLIC_BRAND_NAME=Your Platform
NEXT_PUBLIC_BRAND_MARK=YP
NEXT_PUBLIC_BRAND_LOGO_LIGHT=/next.svg
NEXT_PUBLIC_BRAND_LOGO_DARK=/next-dark.svg
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
| `/dashboard/settings` | Protected settings browser flow |
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
pnpm test:e2e
```

The tests cover the pure Ory node helpers. Real sign-in, registration, recovery, verification, and settings behavior requires a configured Ory project and credentials.

## License

This project is licensed under the [MIT License](LICENSE).

## References

- [Ory browser flows](https://www.ory.com/docs/security-model)
- [Ory Next.js example](https://github.com/ory/kratos-nextjs-react-example)
- [Ory Elements App Router example](https://github.com/ory/elements/tree/main/examples/nextjs-app-router)
- [Next.js proxy convention](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
