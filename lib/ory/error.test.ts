import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FlowError } from "@ory/client-fetch";

vi.mock("@/ory.config", () => ({ orySdkUrl: "https://ory.example.com" }));
vi.mock("@/lib/ory/flow", async () => import("./flow"));

import { getOryFlowErrorMessage } from "./error";

describe("Ory flow error helpers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("extracts the first safe message field", () => {
    expect(
      getOryFlowErrorMessage({
        error: { message: "  Check your details. " },
      } as FlowError),
    ).toBe("Check your details.");
    expect(
      getOryFlowErrorMessage({
        error: { reason: "Use another credential." },
      } as FlowError),
    ).toBe("Use another credential.");
  });

  it("rejects provider references and malformed payloads", () => {
    expect(
      getOryFlowErrorMessage({
        error: { message: "Kratos returned an error." },
      } as FlowError),
    ).toBeNull();
    expect(getOryFlowErrorMessage(null)).toBeNull();
    expect(
      getOryFlowErrorMessage({ error: "not-an-object" } as unknown as FlowError),
    ).toBeNull();
  });

  it("falls back to safe lower-priority field when higher-priority field is unsafe", () => {
    expect(
      getOryFlowErrorMessage({
        error: {
          message: "Kratos returned an error.",
          reason: "Invalid credentials provided.",
        },
      } as FlowError),
    ).toBe("Invalid credentials provided.");
  });
});
