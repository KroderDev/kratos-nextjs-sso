import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { AuthContent, AuthContentLoading, AuthFrame } from "./auth-shell";

vi.mock("next-themes", () => ({
  useTheme: () => ({ setTheme: vi.fn(), theme: "light" }),
}));

describe("auth shell", () => {
  it("renders the authentication frame around its children", () => {
    const markup = renderToStaticMarkup(
      <AuthFrame>
        <p>Sign-in form</p>
      </AuthFrame>,
    );

    expect(markup).toContain("Secure authentication");
    expect(markup).toContain("Sign-in form");
    expect(markup).toContain("Protected browser session");
  });

  it("renders content metadata and conditionally renders its footer", () => {
    const withFooter = renderToStaticMarkup(
      <AuthContent
        description="Use your account"
        eyebrow="Secure access"
        footer={<a href="/help">Need help?</a>}
        title="Welcome"
      >
        <button type="button">Continue</button>
      </AuthContent>,
    );
    const withoutFooter = renderToStaticMarkup(
      <AuthContent description="Use your account" eyebrow="Secure access" title="Welcome">
        <span>Form</span>
      </AuthContent>,
    );

    expect(withFooter).toContain("Secure access");
    expect(withFooter).toContain("Need help?");
    expect(withFooter).toContain("Continue");
    expect(withoutFooter).not.toContain("Need help?");
  });

  it("renders an accessible loading state", () => {
    const markup = renderToStaticMarkup(<AuthContentLoading />);

    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-label="Loading authentication form"');
    expect(markup).toContain('data-slot="card"');
  });
});
