import { createServer } from "node:http";
import { createSign, generateKeyPairSync, randomUUID } from "node:crypto";

const port = Number(process.env.PORT ?? 4020);
const issuer = `http://127.0.0.1:${port}`;
const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
const publicJwk = publicKey.export({ format: "jwk" });
const tokens = new Map();

function base64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function signIdToken({ email, nonce, subject }) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", kid: "e2e", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      aud: "e2e-client",
      email,
      email_verified: true,
      exp: issuedAt + 300,
      iat: issuedAt,
      iss: issuer,
      nonce,
      sub: subject,
    }),
  );
  const unsigned = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);

  return `${unsigned}.${signer.sign(privateKey, "base64url")}`;
}

function writeJson(response, body, status = 200) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolve) => {
    const chunks = [];

    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", issuer);

  if (url.pathname === "/.well-known/openid-configuration") {
    writeJson(response, {
      issuer,
      authorization_endpoint: `${issuer}/authorize`,
      token_endpoint: `${issuer}/token`,
      userinfo_endpoint: `${issuer}/userinfo`,
      jwks_uri: `${issuer}/jwks.json`,
      response_types_supported: ["code"],
      subject_types_supported: ["public"],
      id_token_signing_alg_values_supported: ["RS256"],
      scopes_supported: ["openid", "email"],
      token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic"],
    });
    return;
  }

  if (url.pathname === "/jwks.json") {
    writeJson(response, { keys: [{ ...publicJwk, alg: "RS256", kid: "e2e", use: "sig" }] });
    return;
  }

  if (url.pathname === "/authorize") {
    const code = `code-${randomUUID()}`;
    const subject = `subject-${code.slice(-12)}`;
    const email = `${subject}@example.com`;
    tokens.set(code, { email, nonce: url.searchParams.get("nonce") ?? undefined, subject });

    const callback = new URL(url.searchParams.get("redirect_uri") ?? issuer);
    callback.searchParams.set("code", code);
    callback.searchParams.set("state", url.searchParams.get("state") ?? "");
    response.writeHead(302, { location: callback.toString() });
    response.end();
    return;
  }

  if (url.pathname === "/token" && request.method === "POST") {
    const form = new URLSearchParams(await readBody(request));
    const code = form.get("code");
    const identity = code ? tokens.get(code) : undefined;

    if (!identity) {
      writeJson(response, { error: "invalid_grant" }, 400);
      return;
    }

    const accessToken = `access-${code}`;
    tokens.set(accessToken, identity);
    writeJson(response, {
      access_token: accessToken,
      expires_in: 300,
      id_token: signIdToken(identity),
      token_type: "Bearer",
    });
    return;
  }

  if (url.pathname === "/userinfo") {
    const authorization = request.headers.authorization ?? "";
    const accessToken = authorization.replace(/^Bearer\s+/i, "");
    const identity = tokens.get(accessToken);

    if (!identity) {
      writeJson(response, { error: "invalid_token" }, 401);
      return;
    }

    writeJson(response, {
      email: identity.email,
      email_verified: true,
      sub: identity.subject,
    });
    return;
  }

  response.writeHead(404);
  response.end();
});

server.listen(port, "127.0.0.1");
