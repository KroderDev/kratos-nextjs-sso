import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useSyncExternalStore: (
      _subscribe: unknown,
      getClientSnapshot: () => unknown,
    ) => getClientSnapshot(),
  };
});

import { I18nProvider, useTranslation } from "./client";

function Probe() {
  const { locale, t } = useTranslation();
  return <output>{locale}:{t("common.navigation.signIn")}</output>;
}

describe("I18nProvider server snapshot", () => {
  it("uses the server snapshot without browser globals", () => {
    const markup = renderToStaticMarkup(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );

    expect(markup).toBe("<output>en:Sign in</output>");
  });
});
