import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { providerLogoutParams, type LogoutHandoff } from "./provider-handoff";

export const LOGOUT_CONTINUATION_COOKIE = "kratos_logout_handoff";
export const LOGOUT_COMPLETE_PATH = "/logout/complete";
export const LOGOUT_CONTINUATION_TTL_SECONDS = 300;

const MAX_CLOCK_SKEW_SECONDS = 30;
const MAX_COOKIE_LENGTH = 2048;
const MAX_CONSUMED_JTIS = 10_000;
const SIGNING_CONTEXT = "kratos-nextjs-sso:logout-continuation:v1";
const TOKEN_VERSION = 1;

const EPHEMERAL_KEY_SYMBOL = Symbol.for(
  "kratos-nextjs-sso.logout-continuation.ephemeral-key",
);
const CONSUMED_JTIS_SYMBOL = Symbol.for(
  "kratos-nextjs-sso.logout-continuation.consumed-jtis",
);

type SerializedLogoutContinuation = {
  v: 1;
  jti: string;
  t: string;
  c: string;
  r: string;
  iat: number;
  exp: number;
  l?: "en" | "es";
};

export type VerifiedLogoutContinuation = LogoutHandoff & {
  exp: number;
  iat: number;
  jti: string;
};

type GlobalContinuationState = typeof globalThis & {
  [EPHEMERAL_KEY_SYMBOL]?: Buffer;
  [CONSUMED_JTIS_SYMBOL]?: Map<string, number>;
};

function getGlobalState(): GlobalContinuationState {
  return globalThis as GlobalContinuationState;
}

function getConsumedJtis(): Map<string, number> {
  const state = getGlobalState();
  if (!state[CONSUMED_JTIS_SYMBOL]) {
    state[CONSUMED_JTIS_SYMBOL] = new Map<string, number>();
  }
  return state[CONSUMED_JTIS_SYMBOL];
}

function pruneConsumedJtis(consumed: Map<string, number>, nowSeconds: number) {
  for (const [jti, exp] of consumed) {
    if (exp <= nowSeconds) {
      consumed.delete(jti);
    }
  }

  if (consumed.size >= MAX_CONSUMED_JTIS) {
    for (const oldest of consumed.keys()) {
      consumed.delete(oldest);
      break;
    }
  }
}

/**
 * Derives the HMAC-SHA256 signing key for short-lived logout continuation cookies.
 *
 * Uses an optional dedicated server-only secret when configured, otherwise derives a
 * domain-separated key from the existing server-only `ORY_PROJECT_API_TOKEN`, and
 * falls back to a per-process CSPRNG key for single-instance self-hosted deployments.
 */
function getSigningKey(): Buffer {
  const configuredSecret =
    process.env.ORY_LOGOUT_CONTINUATION_SECRET?.trim() ||
    process.env.ORY_PROJECT_API_TOKEN?.trim();

  if (configuredSecret) {
    return createHmac("sha256", configuredSecret)
      .update(SIGNING_CONTEXT)
      .digest();
  }

  const state = getGlobalState();
  if (!state[EPHEMERAL_KEY_SYMBOL]) {
    state[EPHEMERAL_KEY_SYMBOL] = randomBytes(32);
  }
  return state[EPHEMERAL_KEY_SYMBOL];
}

function signPayload(payloadEncoded: string, key: Buffer): string {
  return createHmac("sha256", key)
    .update(`v${TOKEN_VERSION}.${payloadEncoded}`)
    .digest("base64url");
}

function isOpaqueJti(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= 16 &&
    value.length <= 64 &&
    /^[A-Za-z0-9_-]+$/.test(value)
  );
}

/**
 * Creates a tamper-resistant, short-lived continuation token for a validated
 * provider logout handoff.
 *
 * @param handoff - Validated provider logout handoff data
 * @param nowMs - Optional epoch timestamp in milliseconds for deterministic testing
 * @returns A signed continuation token, or `null` if the handoff is invalid
 */
export function createLogoutContinuationToken(
  handoff: LogoutHandoff,
  nowMs = Date.now(),
): string | null {
  const validated = providerLogoutParams({
    flow: "logout",
    transaction: handoff.transaction,
    csrf: handoff.csrf,
    return_to: handoff.providerReturnTo,
    ...(handoff.locale ? { lang: handoff.locale } : {}),
  });

  if (!validated) {
    return null;
  }

  const iat = Math.floor(nowMs / 1000);
  const payload: SerializedLogoutContinuation = {
    v: TOKEN_VERSION,
    jti: randomBytes(16).toString("base64url"),
    t: validated.transaction,
    c: validated.csrf,
    r: validated.providerReturnTo,
    iat,
    exp: iat + LOGOUT_CONTINUATION_TTL_SECONDS,
    ...(validated.locale ? { l: validated.locale } : {}),
  };

  const payloadEncoded = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  const signature = signPayload(payloadEncoded, getSigningKey());
  const token = `${payloadEncoded}.${signature}`;

  return token.length <= MAX_COOKIE_LENGTH ? token : null;
}

