import { renderToStaticMarkup } from "react-dom/server";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";

import { AccountMenu } from "./account-menu";

vi.mock("@/components/ui/dropdown-menu", () => {
  type RenderProps = React.HTMLAttributes<HTMLElement> & {
    render?: React.ReactElement;
  };
  const withRender = ({ render, children, ...props }: RenderProps) =>
    render && React.isValidElement(render)
      ? React.cloneElement(render, props, children)
      : <div {...props}>{children}</div>;

  return {
    DropdownMenu: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuItem: withRender,
    DropdownMenuLabel: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
    DropdownMenuSeparator: () => <hr />,
    DropdownMenuTrigger: withRender,
  };
});

describe("AccountMenu", () => {
  it("renders the account identity and accessible trigger", () => {
    const markup = renderToStaticMarkup(
      <AccountMenu
        email="ada@example.com"
        initials="AW"
        label="Ada Lovelace"
        logoutUrl="/self-service/logout/browser"
      />,
    );

    expect(markup).toContain('aria-label="Open account menu for Ada Lovelace"');
    expect(markup).toContain("Ada Lovelace");
    expect(markup).toContain("ada@example.com");
    expect(markup).toContain(">AW<");
  });

  it("renders settings and logout destinations", () => {
    const markup = renderToStaticMarkup(
      <AccountMenu
        email="ada@example.com"
        initials="AW"
        label="Ada Lovelace"
        logoutUrl="/self-service/logout/browser?token=abc"
      />,
    );

    expect(markup).toContain('href="/dashboard/settings"');
    expect(markup).toContain('href="/self-service/logout/browser?token=abc"');
    expect(markup).toContain("Settings");
    expect(markup).toContain("Sign out");
  });
});
