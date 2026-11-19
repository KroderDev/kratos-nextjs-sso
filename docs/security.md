# Security

## Threat Model

The application sits at the boundary between the browser and the Ory Identity
API. Every value the Ory API returns—form actions, redirect URLs, link `href`
attributes, image `src` values, and script `src` values—passes through the
application's render path and must be treated as untrusted. The security
hardening follows the principle that **provider-supplied content cannot be
trusted to stay within expected origins or safe schemes**.

## Web Application Firewall (WAF) Requirements

Deploy this application behind a reverse proxy (nginx, Traefik, Cloudflare,
AWS ALB, etc.) that:

- Terminates TLS and sets `X-Forwarded-Proto: https`.
- Sets `Host` and `X-Forwarded-Host` to the configured `NEXT_PUBLIC_APP_URL`
  origin.
- Strips or overwrites any `Host`, `X-Forwarded-Host`, or `X-Forwarded-Proto`
  headers from the client.

Failure to configure the ingress correctly allows host-header injection,
which can bypass the proxy's origin-validation check and change the URLs
embedded in Ory flow redirects.

## Browser Security Headers

All headers are emitted on every route via [`next.config.ts`](../next.config.ts).

### Content Security Policy

```
default-src 'self'
connect-src 'self' <ORY_SDK_ORIGIN>
form-action 'self' <ORY_SDK_ORIGIN> <CONFIGURED_FORM_ACTION_ORIGINS>
script-src 'self' <ORY_SDK_ORIGIN> 'unsafe-inline'
img-src 'self' data: https:
style-src 'self' 'unsafe-inline'
base-uri 'self'
object-src 'none'
frame-ancestors 'none'
```

| Directive | Rationale |
| --- | --- |
| `default-src 'self'` | Lock down all fetches to the application origin by default. |
| `connect-src` | Allow XHR/fetch to the Ory SDK API origin so browser flows can call the identity API directly. |
| `form-action` | Restrict `<form action>` destinations to the app, Ory API, and explicitly configured provider/client origins. This also permits the final OAuth client redirect after a consent POST without allowing arbitrary destinations. |
| `script-src 'unsafe-inline'` | Next.js emits inline `<script>` tags for bootstrap and route preloading. Nonce-based CSP requires framework-level support that is not yet available. The policy scopes script sources to `'self'` and the Ory origin. |
| `img-src https:` | QR codes and OIDC provider logos are hosted on external HTTPS origins. Restricting to specific origins would require an allowlist of every configured OIDC provider. |
| `style-src 'self' 'unsafe-inline'` | Next.js and React components emit dynamic inline styles and style attributes at runtime. The policy scopes style origins to `'self'`. |
| `base-uri 'self'` | Prevents `<base>` tag injection from hijacking relative URL resolution. |
| `object-src 'none'` | Blocks `<object>`, `<embed>`, and `<applet>`. Not used by the application. |
| `frame-ancestors 'none'` | Blocks embedding in iframes. Redundant with `X-Frame-Options: DENY` but supported by modern browsers. |

#### Development CSP Relaxations

In `NODE_ENV=development`, an additional allowance is added:

- `script-src` gains `'unsafe-eval'` — required by React's Fast Refresh and
  development-mode transforms.

This relaxation is **never present in production** (enforced by the
`NODE_ENV` check at build time, not by a runtime environment variable).

### Additional Headers

| Header | Value | Rationale |
| --- | --- | --- |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Emitted only when `NEXT_PUBLIC_APP_URL` uses HTTPS (conditional, build-time). |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Sends the origin in the `Referer` header to cross-origin destinations over HTTPS, strips the referrer on downgrades. |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing. |
| `X-Frame-Options` | `DENY` | Blocks framing in older browsers. |
| `Permissions-Policy` | `camera=(), geolocation=(), microphone=()` | Disables sensitive browser APIs site-wide. |

## Proxy Origin Validation

[`proxy.ts`](../proxy.ts) rejects requests whose effective origin (derived from
trusted `X-Forwarded-Proto` and `X-Forwarded-Host` values, with the request
origin as fallback) does not match `NEXT_PUBLIC_APP_URL`. This prevents:

- Host-header injection attacks that would cause Ory to embed a malicious
  domain in redirect URLs.
