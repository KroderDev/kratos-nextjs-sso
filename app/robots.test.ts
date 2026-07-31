import { describe, expect, it } from "vitest";
import robots from "./robots";

describe("app/robots", () => {
  it("disallows all user agents from crawling the entire site", () => {
    const result = robots();

    expect(result).toEqual({
      rules: { userAgent: "*", disallow: "/" },
    });
  });

  it("targets the wildcard user agent", () => {
    const result = robots();

    expect(result.rules).toMatchObject({ userAgent: "*" });
  });

  it("disallows the root path, blocking every route", () => {
    const result = robots();

    expect(result.rules).toMatchObject({ disallow: "/" });
  });

  it("returns a plain object without a sitemap or host field", () => {
    const result = robots();

    expect(result.sitemap).toBeUndefined();
    expect(result.host).toBeUndefined();
    expect(Object.keys(result)).toEqual(["rules"]);
  });

  it("is deterministic across multiple invocations", () => {
    expect(robots()).toEqual(robots());
  });
});