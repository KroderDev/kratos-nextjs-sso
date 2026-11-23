import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/lib/i18n/client";

vi.mock("@/ory.config", () => ({
  orySetupReason: "notConfigured",
}));

import { OrySetupState } from "./setup-state";

describe("OrySetupState", () => {
  it("renders the setup message and a return-home link", () => {
    const markup = renderToStaticMarkup(<OrySetupState />);

    expect(markup).toContain('role="alert"');
    expect(markup).toContain("Access is temporarily unavailable");
    expect(markup).toContain("Authentication is not configured for this application.");
    expect(markup).toContain('href="/"');
    expect(markup).toContain("Return home");
  });

  it("renders the setup message in Spanish without leaking English copy", () => {
    const markup = renderToStaticMarkup(
      <I18nProvider initialLocale="es">
        <OrySetupState />
      </I18nProvider>,
    );

    expect(markup).toContain("El acceso no está disponible temporalmente");
    expect(markup).toContain("La autenticación no está configurada para esta aplicación.");
    expect(markup).toContain("Volver al inicio");
    expect(markup).not.toContain("Authentication is not configured");
  });
});
