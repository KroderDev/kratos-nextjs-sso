import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { I18nProvider, useTranslation } from "./client";

function TranslationProbe() {
  const { locale, t } = useTranslation();

  return <output>{locale}:{t("common.navigation.signIn")}</output>;
}

describe("I18nProvider", () => {
  it("provides the selected locale and translated strings", () => {
    const markup = renderToStaticMarkup(
      <I18nProvider initialLocale="es">
        <TranslationProbe />
      </I18nProvider>,
    );

    expect(markup).toBe("<output>es:Iniciar sesión</output>");
  });
});
