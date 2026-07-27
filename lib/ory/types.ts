import type {
  LoginFlow,
  RecoveryFlow,
  RegistrationFlow,
  SettingsFlow,
  UiNode,
  VerificationFlow,
} from "@ory/client-fetch";

export type OryFlow =
  | LoginFlow
  | RegistrationFlow
  | RecoveryFlow
  | VerificationFlow
  | SettingsFlow;

export type OryFlowKind =
  | "login"
  | "registration"
  | "recovery"
  | "verification"
  | "settings";

export type { UiNode };
