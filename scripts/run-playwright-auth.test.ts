import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type ExitHandler = (code: number | null, signal: NodeJS.Signals | null) => void;

const spawn = vi.fn();
let exitHandler: ExitHandler | undefined;
let originalArgv: string[];

vi.mock("node:child_process", () => ({ spawn }));

describe("run-playwright-auth", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    exitHandler = undefined;
    originalArgv = [...process.argv];
    process.argv = [...originalArgv, "--project", "chromium"];
    vi.stubEnv("RUN_PLAYWRIGHT_AUTH_TEST", "preserved");

    spawn.mockReturnValue({
      on: vi.fn((_event: string, handler: ExitHandler) => {
        exitHandler = handler;
      }),
    });
  });

  afterEach(() => {
    process.argv = originalArgv;
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("starts Playwright in auth mode and forwards CLI arguments", async () => {
    await import("./run-playwright-auth.mjs");

    expect(spawn).toHaveBeenCalledWith(
      "pnpm",
      ["exec", "playwright", "test", "--project", "chromium"],
      {
        env: expect.objectContaining({
          PLAYWRIGHT_AUTH: "1",
          RUN_PLAYWRIGHT_AUTH_TEST: "preserved",
        }),
        stdio: "inherit",
      },
    );
  });

  it("forwards a child exit code", async () => {
    const processExit = vi
      .spyOn(process, "exit")
      .mockImplementation((() => undefined) as never);

    await import("./run-playwright-auth.mjs");
    exitHandler?.(7, null);

    expect(processExit).toHaveBeenCalledWith(7);
  });

  it("uses a failure exit code when the child exits without a code", async () => {
    const processExit = vi
      .spyOn(process, "exit")
      .mockImplementation((() => undefined) as never);

    await import("./run-playwright-auth.mjs");
    exitHandler?.(null, null);

    expect(processExit).toHaveBeenCalledWith(1);
  });

  it("forwards child termination signals to the wrapper process", async () => {
    const processKill = vi.spyOn(process, "kill").mockImplementation(() => true);
    const processExit = vi
      .spyOn(process, "exit")
      .mockImplementation((() => undefined) as never);

    await import("./run-playwright-auth.mjs");
    exitHandler?.(null, "SIGTERM");

    expect(processKill).toHaveBeenCalledWith(process.pid, "SIGTERM");
    expect(processExit).not.toHaveBeenCalled();
  });
});
