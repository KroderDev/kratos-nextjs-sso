import { describe, expect, it } from "vitest";

import { getAuthPreviewFooterPlan } from "./auth-preview-footer";

describe("getAuthPreviewFooterPlan", () => {
  const baseOptions = {
    kind: "login" as const,
    passwordAvailable: true,
    registrationEnabled: true,
    isEmailSentStatus: false,
  };

  it("matches the password login footer with registration and recovery links", () => {
    expect(getAuthPreviewFooterPlan(baseOptions)).toEqual({
      introKey: "auth.login.footer.needIdentity",
      links: [
        {
          href: "/registration",
          labelKey: "auth.login.footer.createOne",
        },
        {
          href: "/recovery",
          labelKey: "auth.login.footer.recoverAccess",
          separatorBefore: true,
        },
      ],
    });
  });

  it("matches social-only login by offering account creation without recovery", () => {
    expect(
      getAuthPreviewFooterPlan({ ...baseOptions, passwordAvailable: false }),
    ).toEqual({
      introKey: "auth.login.footer.needIdentity",
      links: [
        {
          href: "/registration",
          labelKey: "auth.login.footer.createOne",
        },
      ],
    });
  });

  it("offers only recovery when registration is disabled", () => {
    expect(
      getAuthPreviewFooterPlan({ ...baseOptions, registrationEnabled: false }),
    ).toEqual({
      links: [
        {
          href: "/recovery",
          labelKey: "auth.login.footer.recoverAccess",
        },
      ],
    });
  });

  it("omits the footer when social login has no follow-up options", () => {
    expect(
      getAuthPreviewFooterPlan({
        ...baseOptions,
        passwordAvailable: false,
        registrationEnabled: false,
      }),
    ).toBeNull();
  });

  it.each([
    {
      kind: "registration" as const,
      introKey: "auth.registration.footer.alreadyAccess",
      labelKey: "auth.registration.footer.signIn",
    },
    {
      kind: "recovery" as const,
      introKey: "auth.recovery.footer.rememberedDetails",
      labelKey: "auth.recovery.footer.returnSignIn",
    },
    {
      kind: "verification" as const,
      introKey: "auth.verification.footer.needStartOver",
      labelKey: "auth.verification.footer.returnSignIn",
    },
  ])("matches the $kind cross-flow navigation", ({ kind, introKey, labelKey }) => {
    expect(
      getAuthPreviewFooterPlan({ ...baseOptions, kind }),
    ).toEqual({
      introKey,
      links: [{ href: "/login", labelKey }],
    });
  });

  it.each(["recovery", "verification"] as const)(
    "omits the cross-flow footer for sent-email %s confirmation",
    (kind) => {
      expect(
        getAuthPreviewFooterPlan({ ...baseOptions, kind, isEmailSentStatus: true }),
      ).toBeNull();
    },
  );
});
