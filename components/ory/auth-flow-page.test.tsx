import { renderToStaticMarkup } from "react-dom/server";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";

import type { OryFlow } from "@/lib/ory/types";

import { AuthFlowPage } from "./auth-flow-page";

vi.mock("@/components/layout/auth-shell", () => ({
  AuthContent: ({ children, description, footer, statusIcon, title }: {
    children: React.ReactNode;
    description?: string;
    footer?: React.ReactNode;
    statusIcon?: React.ReactNode;
    title: string;
  }) => (
    <section data-slot="card">
      <header>
        {statusIcon ? <div data-status-icon>{statusIcon}</div> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </header>
      <div data-slot="card-content">{children}</div>
      {footer ? <footer data-slot="card-footer">{footer}</footer> : null}
    </section>
  ),
}));
vi.mock("./flow-form", () => ({
  FlowForm: ({ embedded, flowState, kind, showFlowMessages }: {
    embedded?: boolean;
    flowState?: string;
    kind: string;
    showFlowMessages?: boolean;
  }) => (
    <div data-embedded={embedded} data-show-flow-messages={showFlowMessages} data-state={flowState}>
      flow form: {kind}
    </div>
  ),
}));
vi.mock("./flow-messages", () => ({
  FlowMessages: ({ messages, mode }: {
    messages?: Array<{ text?: string }>;
    mode?: string;
  }) => (
    <aside data-flow-messages-mode={mode}>
      {messages?.map((message) => message.text).join(" ")}
    </aside>
  ),
}));
vi.mock("./flow-unavailable", () => ({
  FlowUnavailable: () => <div>flow unavailable</div>,
}));

describe("AuthFlowPage", () => {
  const props = {
    description: "Enter your details",
    kind: "login" as const,
    title: "Welcome",
  };

  it("renders the flow form when a flow is available", () => {
    const flow = {
      id: "flow-id",
      ui: { action: "/self-service/login", method: "POST", nodes: [] },
    } as unknown as OryFlow;
    const markup = renderToStaticMarkup(
      <AuthFlowPage {...props} flow={flow} footer={<span>Footer</span>} />,
    );

    expect(markup).toContain("Welcome");
    expect(markup).toContain("flow form: login");
    expect(markup).toContain("Footer");
    expect(markup).not.toContain("flow unavailable");
  });

  it.each(["recovery", "verification"] as const)(
    "presents a sent-email %s state and hidden continuation form inside one card",
    (kind) => {
      const flow = {
        id: "flow-id",
        state: "sent_email",
        ui: {
          action: `/self-service/${kind}/browser`,
          method: "POST",
          messages: [{ id: 1, text: "Check your inbox for the next step.", type: "info" }],
          nodes: [],
        },
      } as unknown as OryFlow;
      const markup = renderToStaticMarkup(
        <AuthFlowPage
          {...props}
          description="Enter your email address to receive instructions."
          emailSentTitle="Check your email"
          flow={flow}
          footer={<span>Ordinary form footer</span>}
          kind={kind}
          statusAction={<button type="button">Back to sign in</button>}
        />,
      );

      expect(markup).toContain("Check your email");
      expect(markup).toContain("Check your inbox for the next step.");
      expect(markup).toContain("Back to sign in");
      expect(markup).toContain("data-status-icon");
      expect(markup).toContain("mx-auto flex size-12");
      expect(markup).not.toContain("Enter your email address to receive instructions.");
      expect(markup).not.toContain("Ordinary form footer");
      expect(markup).toContain('data-flow-messages-mode="status"');
      expect(markup).toContain('data-state="sent_email"');
      expect(markup).toContain('data-show-flow-messages="false"');
      expect(markup).toContain('data-embedded="true"');
      expect(markup).toContain('data-slot="card-content"');
      expect((markup.match(/data-slot="card"/g) ?? []).length).toBe(1);
      expect((markup.match(/<h1/g) ?? []).length).toBe(1);
      expect(markup.indexOf("data-status-icon")).toBeLessThan(markup.indexOf("<h1"));
      expect(markup.indexOf('data-slot="card-content"')).toBeLessThan(
        markup.indexOf("Back to sign in"),
      );
      expect(markup.indexOf('data-flow-messages-mode="status"')).toBeLessThan(
        markup.indexOf("flow form"),
      );
      expect(markup.indexOf("Check your inbox")).toBeLessThan(markup.indexOf("flow form"));
    },
  );

  it("keeps sent-email messages contextual for login challenges", () => {
    const flow = {
      id: "flow-id",
      state: "sent_email",
      ui: {
        action: "/self-service/login/browser",
        method: "POST",
        messages: [{ id: 1, text: "Enter the code sent to your email.", type: "info" }],
        nodes: [],
      },
    } as unknown as OryFlow;
    const markup = renderToStaticMarkup(
      <AuthFlowPage {...props} flow={flow} />,
    );

    expect(markup).toContain("Welcome");
    expect(markup).toContain("Enter your details");
    expect(markup).not.toContain('data-flow-messages-mode="status"');
    expect(markup).toContain('data-show-flow-messages="true"');
    expect(markup).toContain('data-embedded="true"');
  });

  it("falls back to the page title and omits a status action for sent-email flows", () => {
    const flow = {
      id: "flow-id",
      state: "sent_email",
      ui: {
        action: "/self-service/recovery/browser",
        method: "POST",
        messages: [{ id: 1, text: "Check your inbox.", type: "info" }],
        nodes: [],
      },
    } as unknown as OryFlow;
    const markup = renderToStaticMarkup(
      <AuthFlowPage
        {...props}
        flow={flow}
        kind="recovery"
        title="Recover access"
      />,
    );

    expect(markup).toContain("Recover access");
    expect(markup).toContain('data-flow-messages-mode="status"');
    expect(markup).not.toContain("Back to sign in");
  });

  it("renders the unavailable state when the provider returns a malformed flow", () => {
    const flow = { error: { id: "self_service_flow_disabled" } } as unknown as OryFlow;
    const markup = renderToStaticMarkup(<AuthFlowPage {...props} flow={flow} />);

    expect(markup).toContain("flow unavailable");
    expect(markup).not.toContain("flow form");
  });

  it("renders the unavailable state when no flow exists", () => {
    const markup = renderToStaticMarkup(<AuthFlowPage {...props} flow={null} />);

    expect(markup).toContain("flow unavailable");
    expect(markup).not.toContain("flow form");
  });
});
