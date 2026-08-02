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

export type RenderableOryFlow = {
  id: string;
  ui: OryFlow["ui"];
};

export type OryFlowKind =
  | "login"
  | "registration"
  | "recovery"
  | "verification"
  | "settings";

export type { UiNode };

export function toRenderableOryFlow(flow: OryFlow): RenderableOryFlow {
  return { id: flow.id, ui: flow.ui };
}