- Cache poisoning through mismatched host headers.

The proxy only activates when Ory is configured (`isOryConfigured` is `true`).
In production, a configured Ory deployment without `NEXT_PUBLIC_APP_URL` fails
closed. Requests with a forwarded origin that does not match the configured
application URL receive `400` before any Ory request is made. The matcher also
covers the application flow, dashboard, consent, logout, and error routes so
they receive the same origin check; Ory middleware itself is invoked only for
Ory endpoint paths.

## Provider URL Validation

Ory returns URLs in several node types: form `action` attributes, anchor
`href` attributes, image `src` attributes, and script `src` attributes.
Every URL is validated before being rendered.

The validation is implemented in [`lib/ory/security.ts`](../lib/ory/security.ts)
and enforced in:

- [`components/ory/flow-form.tsx`](../components/ory/flow-form.tsx) —
  validates `<form action>` before rendering the form.
- [`components/ory/ory-node.tsx`](../components/ory/ory-node.tsx) —
  validates `href`, `src` for `<a>`, `<img>`, and `<script>` nodes.

### Allowed Origins

The allowed origin set is built from three configuration values (mapped in
[`ory.config.ts`](../ory.config.ts)):

1. `NEXT_PUBLIC_APP_URL` — the application's public origin.
2. `NEXT_PUBLIC_ORY_SDK_URL` — the Ory Identity API origin.
3. `NEXT_PUBLIC_ORY_CANONICAL_URL` — an optional canonical provider URL.

The CSP `form-action` directive includes the origins in
`NEXT_PUBLIC_ORY_OAUTH_ORIGINS`. Set this build-time variable to the explicit
OAuth provider origins used by the configured providers, separated by commas or
whitespace. Do not use a wildcard origin.

Additional form destinations, including OAuth client origins that receive the
redirect after a consent or provider-mediated logout POST, belong in
`NEXT_PUBLIC_ORY_FORM_ACTION_ORIGINS`. Use exact HTTP or HTTPS origins only;
paths, credentials, and wildcard hosts are rejected.

Only origins with `http:` or `https:` protocol are included. Invalid or
unset URLs are silently excluded from the set.

### Validation Rules

`isSafeProviderUrl()` applies these checks:

- **Rejects** `undefined`, empty strings, and protocol-relative URLs
  (`//attacker.example/`).
- **Rejects** dangerous schemes: `javascript:`, `data:`, `vbscript:`, etc.
- **Rejects** URLs with embedded credentials (`https://user:pass@host/`).
- **Allows** relative URLs (`/self-service/login`), which the browser
  resolves against the page origin.
- **Allows** absolute URLs whose origin matches the configured allowlist.

When a URL fails validation, the component returns `null` and renders
nothing — the form, link, image, or script is silently omitted. This is a
fail-closed design: a malicious URL cannot become a user-visible element.

### Caveats

OIDC social-login buttons rendered by Ory use absolute URLs pointing at the
external identity provider (e.g., `https://accounts.google.com/...`). These
links are **not** validated because the Ory node type is `input` (a submit
button), not `a` (an anchor). The form `action` and the button's click
target are the Ory API, which performs the OIDC redirect server-side. No
validation is needed for the OIDC provider URL embedded in the button value.

## Session Protection

The dashboard page and settings page call `getServerSession()` from
`@ory/nextjs/app` before rendering protected content. The route-group layout at
[`app/(dashboard)/dashboard/layout.tsx`](../app/(dashboard)/dashboard/layout.tsx)
is currently a structural pass-through, not the session boundary.
Unauthenticated requests are redirected to `/login?return_to=/dashboard` or
`/login?return_to=/dashboard/settings` by the respective page.

The session check only runs when Ory is configured (`isOryConfigured` is
`true`). In unconfigured environments (local development without an Ory
project, E2E smoke tests), the dashboard renders without authentication.

The root page checks the session per request when Ory is configured and redirects
users with an identity to the configured default destination (`/dashboard`).
Anonymous and unconfigured requests render the landing page.

### Nested `return_to` URLs

`return_to` is an opaque URL value. When a consent provider includes callback
parameters inside it, the provider must build the outer URL with
`URLSearchParams` (or equivalent standards-compliant URL APIs). For example:

