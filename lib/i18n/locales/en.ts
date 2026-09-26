export const en = {
  common: {
    theme: {
      label: "Theme",
      ariaLabel: "Change color theme",
      appearance: "Appearance",
      light: "Light",
      dark: "Dark",
      system: "System",
    },
    navigation: {
      primary: "Primary",
      workspace: "Workspace",
      signIn: "Sign in",
      getStarted: "Get started",
      overview: "Overview",
      settings: "Settings",
      signOut: "Sign out",
      accountMenuAria: "Open account menu for {label}",
      loadingNextPage: "Loading next page",
    },
    footer: {
      identityInfrastructure: "Secure identity and account access.",
      openSignIn: "Open sign in",
    },
  },
  home: {
    hero: {
      badge: "Secure account access",
      title: "Secure access to your workspace.",
      description: "Sign in, create an account, recover access, and manage your security settings.",
      enterWorkspace: "Enter your workspace",
      createIdentity: "Create an account",
    },
    card: {
      tag: "account access",
      title: "One place to manage account access.",
      description: "Sign in or recover access from the same secure entry point.",
      protectedSession: "Protected account access",
    },
    features: {
      secureByDefault: {
        title: "Secure by default",
        description: "Security controls protect sign-in, account recovery, and session access.",
      },
      humanCenter: {
        title: "Flexible authentication",
        description: "Use the sign-in methods enabled for your workspace.",
      },
      readyNextStep: {
        title: "Account recovery",
        description: "Recover access securely if you lose your sign-in credentials.",
      },
    },
  },
  auth: {
    shell: {
      badge: "Secure authentication",
      title: "Sign in to your workspace.",
      description: "Use your account to securely access your workspace.",
      sessionLabel: "Session",
      sessionValue: "Secure sign-in",
      boundaryLabel: "Security",
      boundaryValue: "Account protected",
      footerPrivate: "Secure account access",
      footerProtected: "Protected browser session",
      loadingForm: "Loading authentication form",
    },
    login: {
      title: "Welcome back",
      eyebrow: "Sign in",
      description: "Sign in with your email address or a connected account.",
      descriptionSocialOnly: "Sign in with a connected account.",
      titleRefresh: "Sign in again",
      descriptionRefresh: "Your session needs to be refreshed before you can continue.",
      titleAal2: "Verify your identity",
      descriptionAal2: "Complete an additional security check to continue.",
      footer: {
        needIdentity: "Don't have an account?",
        createOne: "Create an account",
        recoverAccess: "Forgot your password?",
      },
    },
    consent: {
      title: "Continue to {client}",
      eyebrow: "Application access",
      description: "Review the access requested by {client}.",
      defaultClient: "the application",
      permissionsTitle: "Requested permissions",
      permissionsDescription: "This application will receive the permissions below.",
      basicAccess: "Basic account access",
      remember: "Remember my decision for this application",
      allow: "Allow access",
      deny: "Deny",
    },
    registration: {
      title: "Create your account",
      eyebrow: "Sign up",
      description: "Enter your details to create an account.",
      footer: {
        alreadyAccess: "Already have an account?",
        signIn: "Sign in",
      },
    },
    recovery: {
      title: "Recover your account",
      eyebrow: "Account recovery",
      description: "Enter your email address to receive recovery instructions.",
      footer: {
        rememberedDetails: "Remember your password?",
        returnSignIn: "Back to sign in",
      },
    },
    verification: {
      title: "Verify your email address",
      eyebrow: "Email verification",
      description: "Confirm your email address to continue.",
      footer: {
        needStartOver: "Need to start over?",
        returnSignIn: "Back to sign in",
      },
    },
    error: {
      title: "Unable to complete request",
      eyebrow: "Authentication error",
      description: "We couldn't complete your request. Start a new sign-in flow and try again.",
      alertTitle: "Authentication error",
      fallbackMessage: "No changes were made to your credentials. Return to sign in and try again.",
      registrationDisabled: "Registration is currently disabled. If you already have an account, return to sign in.",
      recoveryDisabled: "Account recovery is currently disabled. Return to sign in for another option.",
      verificationDisabled: "Email verification is currently unavailable. Return to sign in and try again.",
      invalidRequest: "This authentication request is invalid or has expired. Start again from the application.",
      logoutUnavailable: "We couldn't safely complete sign-out. Return to sign in and try again.",
      backToSignIn: "Back to sign in",
    },
  },
  dashboard: {
    loading: "Loading dashboard",
    overview: {
      eyebrow: "Account / Overview",
      title: "Good to see you, {name}.",
      description: "Your account is signed in and the current session is active.",
      sessionActive: "Session active",
      identityCard: {
        title: "Active session",
        description: "Your account is signed in on this browser.",
        established: "Session active",
        tag: "session",
      },
      postureCard: {
        title: "Account security",
        description: "Review your sign-in methods and recovery options.",
        reviewSettings: "Review account settings",
        tag: "security",
      },
      sessionDetails: {
        title: "Session details",
        description: "Information about your current browser session.",
        serverChecked: "Active",
        email: "Email",
        issued: "Signed in",
        expires: "Expires {date}",
        notAvailable: "Not available",
      },
      aside: {
        tag: "Account settings",
        title: "Keep your account up to date.",
        description: "Review your profile and security settings when needed.",
        openSettings: "Open settings",
      },
      unconfigured: {
        eyebrow: "Account access",
        title: "Account access is unavailable.",
        description: "The authentication service is not ready to accept sessions yet.",
      },
    },
    settings: {
      eyebrow: "Account / Settings",
      title: "Manage your account.",
      description: "Update your profile, sign-in methods, and recovery options.",
      badge: "Account controls",
      areas: {
        profile: {
          label: "Profile",
          description: "Keep the details people use to recognize your account current.",
        },
        security: {
          label: "Security",
          description: "Protect sign-in with a strong password, an authenticator, and recovery options.",
        },
        connections: {
          label: "Connected accounts",
          description: "Manage the external accounts connected to your account.",
        },
      },
      navigation: {
        label: "Settings navigation",
        title: "Account settings",
        selectLabel: "Choose a settings area",
        currentArea: "Current area",
        help: "Changes are saved to your account.",
        returnOverview: "Return to overview",
      },
      cards: {
        profile: {
          title: "Profile",
          description: "Update the profile details associated with your account.",
        },
        password: {
          title: "Password",
          description: "Choose a unique password that you do not reuse elsewhere.",
        },
        totp: {
          title: "Authenticator app",
          description: "Use a time-based code to add another layer of protection at sign-in.",
        },
        webauthn: {
          title: "Security keys and biometrics",
          description: "Use a hardware security key or device biometric to protect your account.",
        },
        passkey: {
          title: "Passkeys",
          description: "Sign in securely with a passkey saved to your device or password manager.",
        },
        lookupSecret: {
          title: "Recovery codes",
          description: "Use these one-time codes if you lose access to your authenticator. Store them somewhere safe.",
        },
        oidc: {
          title: "Connected accounts",
          description: "Link or unlink an external account used to sign in.",
        },
        other: {
          title: "Additional settings",
          description: "Additional account controls provided by your authentication service.",
        },
      },
      noSettings: "This area has no settings available for your account.",
      recoveryCodes: {
        title: "Recovery codes",
        description: "Use these one-time codes if you lose access to your authenticator. Store them somewhere safe.",
        pendingTitle: "Confirm your new codes",
        pendingDescription: "These codes are not active until you confirm that you have stored them.",
        fallback: "Recovery codes are available, but their details could not be displayed.",
        availableLabelOne: "{count} active code",
        availableLabelOther: "{count} active codes",
        copyAll: "Copy all codes",
        copied: "Copied",
        download: "Download",
        downloaded: "Downloaded",
        copyCode: "Copy code",
        codeCopied: "Code copied",
        copyFailed: "Could not copy the codes. Select and copy them manually.",
        usedLabel: "Used codes",
        usedCode: "Used recovery code",
        usedOn: "Used on {date} UTC",
        used: "Used",
      },
      confirmations: {
        cancel: "Cancel",
        disableTotp: {
          title: "Turn off two-factor authentication?",
          description: "Your account will return to password-only sign-in. You can set up an authenticator again later.",
          confirm: "Turn off two-factor authentication",
        },
        disableRecovery: {
          title: "Disable recovery codes?",
          description: "Any remaining recovery codes will stop working. Generate a new set before disabling them if you still need recovery access.",
          confirm: "Disable recovery codes",
        },
      },
      aside: {
        tag: "Account settings",
        title: "Review your account security.",
        description: "Keep your profile, sign-in methods, and recovery options up to date.",
        returnOverview: "Return to overview",
      },
      returnOverview: "Return to overview",
    },
  },
  ory: {
    setup: {
      title: "Access is temporarily unavailable",
      notConfigured: "Authentication is not configured for this application. Contact an administrator to enable access.",
      unavailable: "The authentication service is unavailable. Contact an administrator or try again later.",
      returnHome: "Return home",
    },
    unavailable: {
      title: "This flow is no longer available",
      description: "Start again to request a new authentication session.",
    },
    messages: {
      actionNeeded: "Action needed",
      updated: "Updated",
      note: "Note",
    },
    nodes: {
      continue: "Continue",
      login: "Sign in",
      continueWith: "Continue with {provider}",
      connectWith: "Connect with {provider}",
      unlinkWith: "Unlink {provider}",
      confirmChoice: "Confirm this choice",
       verificationCode: "Verification code",
       totpCode: "Authenticator code",
      recoveryCode: "Recovery code",
      value: "Value",
      qrCodeAlt: "Authenticator setup QR code",
      identityImageAlt: "Identity service image",
      socialLogin: "Sign in with a social account",
      emailDivider: "Or",
      emailDividerCompact: "Or continue with",
    },
  },
} as const;



type DeepStringify<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends Record<string, unknown>
      ? DeepStringify<T[K]>
      : T[K];
};

export type TranslationKeys = DeepStringify<typeof en>;
