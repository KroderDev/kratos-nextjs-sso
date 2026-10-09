import type { UiNode, UiText } from "@ory/client-fetch";

import type { OryFlow } from "@/lib/ory/types";

function inputNode(
  group: string,
  name: string,
  type: string,
  label: string,
  options: Record<string, unknown> = {},
): UiNode {
  return {
    type: "input",
    group,
    messages: [],
    meta: {},
    attributes: {
      node_type: "input",
      id: name,
      name,
      type,
      label: { id: 1, text: label, type: "info" },
      ...options,
    },
  } as unknown as UiNode;
}

function csrfNode(): UiNode {
  return inputNode("default", "csrf_token", "hidden", "", {
    value: "preview-csrf-token",
  });
}

function providerNode(provider: string): UiNode {
  const name = provider.toLowerCase();
  return inputNode("oidc", "provider", "submit", `Continue with ${provider}`, {
    value: `${name}-provider`,
  });
}

function credentialsNodes(): UiNode[] {
  return [
    inputNode("password", "identifier", "email", "Email address", {
      autocomplete: "username",
      placeholder: "you@example.com",
      required: true,
    }),
    inputNode("password", "password", "password", "Password", {
      autocomplete: "current-password",
      required: true,
    }),
    inputNode("password", "method", "submit", "Sign in", {
      value: "password",
    }),
  ];
}

function registrationNodes(): UiNode[] {
  return [
    inputNode("password", "traits.name.first", "text", "First name", {
      autocomplete: "given-name",
      required: true,
    }),
    inputNode("password", "traits.name.last", "text", "Last name", {
      autocomplete: "family-name",
      required: true,
    }),
    inputNode("password", "traits.email", "email", "Email address", {
      autocomplete: "email",
      placeholder: "you@example.com",
      required: true,
    }),
    inputNode("password", "password", "password", "Password", {
      autocomplete: "new-password",
      required: true,
    }),
    inputNode("password", "method", "submit", "Create account", {
      value: "password",
    }),
  ];
}

function recoveryNodes(): UiNode[] {
  return [
    inputNode("code", "email", "email", "Email address", {
      autocomplete: "email",
      placeholder: "you@example.com",
      required: true,
    }),
    inputNode("code", "method", "submit", "Send recovery link", {
      value: "link",
    }),
  ];
}

function recoveryCodeRequestNodes(): UiNode[] {
  return [
    inputNode("code", "email", "email", "Email address", {
      autocomplete: "email",
      placeholder: "you@example.com",
      required: true,
    }),
    inputNode("code", "method", "submit", "Send recovery code", {
      value: "code",
    }),
  ];
}

function verificationNodes(): UiNode[] {
  return [
    inputNode("code", "email", "email", "Email address", {
      autocomplete: "email",
      placeholder: "you@example.com",
      required: true,
    }),
    inputNode("code", "method", "submit", "Send verification link", {
      value: "link",
    }),
  ];
}

function emailCodeRequestNodes(): UiNode[] {
  return [
    inputNode("code", "identifier", "email", "Email address", {
      autocomplete: "username",
      placeholder: "you@example.com",
      required: true,
    }),
    inputNode("code", "method", "submit", "Sign in", {
      value: "code",
    }),
  ];
}

function codeChallengeNodes(label: string, method: string): UiNode[] {
  return [
    inputNode("code", "code", "text", label, {
      autocomplete: "one-time-code",
      maxlength: 6,
      pattern: "[0-9]{6}",
      placeholder: "000000",
      required: true,
    }),
    inputNode("code", "method", "submit", "Continue", {
      value: method,
    }),
  ];
}

function backupCodeLoginNodes(): UiNode[] {
  return [
    inputNode("lookup_secret", "lookup_secret", "text", "Recovery code", {
      autocomplete: "one-time-code",
      maxlength: 32,
      required: true,
      spellcheck: false,
    }),
    inputNode("lookup_secret", "method", "submit", "Sign in", {
      value: "lookup_secret",
    }),
  ];
}

function previewFlow(id: string, nodes: UiNode[], messages: UiText[] = []): OryFlow {
  return {
    id,
    ui: {
      action: "/dev/ui-preview",
      method: "POST",
      messages,
      nodes: [csrfNode(), ...nodes],
    },
  } as unknown as OryFlow;
}

const manySocialProviders = [
  "Apple",
  "Discord",
  "GitHub",
  "GitLab",
  "Google",
  "LinkedIn",
  "Microsoft",
  "Slack",
  "X",
];