```ts
const callback = new URL("https://provider.example/login/callback");
callback.searchParams.set("csrf", csrf);
callback.searchParams.set("transaction", transaction);
callback.searchParams.set("flow", "login");

const login = new URL("https://app.example/login");
login.searchParams.set("return_to", callback.toString());
```

Do not concatenate the callback URL into the outer query string. Unescaped
ampersands are parsed as outer parameters before Next.js or Kratos can process
the flow, and the original nested query boundaries cannot be recovered safely.

Browser flows disable the SDK's recursive string rewriting. Only known UI URL
fields (`ui.action`, anchor `href`, and image/script `src`) are rewritten to the
application origin. Input values, labels, messages, identity data, and nested
callback values remain unchanged.

### Hydra provider handoffs

The Hydra login-consent provider uses `flow=login` and `flow=consent` to
identify its browser handoff. Ory's Next.js SDK uses the same parameter for a
Kratos flow ID, so [`app/(auth)/login`](../app/(auth)/login/page.tsx) recognizes
only those provider values, validates the provider origin and the fixed
callback path, and starts a fresh Kratos browser flow without forwarding the
provider flow marker as an Ory flow ID. The validation rules are implemented
in [`lib/ory/provider-handoff.ts`](../lib/ory/provider-handoff.ts).

Login carries the opaque transaction and CSRF values inside the provider
callback. Consent carries them through the authenticated internal
[`/consent`](../app/(auth)/consent/page.tsx) route, which submits only to
the provider's fixed `/consent` endpoint.

Provider-mediated browser logout uses a two-step browser flow through
[`/logout`](../app/(auth)/logout/route.ts) and
[`/logout/complete`](../app/(auth)/logout/complete/page.tsx), keeping
standalone Kratos dashboard sign-out separate:

1. The Hydra login-consent adapter initiates `GET /logout?logout_challenge=...`
   on the provider origin, sets its own browser cookie, and redirects the
   browser to `https://sso.example/logout?flow=logout&transaction=...&csrf=...&return_to=https://provider.example/logout`.
2. [`/logout`](../app/(auth)/logout/route.ts) validates `flow=logout`, bounded
   opaque `transaction` and `csrf` values, and `return_to` against
   `oryProviderOrigin` and exact pathname `/logout`. It never forwards the
   provider callback URL to Kratos as a `GET` `return_to` and never logs raw
   handoff parameters.
3. [`/logout`](../app/(auth)/logout/route.ts) calls Kratos `/sessions/whoami`
   directly with `cache: "no-store"`, `redirect: "error"`, and a bounded
   request timeout, distinguishing an active session (`200` active or `403`
   `error.id="session_aal2_required"`), a confirmed Kratos `401` JSON
   `error.id="session_inactive"` response, and upstream/network errors. Empty
   or generic `401` responses fail closed.
   - If a Kratos session is active, it initializes Kratos browser logout with
     `redirect: "error"`, a bounded timeout, and the fixed application return
     URL `https://sso.example/logout/complete` (with no fallback that drops
     `return_to`), validates that Kratos returns the exact `/self-service/logout`
     path with `token` and the exact expected `return_to`, sets a short-lived
     (5-minute), `HttpOnly`, `SameSite=Lax` (`Secure` over HTTPS),
     `Path=/logout/complete`, HMAC-SHA256-signed continuation cookie, and
     responds with `303` plus `Cache-Control: no-store` and
     `Referrer-Policy: no-referrer`.
   - If Kratos `/sessions/whoami` confirms `401` `session_inactive` (already
     signed out), it sets the same continuation cookie and redirects `303`
     directly to `/logout/complete` so handoff credentials are stripped from
     the URL before rendering.
   - If Kratos `/sessions/whoami` or logout-flow creation fails with an
     unexpected error (for example `5xx`, timeout, upstream redirect, non-AAL2
     `403`, empty/generic `401`, or unallowed/mismatched `return_to`), the
     request fails closed to `/error?reason=logout_unavailable` and clears any
     stale continuation cookie.
