import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@base-ui/react/toast", () => ({
  Toast: {
    createToastManager: () => ({ add: vi.fn() }),
    Provider: ({ children, ...props }: Record<string, unknown>) => (
      <div data-slot="toast-provider" {...props}>
        {children as React.ReactNode}
      </div>
    ),
    Portal: ({ children, ...props }: Record<string, unknown>) => (
      <div data-slot="toast-portal" {...props}>
        {children as React.ReactNode}
      </div>
    ),
    Viewport: ({ children, ...props }: Record<string, unknown>) => (
      <div data-slot="toast-viewport" {...props}>
        {children as React.ReactNode}
      </div>
    ),
    Root: (props: Record<string, unknown>) => <div {...props} />,
    Content: (props: Record<string, unknown>) => <div {...props} />,
    Title: (props: Record<string, unknown>) => <div {...props} />,
    Description: (props: Record<string, unknown>) => <div {...props} />,
    Action: (props: Record<string, unknown>) => <button {...props} />,
    Close: (props: Record<string, unknown>) => <button {...props} />,
    useToastManager: () => ({ toasts: [] }),
  },
}));

import { Toaster } from "./toast";

describe("Toaster", () => {
  it("renders the toast provider, portal, and viewport", () => {
    const markup = renderToStaticMarkup(<Toaster />);

    expect(markup).toContain('data-slot="toast-portal"');
    expect(markup).toContain('data-slot="toast-viewport"');
  });
});
