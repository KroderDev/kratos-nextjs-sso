import { describe, expect, it } from "vitest";

import { getForwardedOrigin } from "./request";

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
