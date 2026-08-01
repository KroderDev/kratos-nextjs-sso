import { describe, expect, it } from "vitest";

import { getForwardedOrigin, validateForwardedOrigin } from "./request";

describe("forwarded request origin", () => {
  it("uses the public HTTPS origin supplied by the ingress", () => {
    expect(
      getForwardedOrigin(
        new Headers({
          host: "nextjs:3000",
          "x-forwarded-host": "auth.mida.com.ec",
          "x-forwarded-proto": "https",
        }),
        "http://nextjs:3000",
      ),
    ).toBe("https://auth.mida.com.ec");
  });

  it("uses the first value from comma-separated proxy headers", () => {
    expect(
      getForwardedOrigin(
        new Headers({
          "x-forwarded-host": "auth.example.com, proxy.internal",
          "x-forwarded-proto": "https, http",
        }),
        "http://nextjs:3000",
      ),
    ).toBe("https://auth.example.com");
  });

  it("falls back when forwarded origin data is absent or invalid", () => {
    expect(getForwardedOrigin(new Headers(), "http://localhost:3000")).toBe(
      "http://localhost:3000",
    );
    expect(
      getForwardedOrigin(
        new Headers({
          "x-forwarded-host": "attacker.example",
          "x-forwarded-proto": "javascript",
        }),
        "http://localhost:3000",
      ),
    ).toBe("http://localhost:3000");
  });

  it("falls back when only the protocol header is present", () => {
    expect(
      getForwardedOrigin(
        new Headers({ "x-forwarded-proto": "https" }),
        "http://localhost:3000",
      ),
    ).toBe("http://localhost:3000");
  });

  it("falls back when only the host header is present", () => {
    expect(
      getForwardedOrigin(
        new Headers({ "x-forwarded-host": "auth.example.com" }),
        "http://localhost:3000",
      ),
    ).toBe("http://localhost:3000");
  });

  it("is case-sensitive about the forwarded protocol", () => {
    expect(
      getForwardedOrigin(
        new Headers({
          "x-forwarded-host": "auth.example.com",
          "x-forwarded-proto": "HTTPS",
        }),
        "http://localhost:3000",
      ),
    ).toBe("http://localhost:3000");
  });

  it("falls back when the forwarded host cannot form a valid URL", () => {
    expect(
      getForwardedOrigin(
        new Headers({
          "x-forwarded-host": "not a valid host!",
          "x-forwarded-proto": "https",
        }),
        "http://localhost:3000",
      ),
    ).toBe("http://localhost:3000");
  });

  it("trims whitespace around comma-separated header values", () => {
    expect(
      getForwardedOrigin(
        new Headers({
          "x-forwarded-host": "  auth.example.com  , proxy.internal",
          "x-forwarded-proto": "  https  , http",
        }),
        "http://localhost:3000",
      ),
    ).toBe("https://auth.example.com");
  });

  it("treats an empty forwarded header value as absent", () => {
    expect(
      getForwardedOrigin(
        new Headers({
          "x-forwarded-host": "",
          "x-forwarded-proto": "https",
        }),
        "http://localhost:3000",
      ),
    ).toBe("http://localhost:3000");
  });

  it("accepts http as a valid forwarded protocol", () => {
    expect(
      getForwardedOrigin(
        new Headers({
          "x-forwarded-host": "internal.example.com:8080",
          "x-forwarded-proto": "http",
        }),
        "https://localhost:3000",
      ),
    ).toBe("http://internal.example.com:8080");
  });
});

describe("forwarded origin validation", () => {
  it("accepts a forwarded origin that matches the configured app base URL", () => {
    expect(
      validateForwardedOrigin(
        "https://auth.example.com",
        "https://auth.example.com",
      ),
    ).toBe(true);
  });

  it("accepts a forwarded origin that matches the app base URL origin (ignoring path)", () => {
    expect(
      validateForwardedOrigin(
        "https://auth.example.com",
        "https://auth.example.com/some/path",
      ),
    ).toBe(true);
  });

  it("rejects a forwarded origin that does not match the configured app base URL", () => {
    expect(
      validateForwardedOrigin(
        "https://attacker.example",
        "https://auth.example.com",
      ),
    ).toBe(false);
  });

  it("rejects a forwarded origin with a different protocol", () => {
    expect(
      validateForwardedOrigin(
        "http://auth.example.com",
        "https://auth.example.com",
      ),
    ).toBe(false);
  });

  it("rejects a forwarded origin with a different port", () => {
    expect(
      validateForwardedOrigin(
        "https://auth.example.com:8080",
        "https://auth.example.com",
      ),
    ).toBe(false);
  });

  it("accepts any forwarded origin when no app base URL is configured", () => {
    expect(
      validateForwardedOrigin("https://anything.example", undefined),
    ).toBe(true);
  });

  it("rejects validation when the app base URL is malformed", () => {
    expect(
      validateForwardedOrigin(
        "https://auth.example.com",
        "not a valid url",
      ),
    ).toBe(false);
  });

  it("validates against spoofed X-Forwarded-Host header when compared to app base URL", () => {
    const spoofedOrigin = getForwardedOrigin(
      new Headers({
        "x-forwarded-host": "attacker.example",
        "x-forwarded-proto": "https",
      }),
      "http://localhost:3000",
    );

    expect(
      validateForwardedOrigin(spoofedOrigin, "https://auth.example.com"),
    ).toBe(false);
  });
});
