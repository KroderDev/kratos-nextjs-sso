import { describe, expect, it } from "vitest";
import type { Identity } from "@ory/client-fetch";

import {
  getIdentityAvatarUrl,
  getIdentityEmail,
  getIdentityInitials,
  getIdentityName,
} from "./identity";

function identity(traits: unknown, metadata_public?: unknown) {
  return { traits, metadata_public } as Identity;
}

describe("identity helpers", () => {
  it("reads trimmed email and username traits", () => {
    expect(getIdentityEmail(identity({ email: "  person@example.com " }))).toBe(
      "person@example.com",
    );
    expect(getIdentityEmail(identity({ username: " member " }))).toBe("member");
  });

  it("falls back safely when email traits are absent or non-string", () => {
    expect(getIdentityEmail(identity({ email: 42 }))).toBe("Identity member");
    expect(getIdentityEmail(identity(null))).toBe("Identity member");
  });

  it("prefers structured names and falls back to display identity", () => {
    expect(
      getIdentityName(identity({ name: { first: "Ada", last: "Lovelace" } })),
    ).toBe("Ada Lovelace");
    expect(getIdentityName(identity({ name: "Ada" }))).toBe("Ada");
    expect(getIdentityName(identity({ display_name: "The Analyst" }))).toBe(
      "The Analyst",
    );
  });

  it("reads avatar URLs from public metadata instead of traits", () => {
    expect(
      getIdentityAvatarUrl(
        identity({ avatar_url: "https://example.com/trait-avatar.png" }),
      ),
    ).toBeUndefined();
    expect(
      getIdentityAvatarUrl(
        identity({}, { avatar_url: "  https://example.com/avatar.png  " }),
      ),
    ).toBe("https://example.com/avatar.png");
  });

  it("ignores unsafe or malformed public avatar URLs", () => {
    expect(getIdentityAvatarUrl(identity({}, { avatar_url: "javascript:alert(1)" }))).toBeUndefined();
    expect(getIdentityAvatarUrl(identity({}, { avatar_url: "not a URL" }))).toBeUndefined();
    expect(getIdentityAvatarUrl(identity({}, { avatar_url: 42 }))).toBeUndefined();
  });

  it("creates up to two uppercase initials", () => {
    expect(
      getIdentityInitials(
        identity({ name: { first: "Ada", last: "Lovelace" } }),
      ),
    ).toBe("AL");
    expect(getIdentityInitials(identity({ email: "person@example.com" }))).toBe(
      "P",
    );
    expect(getIdentityInitials(identity({}))).toBe("IM");
  });
});
