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
});
