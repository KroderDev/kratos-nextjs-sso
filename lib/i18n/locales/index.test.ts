import { describe, expect, it } from "vitest";

import { dictionaries, en } from "./index";
import { formatString } from "../utils";

function getKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.keys(obj).reduce((keys: string[], key) => {
    const path = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    if (typeof value === "object" && value !== null) {
      keys.push(...getKeys(value as Record<string, unknown>, path));
    } else {
      keys.push(path);
    }

    return keys;
  }, []);
}

describe("i18n locale registry", () => {
  it("keeps every locale aligned with the English dictionary", () => {
    const englishKeys = getKeys(en as unknown as Record<string, unknown>).sort();

    for (const [locale, dictionary] of Object.entries(dictionaries)) {
      const localeKeys = getKeys(dictionary as unknown as Record<string, unknown>).sort();
      expect(localeKeys, `Locale '${locale}' is missing English keys`).toEqual(englishKeys);
    }
  });

  it("exports the localized provider actions", () => {
    expect(en.ory.nodes.login).toBe("Login");
    expect(en.ory.nodes.continueWith).toBe("Continue with {provider}");
    expect(en.ory.nodes.connectWith).toBe("Connect with {provider}");
    expect(en.ory.nodes.unlinkWith).toBe("Unlink {provider}");
    expect(en.ory.nodes.socialLogin).toBe("Sign in with a social account");
    expect(en.ory.nodes.emailDivider).toBe("Or");
    expect(en.ory.nodes.emailDividerCompact).toBe("Or continue with");

    expect(dictionaries.es.ory.nodes.login).toBe("Iniciar sesión");
    expect(dictionaries.es.ory.nodes.continueWith).toBe("Continuar con {provider}");
    expect(dictionaries.es.ory.nodes.connectWith).toBe("Conectar con {provider}");
    expect(dictionaries.es.ory.nodes.unlinkWith).toBe("Desconectar {provider}");
    expect(dictionaries.es.ory.nodes.socialLogin).toBe("Iniciar sesión con una cuenta social");
    expect(dictionaries.es.ory.nodes.emailDivider).toBe("O");
    expect(dictionaries.es.ory.nodes.emailDividerCompact).toBe("O continúa con");
  });

  it("interpolates provider names in every locale", () => {
    expect(formatString(en.ory.nodes.continueWith, { provider: "Google" })).toBe(
      "Continue with Google",
    );
    expect(formatString(dictionaries.es.ory.nodes.continueWith, { provider: "Google" })).toBe(
      "Continuar con Google",
    );
  });

  it("contains the auth copy used by the application", () => {
    expect(en.auth.login.footer.createOne).toBe("Create an account");
    expect(en.auth.registration.title).toBe("Create your account");
    expect(en.auth.recovery.title).toBe("Recover your account");
    expect(en.auth.verification.title).toBe("Verify your email address");
    expect(en.auth.error.title).toBe("Unable to complete request");
  });
});
