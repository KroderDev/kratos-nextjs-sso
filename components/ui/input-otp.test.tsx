import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "./input-otp";

describe("input OTP primitives", () => {
  it("renders slots without context and a separator", () => {
    const markup = renderToStaticMarkup(
      <InputOTP maxLength={2} value="" onChange={() => {}}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSeparator />
          <InputOTPSlot className="custom-slot" index={1} />
        </InputOTPGroup>
      </InputOTP>,
    );

    expect(markup).toContain('data-slot="input-otp-group"');
    expect(markup).toContain('data-slot="input-otp-slot"');
    expect(markup).toContain('data-slot="input-otp-separator"');
    expect(markup).toContain('role="separator"');
    expect(markup).toContain("custom-slot");
  });
});
