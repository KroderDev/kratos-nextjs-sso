import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FlowError } from "@ory/client-fetch";

const { mockGetFlowError } = vi.hoisted(() => ({
  mockGetFlowError: vi.fn(),
}));

vi.mock("@ory/client-fetch", async () => {
  const actual = await vi.importActual<typeof import("@ory/client-fetch")>("@ory/client-fetch");
  return {
    ...actual,
    FrontendApi: class {
      getFlowError = mockGetFlowError;
    },
  };
});

vi.mock("@/ory.config", () => ({ orySdkUrl: "https://ory.example.com" }));
vi.mock("@/lib/ory/flow", async () => import("./flow"));

import {
  getKnownOryErrorMessage,
  getOryFlowError,
  getOryFlowErrorMessage,
} from "./error";

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

  it("maps only known UI error reasons to localized messages", () => {
    const translate = (key: string) => `translated:${key}`;

    expect(getKnownOryErrorMessage("registration_disabled", translate)).toBe(
      "translated:auth.error.registrationDisabled",
    );
    expect(getKnownOryErrorMessage("unknown_reason", translate)).toBeNull();
    expect(getKnownOryErrorMessage(undefined, translate)).toBeNull();
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

  it("returns null when getOryFlowError is called with an empty id", async () => {
    const result = await getOryFlowError("");
    expect(result).toBeNull();
    expect(mockGetFlowError).not.toHaveBeenCalled();
  });

  it("fetches flow error successfully when id is provided", async () => {
    const mockErrorPayload: FlowError = {
      id: "err-123",
      error: { message: "Access denied" },
    };
    mockGetFlowError.mockResolvedValueOnce(mockErrorPayload);

    const result = await getOryFlowError("err-123");
    expect(result).toEqual(mockErrorPayload);
    expect(mockGetFlowError).toHaveBeenCalledWith({ id: "err-123" });
  });

  it("returns null when getOryFlowError catches an API exception", async () => {
    mockGetFlowError.mockRejectedValueOnce(new Error("Network failure"));

    const result = await getOryFlowError("err-123");
    expect(result).toBeNull();
  });
});
