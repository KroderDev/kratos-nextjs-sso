export const en = {
  common: {
    brand: "CI / Kratos SSO",
    brandAccess: "CI / access",
    brandSubtitle: "Redefining Identity",
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
      identityInfrastructure: "Identity infrastructure for thoughtful teams.",
      openSignIn: "Open sign in",
    },
  },
  home: {
    hero: {
      badge: "Secure account access",
      title: "A calmer way to enter the work.",
      description: "A considered, server-rendered entry point for sign-in, registration, recovery, and account settings.",
      enterWorkspace: "Enter your workspace",
      createIdentity: "Create an identity",
    },
    card: {
      tag: "identity access",
      title: "One clear entry to private work.",
      description: "Sign in, create an identity, or recover access without leaving the same considered surface.",
      protectedSession: "Server-protected session",
    },
    features: {
      secureByDefault: {
        title: "Secure by default",
        description: "Security controls keep cookies, redirects, and session state close to the server boundary.",
      },
      humanCenter: {
        title: "Human at the center",
        description: "The interface adapts to the identity methods your workspace actually enables.",
      },
      readyNextStep: {
        title: "Ready for the next step",
        description: "Sign in, create an identity, or recover access without leaving the same deliberate surface.",
      },
    },
  },
  auth: {
    shell: {
      badge: "Secure authentication",
      title: "Sign in to your workspace.",
      description: "Use your account to securely access your workspace.",
      sessionLabel: "Session",
      sessionValue: "Protected authentication flow",
      boundaryLabel: "Processing",
      boundaryValue: "Server-rendered",
      footerPrivate: "Secure access / 2026",
      footerProtected: "Protected browser session",
      loadingForm: "Loading authentication form",
    },
    login: {
      title: "Welcome back",
      eyebrow: "Sign in",
      description: "Sign in with your email address or a connected account.",
      footer: {
        needIdentity: "Don't have an account?",
        createOne: "Create an account",
        recoverAccess: "Forgot your password?",
      },
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
      backToSignIn: "Back to sign in",
    },
  },
  dashboard: {
    loading: "Loading dashboard",
    overview: {
      eyebrow: "Control room / overview",
      title: "Good to see you, {name}.",
      description: "Your identity is active and your private workspace is ready for the next considered move.",
      sessionActive: "Session active",
      identityCard: {
        title: "Verified presence",
        description: "Your current session is recognized by the identity service.",
        established: "Browser session established",
        tag: "identity",
      },
      postureCard: {
        title: "Quietly protected",
        description: "Session cookies and flow state stay on the server boundary.",
        reviewSettings: "Review account settings",
        tag: "posture",
      },
      sessionDetails: {
        title: "Session details",
        description: "The current browser session, without exposing credentials.",
        serverChecked: "server checked",
        email: "identity email",
        issued: "session issued",
        expires: "Expires {date}",
        notAvailable: "Not available",
      },
      aside: {
        tag: "Next move",
        title: "Keep your identity details useful.",
        description: "Add a verified address or update your credentials whenever the shape of your work changes.",
        openSettings: "Open settings",
      },
      unconfigured: {
        eyebrow: "Protected workspace",
        title: "Your control room is waiting.",
        description: "The authentication service is not ready to accept sessions yet.",
      },
    },
    settings: {
      eyebrow: "Control room / settings",
      title: "Keep your identity current.",
      description: "Update the identity attributes and credentials you control.",
      badge: "Account controls",
      aside: {
        tag: "Next move",
        title: "Keep your access useful.",
        description: "Review your identity details and credentials whenever the shape of your work changes.",
        returnOverview: "Return to overview",
      },
      returnOverview: "Return to overview",
    },
  },
  ory: {
    setup: {
      title: "Access is temporarily unavailable",
      returnHome: "Return home",
    },
    unavailable: {
      title: "This flow is no longer available",
      description: "Start again from the beginning so the identity service can issue a fresh browser flow.",
    },
    messages: {
      actionNeeded: "Action needed",
      updated: "Updated",
      note: "Note",
    },
    nodes: {
      continue: "Continue",
      login: "Login",
      continueWith: "Continue with {provider}",
      confirmChoice: "Confirm this choice",
      verificationCode: "Verification code",
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
