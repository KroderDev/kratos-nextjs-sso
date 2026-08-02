import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
    useToastManager: vi.fn(() => ({ toasts: [] })),
  },
}));

import {
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  Toaster,
  useToastManager,
} from "./toast";

describe("Toaster", () => {
  beforeEach(() => {
    vi.mocked(useToastManager).mockReturnValue({ toasts: [] } as never);
  });

  it("renders the toast provider, portal, and viewport", () => {
    const markup = renderToStaticMarkup(<Toaster />);

    expect(markup).toContain('data-slot="toast-portal"');
    expect(markup).toContain('data-slot="toast-viewport"');
  });

  it("renders the toast composition and actions", () => {
    const markup = renderToStaticMarkup(
      <ToastProvider>
        <ToastPortal>
          <ToastViewport className="custom-viewport">
            <Toast className="custom-toast" toast={{ id: "manual", type: "info" } as never}>
              <ToastContent>
                <ToastTitle>Saved</ToastTitle>
                <ToastDescription>Your changes are saved.</ToastDescription>
                <ToastAction>Undo</ToastAction>
                <ToastClose />
              </ToastContent>
            </Toast>
          </ToastViewport>
        </ToastPortal>
      </ToastProvider>,
    );

    expect(markup).toContain('data-slot="toast-provider"');
    expect(markup).toContain('data-slot="toast-portal"');
    expect(markup).toContain('data-slot="toast-viewport"');
    expect(markup).toContain('data-slot="toast"');
    expect(markup).toContain('data-slot="toast-content"');
    expect(markup).toContain('data-slot="toast-title"');
    expect(markup).toContain('data-slot="toast-description"');
    expect(markup).toContain('data-slot="toast-action"');
    expect(markup).toContain('data-slot="toast-close"');
    expect(markup).toContain("Your changes are saved.");
  });

  it("renders icons for every supported toast type", () => {
    vi.mocked(useToastManager).mockReturnValue({
      toasts: [
        { id: "success", type: "success" },
        { id: "info", type: "info" },
        { id: "warning", type: "warning" },
        { id: "error", type: "error" },
        { id: "loading", type: "loading" },
        { id: "unknown", type: "other" },
      ],
    } as never);

    const markup = renderToStaticMarkup(<Toaster />);

    expect(markup.match(/data-slot="toast-icon"/g)).toHaveLength(5);
    expect(markup).toContain("lucide-circle-check");
    expect(markup).toContain("lucide-info");
    expect(markup).toContain("lucide-triangle-alert");
    expect(markup).toContain("lucide-octagon-x");
    expect(markup).toContain("lucide-loader-circle");
  });
});
