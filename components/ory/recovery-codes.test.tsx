import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { RecoveryCodes } from "./recovery-codes";

describe("RecoveryCodes", () => {
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
    expect(markup).toContain("1 active codes");
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
});
