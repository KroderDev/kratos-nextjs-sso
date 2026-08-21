// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import { I18nProvider, useTranslation } from "./client";

function TranslationProbe({ keyName = "common.navigation.signIn" }: { keyName?: string }) {
  const { locale, t } = useTranslation();

  return <output>{locale}:{t(keyName, { name: "Ada" })}</output>;
}

describe("I18nProvider", () => {
  let root: ReturnType<typeof createRoot> | undefined;
  let container: HTMLDivElement | undefined;

  afterEach(() => {
    if (root) {
      act(() => root?.unmount());
    }
    container?.remove();
    root = undefined;
    container = undefined;
  });

  it("provides the selected locale and translated strings", () => {
    const markup = renderToStaticMarkup(
      <I18nProvider initialLocale="es">
        <TranslationProbe />
      </I18nProvider>,
    );

    expect(markup).toBe("<output>es:Iniciar sesión</output>");
  });

  it("detects a valid browser locale when no initial locale is supplied", () => {
    Object.defineProperty(window.navigator, "language", {
      configurable: true,
      value: "es-MX",
    });
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    act(() => {
      root?.render(
        <I18nProvider>
          <TranslationProbe />
        </I18nProvider>,
      );
    });

    expect(container.textContent).toBe("es:Iniciar sesión");
  });

  it("falls back to the default locale and key for unsupported browser strings", () => {
    Object.defineProperty(window.navigator, "language", {
      configurable: true,
      value: "fr-FR",
    });
    Object.defineProperty(window.navigator, "languages", {
      configurable: true,
      value: [],
    });
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    act(() => {
      root?.render(
        <I18nProvider>
          <TranslationProbe keyName="missing.translation" />
        </I18nProvider>,
      );
    });

    expect(container.textContent).toBe("en:missing.translation");
  });

  it("uses the first preferred language when navigator.language is empty", () => {
    Object.defineProperty(window.navigator, "language", {
      configurable: true,
      value: "",
    });
    Object.defineProperty(window.navigator, "languages", {
      configurable: true,
      value: ["es-MX"],
    });
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    act(() => {
      root?.render(
        <I18nProvider>
          <TranslationProbe />
        </I18nProvider>,
      );
    });

    expect(container.textContent).toBe("es:Iniciar sesión");
  });

  it("uses the default locale when no browser languages are available", () => {
    Object.defineProperty(window.navigator, "language", {
      configurable: true,
      value: "",
    });
    Object.defineProperty(window.navigator, "languages", {
      configurable: true,
      value: [],
    });
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    act(() => {
      root?.render(
        <I18nProvider>
          <TranslationProbe />
        </I18nProvider>,
      );
    });

    expect(container.textContent).toBe("en:Sign in");
  });

  it("uses the default dictionary when an invalid initial locale is supplied", () => {
    const markup = renderToStaticMarkup(
      <I18nProvider initialLocale={"fr" as never}>
        <TranslationProbe />
      </I18nProvider>,
    );

    expect(markup).toBe("<output>fr:Sign in</output>");
  });

  it("uses the default context when no provider is present", () => {
    const markup = renderToStaticMarkup(
      <TranslationProbe keyName="missing.translation" />,
    );

    expect(markup).toBe("<output>en:missing.translation</output>");
  });

  it("falls back to the default locale when the browser reports no language", () => {
    const original = window.navigator;
    Object.defineProperty(window, "navigator", {
      configurable: true,
      value: { language: "", languages: [] },
    });
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    act(() => {
      root?.render(
        <I18nProvider>
          <TranslationProbe />
        </I18nProvider>,
      );
    });

    expect(container.textContent).toBe("en:Sign in");

    Object.defineProperty(window, "navigator", {
      configurable: true,
      value: original,
    });
  });
});