/**
 * Verifies a signed logout continuation token against its HMAC signature,
 * lifetime bounds, single-use replay table, and configured provider callback.
 *
 * @param rawToken - The raw cookie value read from the browser request
 * @param options - Optional verification timestamp (`nowMs`)
 * @returns The validated continuation context, or `null` when missing, forged, expired, replayed, or invalid
 */
export function verifyLogoutContinuationToken(
  rawToken: string | undefined,
  options: { nowMs?: number } = {},
): VerifiedLogoutContinuation | null {
  if (
    !rawToken ||
    rawToken.length > MAX_COOKIE_LENGTH ||
    !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(rawToken)
  ) {
    return null;
  }

  const separatorIndex = rawToken.indexOf(".");
  const payloadEncoded = rawToken.slice(0, separatorIndex);
  const providedSignature = rawToken.slice(separatorIndex + 1);
  const expectedSignature = signPayload(payloadEncoded, getSigningKey());
  const providedBuf = Buffer.from(providedSignature, "utf8");
  const expectedBuf = Buffer.from(expectedSignature, "utf8");

  if (
    providedBuf.length !== expectedBuf.length ||
    !timingSafeEqual(providedBuf, expectedBuf)
  ) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(
      Buffer.from(payloadEncoded, "base64url").toString("utf8"),
    );
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) {
    return null;
  }

  const candidate = parsed as Partial<SerializedLogoutContinuation>;
  const nowSeconds = Math.floor((options.nowMs ?? Date.now()) / 1000);

  if (
    candidate.v !== TOKEN_VERSION ||
    !isOpaqueJti(candidate.jti) ||
    typeof candidate.t !== "string" ||
    typeof candidate.c !== "string" ||
    typeof candidate.r !== "string" ||
    typeof candidate.iat !== "number" ||
    typeof candidate.exp !== "number" ||
    !Number.isSafeInteger(candidate.iat) ||
    !Number.isSafeInteger(candidate.exp) ||
    candidate.exp <= candidate.iat ||
    candidate.exp - candidate.iat > LOGOUT_CONTINUATION_TTL_SECONDS ||
    nowSeconds < candidate.iat - MAX_CLOCK_SKEW_SECONDS ||
    nowSeconds >= candidate.exp
  ) {
    return null;
  }

  if (
    candidate.l !== undefined &&
    candidate.l !== "en" &&
    candidate.l !== "es"
  ) {
    return null;
  }

  const validated = providerLogoutParams({
    flow: "logout",
    transaction: candidate.t,
    csrf: candidate.c,
    return_to: candidate.r,
    ...(candidate.l ? { lang: candidate.l } : {}),
  });

  if (!validated) {
    return null;
  }

  if (getConsumedJtis().has(candidate.jti)) {
    return null;
  }

  return {
    ...validated,
    exp: candidate.exp,
    iat: candidate.iat,
    jti: candidate.jti,
  };
}

/**
 * Marks a verified logout continuation as consumed in this server instance's
 * bounded in-memory JTI table.
 *
 * This table provides per-instance, best-effort replay defense alongside
 * immediate `Max-Age=0` cookie clearing on `/logout/complete`; authoritative
 * cross-replica one-time completion is enforced by the trusted login-consent
 * adapter's own browser-bound transaction and CSRF state.
 *
 * @param continuation - The verified continuation context
 * @param nowMs - Optional epoch timestamp in milliseconds
 * @returns `true` if newly consumed on this instance, `false` if already consumed or expired
 */
export function consumeLogoutContinuation(
  continuation: Pick<VerifiedLogoutContinuation, "jti" | "exp">,
  nowMs = Date.now(),
): boolean {
  const nowSeconds = Math.floor(nowMs / 1000);
  if (nowSeconds >= continuation.exp) {
    return false;
  }

  const consumed = getConsumedJtis();
  if (consumed.has(continuation.jti)) {
    return false;
  }

  pruneConsumedJtis(consumed, nowSeconds);
  consumed.set(continuation.jti, continuation.exp);
  return true;
}

/**
 * Determines whether cookies should carry the `Secure` attribute for an origin.
 */
export function isSecureOrigin(origin: string | undefined): boolean {
  if (!origin) {
    return false;
  }

  try {
    return new URL(origin).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Formats the `Set-Cookie` header for the short-lived logout continuation cookie.
 */
export function formatLogoutContinuationCookie(
  token: string,
  secure: boolean,
): string {
  const parts = [
    `${LOGOUT_CONTINUATION_COOKIE}=${token}`,
    `Max-Age=${LOGOUT_CONTINUATION_TTL_SECONDS}`,
    `Path=${LOGOUT_COMPLETE_PATH}`,
    "HttpOnly",
    "SameSite=Lax",
  ];

  if (secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

/**
 * Formats a `Set-Cookie` header that immediately expires the logout continuation cookie.
 */
export function formatClearLogoutContinuationCookie(secure: boolean): string {
  const parts = [
    `${LOGOUT_CONTINUATION_COOKIE}=`,
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    `Path=${LOGOUT_COMPLETE_PATH}`,
    "HttpOnly",
    "SameSite=Lax",
  ];

  if (secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

/**
 * Resets in-memory consumed JTI state (for unit tests only).
 */
export function resetConsumedLogoutContinuationsForTests() {
  getConsumedJtis().clear();
}
