import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { UiText } from "@ory/client-fetch";

import { FlowMessages } from "./flow-messages";

const message = (id: number, text: string, type: UiText["type"] = "info") =>
  ({ id, text, type } as UiText);

describe("FlowMessages", () => {
  it("renders translated titles for error, success, and informational messages", () => {
    const markup = renderToStaticMarkup(
      <FlowMessages
        messages={[
          message(1, "Invalid code", "error"),
          message(2, "Email updated", "success"),
          message(3, "Remember this device"),
        ]}
      />,
    );

    expect(markup).toContain("Action needed");
    expect(markup).toContain("Updated");
    expect(markup).toContain("Note");
    expect(markup).toContain("Invalid code");
    expect(markup).toContain("border-primary/25 bg-primary/5");
  });

  it("renders nothing for missing or empty messages", () => {
    expect(renderToStaticMarkup(<FlowMessages />)).toBe("");
    expect(renderToStaticMarkup(<FlowMessages messages={[message(1, "")]} />)).toBe("");
  });

  it("renders nothing when messages are delegated to toasts", () => {
    const markup = renderToStaticMarkup(
      <FlowMessages messages={[message(1, "Email updated", "success")]} mode="toast" />,
    );

    expect(markup).toBe("");
  });
});