4. On `GET /logout/complete`, [`proxy.ts`](../proxy.ts) clears the continuation
   cookie (`Max-Age=0`) and sets `Cache-Control: no-store`, `Pragma: no-cache`,
   and `Referrer-Policy: strict-origin`. The route verifies the HMAC signature,
   expiry, provider callback origin/path, per-instance `jti` replay state, and
   real Kratos `/sessions/whoami` confirmation (`401` `session_inactive` or
   inactive session) that no active session remains. Only then does it render a
   native browser POST form (with `Referrer-Policy: strict-origin`, automatic
   single-submit, bfcache replay protection, and manual button fallback)
   targeting the validated provider `/logout` endpoint with `transaction` and
   `csrf` form fields so the browser sends the configured external UI `Origin`
   and the adapter's browser cookie.

   Note: The UI's in-memory `jti` consumption table is **per-instance and
   best-effort** defense-in-depth alongside immediate cookie clearing and
   client-side single-submit/bfcache guards; **authoritative cross-replica
   one-time completion** is enforced by the trusted login-consent adapter's
   own browser-bound transaction and CSRF state.

#### Kratos Allowlist and Continuation Signing Requirements

- **Kratos `selfservice.allowed_return_urls`**: Add the exact fixed completion
  URL for your deployed application origin, for example:

  ```yaml
  selfservice:
    allowed_return_urls:
      - https://sso.example/logout/complete
  ```

  Do not add arbitrary relying-party URLs to this application; the Hydra
  login-consent adapter remains the sole authority that redirects to the
  relying party's `post_logout_redirect_uri`.
- **Continuation signing key**: The continuation cookie is signed with a
  domain-separated HMAC-SHA256 key derived from optional server-only
  `ORY_LOGOUT_CONTINUATION_SECRET`, falling back to existing server-only
  `ORY_PROJECT_API_TOKEN`, or a per-process CSPRNG key for single-instance
  self-hosted deployments. For multi-replica self-hosted deployments without
  `ORY_PROJECT_API_TOKEN`, set `ORY_LOGOUT_CONTINUATION_SECRET` as a shared
  server-only runtime secret.

The provider origin is derived from
`NEXT_PUBLIC_ORY_CANONICAL_URL`, falling back to `NEXT_PUBLIC_ORY_SDK_URL` when
the canonical URL is unset. It must be HTTP(S) without credentials; an invalid
explicit canonical URL rejects handoffs instead of falling back to an internal
SDK endpoint. SDK requests continue to use the SDK URL. Restored provider
callbacks retain the public provider origin through proxy response processing.
An untrusted `return_to`, callback path,
transaction, or CSRF value rejects the handoff instead of becoming a redirect
or form target.

### OIDC login context hints

