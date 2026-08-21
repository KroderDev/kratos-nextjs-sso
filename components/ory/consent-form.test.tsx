// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConsentForm } from "./consent-form";

let mountedRoot: Root | undefined;
let mountedContainer: HTMLDivElement | undefined;

afterEach(() => {
  if (mountedRoot) {
    act(() => mountedRoot?.unmount());
  }
  mountedContainer?.remove();
  mountedRoot = undefined;
  mountedContainer = undefined;
});

describe("ConsentForm", () => {
  it("renders a regular form when automatic submission is disabled", () => {
    const markup = renderToStaticMarkup(
      <ConsentForm action="https://operator.example.com/consent" method="post">
        <button type="submit">Allow</button>
      </ConsentForm>,
    );

    expect(markup).toContain('action="https://operator.example.com/consent"');
    expect(markup).not.toContain('data-auto-submit="true"');
  });

  it("does not submit the form when automatic submission is disabled", () => {
    const requestSubmit = vi.fn();
    const originalRequestSubmit = HTMLFormElement.prototype.requestSubmit;
    HTMLFormElement.prototype.requestSubmit = requestSubmit;

    try {
      mountedContainer = document.createElement("div");
      document.body.append(mountedContainer);
      mountedRoot = createRoot(mountedContainer);

      act(() => {
        mountedRoot?.render(
          <ConsentForm
            action="https://operator.example.com/consent"
            method="post"
          >
            <button type="submit">Allow</button>
          </ConsentForm>,
        );
      });

      expect(requestSubmit).not.toHaveBeenCalled();
    } finally {
      HTMLFormElement.prototype.requestSubmit = originalRequestSubmit;
    }
  });

  it("submits the application-owned form when automatic submission is enabled", () => {
    const requestSubmit = vi.fn();
    const originalRequestSubmit = HTMLFormElement.prototype.requestSubmit;
    HTMLFormElement.prototype.requestSubmit = requestSubmit;

    try {
      mountedContainer = document.createElement("div");
      document.body.append(mountedContainer);
      mountedRoot = createRoot(mountedContainer);

      act(() => {
        mountedRoot?.render(
          <ConsentForm
            action="https://operator.example.com/consent"
            autoSubmit
            method="post"
          >
            <button type="submit">Allow</button>
          </ConsentForm>,
        );
      });

      expect(requestSubmit).toHaveBeenCalledTimes(1);
    } finally {
      HTMLFormElement.prototype.requestSubmit = originalRequestSubmit;
    }
  });
});
