// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(
    function MockLink(props, ref) {
      return <a ref={ref} {...props} />;
    },
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { size?: string; variant?: string }
  >(function MockButton(props, ref) {
    return <button ref={ref} {...props} />;
  }),
}));

vi.mock("@base-ui/react/avatar", () => ({
  Avatar: {
    Root: ({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <span data-slot="avatar" className={className} {...props}>
        {children}
      </span>
    ),
    Image: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <span data-slot="avatar-image" className={className} {...props} />
    ),
    Fallback: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <span data-slot="avatar-fallback" className={className} {...props} />
    ),
  },
}));

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

  it("renders a public metadata avatar alongside its fallback", () => {
    const markup = renderToStaticMarkup(
      <AccountMenu
        avatarUrl="https://example.com/ada.png"
        email="ada@example.com"
        initials="AW"
        label="Ada Lovelace"
        logoutUrl="/self-service/logout/browser"
      />,
    );

    expect(markup).toContain('data-slot="avatar-image"');
    expect(markup).toContain('src="https://example.com/ada.png"');
    expect(markup).toContain(">AW<");
  });

  it("intercepts the settings action when a preview callback is provided", () => {
    const onAction = vi.fn();
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <AccountMenu
          email="ada@example.com"
          initials="AW"
          label="Ada Lovelace"
          logoutUrl="/self-service/logout/browser"
          onAction={onAction}
        />,
      );
    });

    const settingsLink = container.querySelector<HTMLAnchorElement>(
      'a[href="/dashboard/settings"]',
    );
    expect(settingsLink).not.toBeNull();
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });

    act(() => settingsLink?.dispatchEvent(click));

    expect(click.defaultPrevented).toBe(true);
    expect(onAction).toHaveBeenCalledExactlyOnceWith("settings");

    act(() => root.unmount());
    container.remove();
  });

  it("intercepts the sign-out action when a preview callback is provided", () => {
    const onAction = vi.fn();
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <AccountMenu
          email="ada@example.com"
          initials="AW"
          label="Ada Lovelace"
          logoutUrl="/self-service/logout/browser"
          onAction={onAction}
        />,
      );
    });

    const signOutLink = container.querySelector<HTMLAnchorElement>(
      'a[href="/self-service/logout/browser"]',
    );
    expect(signOutLink).not.toBeNull();
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });

    act(() => signOutLink?.dispatchEvent(click));

    expect(click.defaultPrevented).toBe(true);
    expect(onAction).toHaveBeenCalledExactlyOnceWith("signOut");

    act(() => root.unmount());
    container.remove();
  });
});