The login route accepts the OIDC `login_hint`, `ui_locales`, and `display`
parameters when supplied by a login-consent provider (for example, the related
[login context change](https://github.com/KroderDev/hydra-kratos-login-consent/pull/82)).
Each hint must be a single bounded value; malformed, duplicated, unsupported,
or overlong values are ignored. `login_hint` is limited to 256 UTF-8 bytes and
rejects control and Unicode format characters. It is used only to prefill an
empty Kratos identifier input and never overrides an identifier already
present in the Kratos flow. It is removed before flow parameters are sent to
the Ory SDK and is not copied into `return_to` or provider callbacks, cookies,
browser storage, logs, or unrelated flows.

`ui_locales` is an ordered preference list for the current login page only;
explicit `lang` wins, and supported English/Spanish tags are mapped to the
application locale. Locale hints are not persisted. The recognized `display`
values (`page`, `popup`, `touch`, and `wap`) are advisory and currently ignored,
so login continues in the standard page presentation without changing
authentication, MFA, or callback behavior.

## Multi-Factor Authentication

Kratos owns TOTP and backup recovery-code validation. The UI only renders the
flow nodes and submits the selected method; it never verifies, stores, or
logs TOTP secrets or recovery codes. Login method buttons bypass native browser
validation because Kratos can render multiple required MFA methods in one form
(for example TOTP and lookup-secret recovery); the selected method is still
validated server-side by Kratos.

The settings flow supports TOTP enrollment and unlinking, backup-code
generation, confirmation, regeneration, disablement, and redacted display of
used codes. Recovery codes are displayed only in the flow response that
generated them and should be stored by the user in a secure location.

The real authentication E2E suite validates password-login TOTP challenges,
invalid TOTP codes, backup-code login, reused-code rejection, and TOTP
disablement. Keep the Kratos `totp` issuer, `lookup_secret` method, and
Authenticator Assurance Level policy aligned between the test fixture and
production configuration.

## Ory Inline JavaScript Boundaries

Ory self-service flows sometimes include inline `onclick` and `onload`
JavaScript via `onclickTrigger` and `onloadTrigger` node attributes. The
application **never evaluates** this inline JavaScript.

- WebAuthn/passkey triggers are invoked through an allowlist of supported
  trigger names in
  [`components/ory/ory-trigger-runtime.tsx`](../components/ory/ory-trigger-runtime.tsx).
- The WebAuthn runtime script is loaded from
  `/.well-known/ory/webauthn.js` only when the flow contains nodes whose
  trigger attributes match the allowlist.
- Arbitrary `onclick`/`onload` JavaScript strings in Ory node attributes are
  ignored.

## Credential Protection

- `ORY_PROJECT_API_TOKEN` is a **server-only** runtime environment variable.
  It is never prefixed with `NEXT_PUBLIC_*`, never passed as a Docker build
  argument, and never included in client bundles.
- The Playwright E2E suite verifies that the token and the `ory_pat_` prefix
  do not appear in the rendered HTML.

## Health Semantics

`/api/health` is a process liveness endpoint. It returns `200` when the Next.js
server can handle a request and does not call Ory or validate the provider
configuration. Use a separate dependency/readiness probe when deployment
orchestration must remove instances whose Ory provider is unavailable.

## Dependency Security

[`pnpm-workspace.yaml`](../pnpm-workspace.yaml) pins vulnerable transitive
dependencies through pnpm overrides:

```yaml
overrides:
  "brace-expansion@^1.0.0": 1.1.17
  postcss: 8.5.25
  sharp: 0.35.3
minimumReleaseAgeExclude:
  - brace-expansion@1.1.17
  - postcss@8.5.25
```

`minimumReleaseAgeExclude` allows these specific versions despite being
newer than pnpm's default minimum release age.

Run `pnpm audit --prod --audit-level=high` to verify that the production
dependency tree has no known vulnerabilities. One development-only ESLint
dependency advisory remains; it has no production impact.

## Testing

The security properties are verified by two test suites:

### Unit Tests — `lib/ory/security.test.ts`

Covers `isSafeProviderUrl()` and `isSafeFlowAction()`:

- Relative URLs and configured origins pass.
- `javascript:`, `data:`, protocol-relative, and credential-embedded URLs
  are rejected.
- Unapproved absolute form actions are rejected.

Run with:

```bash
pnpm exec vitest run lib/ory/security.test.ts
```

### E2E Tests — `tests/security.spec.ts`

Three Playwright tests:

1. **Security headers** — verifies CSP directives (`frame-ancestors 'none'`,
   no `unsafe-eval` in production), `Referrer-Policy`, `X-Content-Type-Options`,
   and `X-Frame-Options`.
2. **Credential leak** — verifies that `ORY_PROJECT_API_TOKEN` and `ory_pat_`
   do not appear in the rendered page.
3. **External `return_to` rejection** — navigates to
   `/dashboard?return_to=https://attacker.example/` and verifies the browser
   stays on the application origin.

Run with:

```bash
pnpm test:e2e
```

## Production Deployment Checklist

- [ ] `NEXT_PUBLIC_APP_URL` is set to the exact HTTPS origin.
- [ ] `NEXT_PUBLIC_ORY_FORM_ACTION_ORIGINS` contains every exact OAuth client origin that receives form redirects (including post-consent and post-logout redirects).
- [ ] Kratos `selfservice.allowed_return_urls` includes `<NEXT_PUBLIC_APP_URL>/logout/complete` when provider-mediated logout is enabled.
- [ ] Ingress validates and sets `Host`, `X-Forwarded-Host`, and
  `X-Forwarded-Proto`.
- [ ] Ingress terminates TLS and redirects HTTP to HTTPS.
- [ ] `ORY_PROJECT_API_TOKEN` (and optional `ORY_LOGOUT_CONTINUATION_SECRET` for multi-replica deployments without an API token) is set only at runtime (not as a build arg).
- [ ] `pnpm audit --prod --audit-level=high` reports zero vulnerabilities.
- [ ] All E2E tests pass against the staging environment.
