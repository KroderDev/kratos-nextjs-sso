import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const { registrationEnabled } = vi.hoisted(() => ({
  registrationEnabled: { value: true },
}));

vi.mock("@/components/layout/brand", () => ({
  Brand: () => <div />,
}));

vi.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => <button type="button" />,
}));

vi.mock("@/lib/i18n/server", () => ({
  getTranslations: vi.fn(async () => ({
    t: (key: string) => key,
  })),
}));

vi.mock("@/ory.config", () => ({
  get isRegistrationEnabled() {
    return registrationEnabled.value;
  },
}));

import Home from "./page";

describe("Home", () => {
  it("links registration actions to registration when enabled", async () => {
    registrationEnabled.value = true;

    const markup = renderToStaticMarkup(await Home({}));

    expect(markup.match(/href="\/registration"/g)).toHaveLength(2);
  });

  it("links registration actions to login when registration is disabled", async () => {
    registrationEnabled.value = false;

    const markup = renderToStaticMarkup(await Home({}));

    expect(markup.match(/href="\/registration"/g)).toBeNull();
    expect(markup.match(/href="\/login"/g)).toHaveLength(5);
  });
});
