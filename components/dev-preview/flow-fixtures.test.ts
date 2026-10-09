import { describe, expect, it } from "vitest";

import {
  getNodeAttributes,
  hasPasswordLogin,
  isCodeInput,
  isLookupSecretInput,
  isProviderNode,
  isTotpCodeInput,
} from "@/lib/ory/flow";
import { allowedOryOrigins, isSafeFlowAction } from "@/lib/ory/security";

import { PREVIEW_AUTH_SCENARIOS } from "./flow-fixtures";

describe("local authentication preview fixtures", () => {
  const scenarioById = Object.fromEntries(
    PREVIEW_AUTH_SCENARIOS.map((scenario) => [scenario.id, scenario]),
  );

  const nodesFor = (scenarioId: string) => scenarioById[scenarioId]?.flow.ui.nodes ?? [];
  const countProviders = (scenarioId: string) => nodesFor(scenarioId).filter(isProviderNode).length;

  it("covers the available login, recovery, registration, and verification screens", () => {
    expect(PREVIEW_AUTH_SCENARIOS.map((scenario) => scenario.id)).toEqual([
      "password-three-providers",
      "social-only",
      "password-two-providers",
      "password-many-providers",
      "totp",
      "email-code-request",
      "email-code-challenge",
      "backup-code-login",
      "forgot-password",
      "recovery-success",
      "recovery-code-request",
      "recovery-code",
      "registration",
      "registration-social",
      "verification",
      "verification-sent",
    ]);
  });

  it("provide login combinations, additional social providers, and a TOTP challenge", () => {
    expect(countProviders("password-three-providers")).toBe(3);
    expect(hasPasswordLogin(nodesFor("password-three-providers"))).toBe(true);
    expect(countProviders("social-only")).toBe(3);
    expect(hasPasswordLogin(nodesFor("social-only"))).toBe(false);
    expect(countProviders("password-two-providers")).toBe(2);
    expect(hasPasswordLogin(nodesFor("password-two-providers"))).toBe(true);
    expect(countProviders("password-many-providers")).toBe(9);
    expect(hasPasswordLogin(nodesFor("password-many-providers"))).toBe(true);
    expect(nodesFor("totp").some(isTotpCodeInput)).toBe(true);

    const totpScenario = scenarioById.totp;
    expect(totpScenario?.titleKey).toBe("auth.login.titleAal2");
    expect(totpScenario?.descriptionKey).toBe("auth.login.descriptionAal2");
    expect(totpScenario?.flow.ui.messages).toContainEqual({
      id: 1,
      text: "Please complete the second authentication challenge.",
      type: "info",
    });

  });

  it("covers email-code, backup-code, and recovery-code methods", () => {
    expect(scenarioById["email-code-request"]?.kind).toBe("login");
    expect(hasPasswordLogin(nodesFor("email-code-request"))).toBe(true);

    const emailCodeChallenge = scenarioById["email-code-challenge"];
    expect(emailCodeChallenge?.flow.ui.nodes.some(isCodeInput)).toBe(true);
    expect(emailCodeChallenge?.flow.ui.messages).toContainEqual({
      id: 4,
      text: "An email containing a verification code has been sent to the email address you provided.",
      type: "info",
    });

    const backupCodeLogin = scenarioById["backup-code-login"];
    expect(backupCodeLogin?.titleKey).toBe("auth.login.titleAal2");
    expect(backupCodeLogin?.flow.ui.nodes.some(isLookupSecretInput)).toBe(true);

    expect(scenarioById["recovery-code-request"]?.kind).toBe("recovery");
    expect(nodesFor("recovery-code-request").some((node) => getNodeAttributes(node).value === "code")).toBe(true);

    const recoveryCode = scenarioById["recovery-code"];
    expect(recoveryCode?.flow.ui.nodes.some(isCodeInput)).toBe(true);
    expect(recoveryCode?.flow.ui.messages).toContainEqual({
      id: 5,
      text: "An email containing a recovery code has been sent to the email address you provided.",
      type: "info",
    });
  });

  it("includes password recovery, successful recovery, registration, and verification states", () => {
    expect(scenarioById["forgot-password"]?.kind).toBe("recovery");
    expect(nodesFor("forgot-password").some((node) => getNodeAttributes(node).name === "email")).toBe(true);

    expect(scenarioById["recovery-success"]?.kind).toBe("recovery");
    expect(scenarioById["recovery-success"]?.flow.ui.messages).toContainEqual({
      id: 2,
      text: "An email containing a recovery link has been sent to the email address you provided.",
      type: "info",
    });

    expect(scenarioById.registration?.kind).toBe("registration");
    expect(nodesFor("registration").map((node) => getNodeAttributes(node).name)).toEqual([
      "csrf_token",
      "traits.name.first",
      "traits.name.last",
      "traits.email",
      "password",
      "method",
    ]);
    expect(scenarioById["registration-social"]?.kind).toBe("registration");
    expect(countProviders("registration-social")).toBe(3);

    expect(scenarioById.verification?.kind).toBe("verification");
    expect(scenarioById["verification-sent"]?.flow.ui.messages).toContainEqual({
      id: 3,
      text: "An email containing a verification link has been sent to the email address you provided.",
      type: "info",
    });
  });

  it("use only safe local form actions and do not activate provider scripts", () => {
    const allowedOrigins = allowedOryOrigins([]);

    for (const scenario of PREVIEW_AUTH_SCENARIOS) {
      expect(isSafeFlowAction(scenario.flow.ui.action, allowedOrigins)).toBe(true);

      for (const node of scenario.flow.ui.nodes) {
        const attributes = getNodeAttributes(node);
        expect(attributes.onclickTrigger).toBeUndefined();
        expect(attributes.onloadTrigger).toBeUndefined();
      }
    }
  });
});
