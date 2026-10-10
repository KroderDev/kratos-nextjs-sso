export type AuthPreviewFooterLink = {
  href: string;
  labelKey: string;
  separatorBefore?: boolean;
};

export type AuthPreviewFooterPlan = {
  introKey?: string;
  links: AuthPreviewFooterLink[];
};

export function getAuthPreviewFooterPlan({
  kind,
  passwordAvailable,
  registrationEnabled,
  isEmailSentStatus,
}: {
  kind: "login" | "registration" | "recovery" | "verification";
  passwordAvailable: boolean;
  registrationEnabled: boolean;
  isEmailSentStatus: boolean;
}): AuthPreviewFooterPlan | null {
  if (isEmailSentStatus) {
    return null;
  }

  if (kind === "login") {
    const links: AuthPreviewFooterLink[] = [];

    if (registrationEnabled) {
      links.push({
        href: "/registration",
        labelKey: "auth.login.footer.createOne",
      });
    }

    if (passwordAvailable) {
      links.push({
        href: "/recovery",
        labelKey: "auth.login.footer.recoverAccess",
        ...(registrationEnabled ? { separatorBefore: true } : {}),
      });
    }

    if (links.length === 0) {
      return null;
    }

    return {
      introKey: registrationEnabled ? "auth.login.footer.needIdentity" : undefined,
      links,
    };
  }

  if (kind === "registration") {
    return {
      introKey: "auth.registration.footer.alreadyAccess",
      links: [{
        href: "/login",
        labelKey: "auth.registration.footer.signIn",
      }],
    };
  }

  if (kind === "recovery") {
    return {
      introKey: "auth.recovery.footer.rememberedDetails",
      links: [{
        href: "/login",
        labelKey: "auth.recovery.footer.returnSignIn",
      }],
    };
  }

  return {
    introKey: "auth.verification.footer.needStartOver",
    links: [{
      href: "/login",
      labelKey: "auth.verification.footer.returnSignIn",
    }],
  };
}