export const PREVIEW_AUTH_SCENARIOS = [
  {
    id: "password-three-providers",
    labelKey: "devPreview.passwordThreeProviders",
    kind: "login",
    eyebrowKey: "auth.login.eyebrow",
    titleKey: "auth.login.title",
    descriptionKey: "auth.login.description",
    flow: previewFlow("preview-password-three-providers", [
      ...credentialsNodes(),
      providerNode("Google"),
      providerNode("GitHub"),
      providerNode("Apple"),
    ]),
  },
  {
    id: "social-only",
    labelKey: "devPreview.socialOnly",
    kind: "login",
    eyebrowKey: "auth.login.eyebrow",
    titleKey: "auth.login.title",
    descriptionKey: "auth.login.descriptionSocialOnly",
    flow: previewFlow("preview-social-only", [
      providerNode("Google"),
      providerNode("GitHub"),
      providerNode("Apple"),
    ]),
  },
  {
    id: "password-two-providers",
    labelKey: "devPreview.passwordTwoProviders",
    kind: "login",
    eyebrowKey: "auth.login.eyebrow",
    titleKey: "auth.login.title",
    descriptionKey: "auth.login.description",
    flow: previewFlow("preview-password-two-providers", [
      ...credentialsNodes(),
      providerNode("Google"),
      providerNode("GitHub"),
    ]),
  },
  {
    id: "password-many-providers",
    labelKey: "devPreview.passwordManyProviders",
    kind: "login",
    eyebrowKey: "auth.login.eyebrow",
    titleKey: "auth.login.title",
    descriptionKey: "auth.login.description",
    flow: previewFlow("preview-password-many-providers", [
      ...credentialsNodes(),
      ...manySocialProviders.map(providerNode),
    ]),
  },
  {
    id: "totp",
    labelKey: "devPreview.totp",
    kind: "login",
    eyebrowKey: "auth.login.eyebrow",
    titleKey: "auth.login.titleAal2",
    descriptionKey: "auth.login.descriptionAal2",
    flow: previewFlow("preview-totp", [
      inputNode("totp", "totp_code", "text", "Authentication code", {
        autocomplete: "one-time-code",
        maxlength: 6,
        pattern: "[0-9]{6}",
        placeholder: "000000",
        required: true,
      }),
      inputNode("totp", "method", "submit", "Continue", { value: "totp" }),
    ], [
      {
        id: 1,
        text: "Please complete the second authentication challenge.",
        type: "info",
      },
    ]),
  },
  {
    id: "email-code-request",
    labelKey: "devPreview.emailCodeRequest",
    kind: "login",
    eyebrowKey: "auth.login.eyebrow",
    titleKey: "auth.login.title",
    descriptionKey: "devPreview.emailCodeDescription",
    flow: previewFlow("preview-email-code-request", emailCodeRequestNodes()),
  },
  {
    id: "email-code-challenge",
    labelKey: "devPreview.emailCodeChallenge",
    kind: "login",
    eyebrowKey: "auth.login.eyebrow",
    titleKey: "auth.login.title",
    descriptionKey: "devPreview.emailCodeDescription",
    flow: previewFlow(
      "preview-email-code-challenge",
      codeChallengeNodes("Verification code", "code"),
      [
        {
          id: 4,
          text: "An email containing a verification code has been sent to the email address you provided.",
          type: "info",
        },
      ],
    ),
  },
  {
    id: "backup-code-login",
    labelKey: "devPreview.backupCodeLogin",
    kind: "login",
    eyebrowKey: "auth.login.eyebrow",
    titleKey: "auth.login.titleAal2",
    descriptionKey: "devPreview.backupCodeDescription",
    flow: previewFlow("preview-backup-code-login", backupCodeLoginNodes()),
  },
  {
    id: "forgot-password",
    labelKey: "devPreview.forgotPassword",
    kind: "recovery",
    eyebrowKey: "auth.recovery.eyebrow",
    titleKey: "auth.recovery.title",
    descriptionKey: "auth.recovery.description",
    flow: previewFlow("preview-forgot-password", recoveryNodes()),
  },
  {
    id: "recovery-success",
    labelKey: "devPreview.recoverySuccess",
    kind: "recovery",
    eyebrowKey: "auth.recovery.eyebrow",
    titleKey: "auth.recovery.title",
    descriptionKey: "auth.recovery.description",
    flow: previewFlow("preview-recovery-success", [], [
      {
        id: 2,
        text: "An email containing a recovery link has been sent to the email address you provided.",
        type: "info",
      },
    ]),
  },
  {
    id: "recovery-code-request",
    labelKey: "devPreview.recoveryCodeRequest",
    kind: "recovery",
    eyebrowKey: "auth.recovery.eyebrow",
    titleKey: "auth.recovery.title",
    descriptionKey: "auth.recovery.description",
    flow: previewFlow("preview-recovery-code-request", recoveryCodeRequestNodes()),
  },
  {
    id: "recovery-code",
    labelKey: "devPreview.recoveryCode",
    kind: "recovery",
    eyebrowKey: "auth.recovery.eyebrow",
    titleKey: "auth.recovery.title",
    descriptionKey: "auth.recovery.description",
    flow: previewFlow(
      "preview-recovery-code",
      codeChallengeNodes("Recovery code", "code"),
      [
        {
          id: 5,
          text: "An email containing a recovery code has been sent to the email address you provided.",
          type: "info",
        },
      ],
    ),
  },
  {
    id: "registration",
    labelKey: "devPreview.registration",
    kind: "registration",
    eyebrowKey: "auth.registration.eyebrow",
    titleKey: "auth.registration.title",
    descriptionKey: "auth.registration.description",
    flow: previewFlow("preview-registration", registrationNodes()),
  },
  {
    id: "registration-social",
    labelKey: "devPreview.registrationSocial",
    kind: "registration",
    eyebrowKey: "auth.registration.eyebrow",
    titleKey: "auth.registration.title",
    descriptionKey: "auth.registration.description",
    flow: previewFlow("preview-registration-social", [
      ...registrationNodes(),
      providerNode("Google"),
      providerNode("GitHub"),
      providerNode("Microsoft"),
    ]),
  },
  {
    id: "verification",
    labelKey: "devPreview.verification",
    kind: "verification",
    eyebrowKey: "auth.verification.eyebrow",
    titleKey: "auth.verification.title",
    descriptionKey: "auth.verification.description",
    flow: previewFlow("preview-verification", verificationNodes()),
  },
  {
    id: "verification-sent",
    labelKey: "devPreview.verificationSent",
    kind: "verification",
    eyebrowKey: "auth.verification.eyebrow",
    titleKey: "auth.verification.title",
    descriptionKey: "auth.verification.description",
    flow: previewFlow("preview-verification-sent", [], [
      {
        id: 3,
        text: "An email containing a verification link has been sent to the email address you provided.",
        type: "info",
      },
    ]),
  },
] as const;

export type PreviewAuthScenarioId = (typeof PREVIEW_AUTH_SCENARIOS)[number]["id"];
