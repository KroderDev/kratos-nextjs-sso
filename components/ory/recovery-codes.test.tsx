// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RecoveryCodes } from "./recovery-codes";

describe("RecoveryCodes", () => {
  let mountedContainer: HTMLDivElement | undefined;
  let mountedRoot: Root | undefined;
  const originalClipboard = navigator.clipboard;
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  afterEach(() => {
    if (mountedRoot) {
      act(() => mountedRoot?.unmount());
    }
    mountedContainer?.remove();
    mountedRoot = undefined;
    mountedContainer = undefined;
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: originalClipboard,
    });
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: originalCreateObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: originalRevokeObjectURL,
    });
    vi.useRealTimers();
  });

  function mount(entries: { kind: "active"; code: string }[]) {
    mountedContainer = document.createElement("div");
    document.body.append(mountedContainer);
    mountedRoot = createRoot(mountedContainer);

    act(() => {
      mountedRoot?.render(
        <RecoveryCodes entries={entries} id="recovery" pending={false} />,
      );
    });

    return mountedContainer;
  }

  it("renders active codes and redacts used codes", () => {
    const markup = renderToStaticMarkup(
      <RecoveryCodes
        entries={[
          { kind: "active", code: "active-code" },
          { kind: "used", usedAtUnix: 1_634_197_131 },
        ]}
        id="recovery"
        pending={false}
      />,
    );

    expect(markup).toContain("active-code");
    expect(markup).toContain("1 active code");
    expect(markup).toContain("********");
    expect(markup).not.toContain("1,634,197,131");
  });

  it("renders pending state and an in-card confirmation action", () => {
    const markup = renderToStaticMarkup(
      <RecoveryCodes
        confirmationAction={<button type="submit">Confirm codes</button>}
        entries={[{ kind: "active", code: "active-code" }]}
        id="recovery"
        pending
      />,
    );

    expect(markup).toContain("Confirm your new codes");
    expect(markup).toContain("Confirm codes");
    expect(markup).not.toContain('data-slot="dialog-trigger"');
  });

  it("renders plural copy and a fallback for an invalid used timestamp", () => {
    const markup = renderToStaticMarkup(
      <RecoveryCodes
        entries={[
          { kind: "active", code: "active-code-1" },
          { kind: "active", code: "active-code-2" },
          { kind: "used", usedAt: "not-a-date" },
          { kind: "used" },
        ]}
        id="recovery"
        pending={false}
      />,
    );

    expect(markup).toContain("2 active codes");
    expect(markup).toContain("Used codes: 2");
    expect(markup).toContain(">Used<");
    expect(markup).not.toContain("Used on");
  });

  it("renders fallback text and formats string used timestamps without active codes", () => {
    const markup = renderToStaticMarkup(
      <RecoveryCodes
        entries={[{ kind: "used", usedAt: "2021-10-14T07:38:51Z" }]}
        fallbackText="No active recovery codes"
        id="recovery"
        pending={false}
      />,
    );
    const defaultMarkup = renderToStaticMarkup(
      <RecoveryCodes
        entries={[]}
        id="recovery-empty"
        pending={false}
      />,
    );

    expect(markup).toContain("No active recovery codes");
    expect(markup).toContain("Used on");
    expect(defaultMarkup).toContain("Recovery codes are available");
  });

  it("copies all recovery codes and shows the copied state", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const container = mount([
      { kind: "active", code: "active-code-1" },
      { kind: "active", code: "active-code-2" },
    ]);
    const button = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Copy all codes"]',
    );

    expect(button).not.toBeNull();
    await act(async () => button?.click());

    expect(writeText).toHaveBeenCalledWith("active-code-1\nactive-code-2");
    expect(container.textContent).toContain("Copied");
  });

  it("copies one recovery code and reports clipboard failures", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const container = mount([
      { kind: "active", code: "active-code-1" },
      { kind: "active", code: "active-code-2" },
    ]);
    const codeButtons = container.querySelectorAll<HTMLButtonElement>(
      'button[aria-label="Copy code"]',
    );

    await act(async () => codeButtons[1]?.click());
    expect(writeText).toHaveBeenCalledWith("active-code-2");
    expect(container.textContent).toContain("Code copied");

    writeText.mockRejectedValueOnce(new Error("clipboard denied"));
    await act(async () => codeButtons[0]?.click());

    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      "Could not copy the codes",
    );
  });

  it("reports a copy failure when the clipboard API is unavailable", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
    const container = mount([{ kind: "active", code: "active-code" }]);
    const button = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Copy all codes"]',
    );

    await act(async () => button?.click());

    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      "Could not copy the codes",
    );
  });

  it("appends the download link before clicking and revokes its URL later", () => {
    vi.useFakeTimers();
    const createObjectURL = vi.fn().mockReturnValue("blob:recovery-codes");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
    let wasAttachedDuringClick = false;
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      wasAttachedDuringClick = document.body.contains(this);
    });
    const container = mount([{ kind: "active", code: "active-code" }]);
    const button = Array.from(container.querySelectorAll("button")).find((candidate) =>
      candidate.textContent?.includes("Download"),
    );

    expect(button).not.toBeUndefined();
    act(() => button?.click());

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(wasAttachedDuringClick).toBe(true);
    expect(revokeObjectURL).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Downloaded");

    act(() => vi.runAllTimers());
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:recovery-codes");
  });

  it("keeps the download action pending when creating the file fails", () => {
    const createObjectURL = vi.fn(() => {
      throw new Error("blob unavailable");
    });
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    const container = mount([{ kind: "active", code: "active-code" }]);
    const button = Array.from(container.querySelectorAll("button")).find((candidate) =>
      candidate.textContent?.includes("Download"),
    );

    act(() => button?.click());

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain("Download");
    expect(container.textContent).not.toContain("Downloaded");
  });
});
