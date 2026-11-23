import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  AuthContent,
  AuthContentLoading,
  AuthFrame,
} from "./auth-shell";

vi.mock("next-themes", () => ({
  useTheme: () => ({ setTheme: vi.fn(), theme: "light" }),
}));
vi.mock("@/lib/legal", () => ({
  privacyPolicyUrl: "/privacy",
  termsOfServiceUrl: "/terms",
}));

describe("auth shell", () => {
  it("preserves the cover frame around the authentication form", () => {
    const markup = renderToStaticMarkup(
      <AuthFrame>
        <AuthContent description="Use your account" title="Sign in">
          <p>Sign-in form</p>
        </AuthContent>
      </AuthFrame>,
    );

    expect(markup).toContain('aria-labelledby="auth-shell-title"');
    expect(markup).toContain("Secure authentication");
    expect(markup).toContain("Sign-in form");
    expect(markup).toContain("Secure account access");
    expect(markup).not.toContain("Protected browser session");
    expect(markup).not.toContain("KS / access");
    expect((markup.match(/data-slot="card"/g) ?? []).length).toBe(1);
  });

  it("keeps the title, description, form, and cross-flow footer within one card", () => {
    const withFooter = renderToStaticMarkup(
      <AuthContent
        description="Use your account"
        footer={<a href="/help">Need help?</a>}
        title="Welcome"
      >
        <button type="button">Continue</button>
      </AuthContent>,
    );
    const withoutFooter = renderToStaticMarkup(
      <AuthContent description="Use your account" title="Welcome">
        <span>Form</span>
      </AuthContent>,
    );

    expect(withFooter).toContain("<h1");
    expect(withFooter).toContain("Use your account");
    expect(withFooter).toContain("Need help?");
    expect(withFooter).toContain("Continue");
    expect(withFooter).toContain('data-slot="card-footer"');
    expect(withFooter).toContain("items-center");
    expect(withFooter).toContain("text-center");
    expect((withFooter.match(/data-slot="card"/g) ?? []).length).toBe(1);
    expect((withFooter.match(/<h1/g) ?? []).length).toBe(1);
    expect(withoutFooter).not.toContain("Need help?");
    expect(withoutFooter).not.toContain('data-slot="card-footer"');
  });

  it("places neutral legal links below every auth form card", () => {
    const markup = renderToStaticMarkup(
      <AuthContent
        description="Sign in to your account"
        title="Welcome back"
      >
        <button type="button">Sign in</button>
      </AuthContent>,
    );
    const cardStart = markup.indexOf('data-slot="card"');
    const legalLinksStart = markup.indexOf('data-slot="auth-legal-links"');
    const cardMarkup = markup.slice(cardStart, legalLinksStart);

    expect(legalLinksStart).toBeGreaterThan(cardStart);
    expect(cardMarkup).not.toContain('data-slot="auth-legal-links"');
    expect(markup).toContain('href="/terms">Terms of Service</a>');
    expect(markup).toContain('href="/privacy">Privacy Policy</a>');
  });

  it("allows a flow result heading without the stale form description", () => {
    const markup = renderToStaticMarkup(
      <AuthContent
        statusIcon={<span data-flow-status-icon />}
        title="Check your email"
      >
        <p role="status">An email with recovery instructions was sent.</p>
      </AuthContent>,
    );

    expect(markup).toContain("Check your email");
    expect(markup).toContain('data-flow-status-icon="true"');
    expect(markup.indexOf("data-flow-status-icon")).toBeLessThan(markup.indexOf("<h1"));
    expect(markup).toContain("An email with recovery instructions was sent.");
    expect(markup).not.toContain("Enter your email address to receive recovery instructions.");
  });

  it("renders an accessible loading state", () => {
    const markup = renderToStaticMarkup(<AuthContentLoading />);

    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-label="Loading authentication form"');
    expect(markup).toContain('data-slot="card"');
  });
});
