import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const { slots } = vi.hoisted(() => ({
  slots: [
    { char: "1", hasFakeCaret: true, isActive: true },
    { char: "", hasFakeCaret: false, isActive: false },
  ],
}));

vi.mock("input-otp", () => {
  const context = React.createContext<{ slots: typeof slots } | undefined>(undefined);
  return {
    OTPInput: ({ children, ...props }: { children?: React.ReactNode }) => (
      <context.Provider value={{ slots }}>
        <div {...props}>{children}</div>
      </context.Provider>
    ),
    OTPInputContext: context,
  };
});

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "./input-otp";

describe("input OTP primitives with slot context", () => {
  it("renders slot characters and fake caret state", () => {
    const markup = renderToStaticMarkup(
      <InputOTP maxLength={2}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSeparator />
        </InputOTPGroup>
      </InputOTP>,
    );

    expect(markup).toContain(">1<");
    expect(markup).toContain("animate-caret-blink");
    expect(markup).toContain('data-slot="input-otp-separator"');
  });

  it("renders a slot without an OTP context", () => {
    const markup = renderToStaticMarkup(<InputOTPSlot index={0} />);

    expect(markup).toContain('data-slot="input-otp-slot"');
    expect(markup).not.toContain("animate-caret-blink");
  });
});
