import { describe, expect, it, vi } from "vitest";

const existsSync = vi.fn((path: string) => path.endsWith("static"));
const cpSync = vi.fn();

vi.mock("node:fs", () => ({ cpSync, existsSync }));
vi.mock("node:path", () => ({ resolve: (root: string, path: string) => `${root}/${path}` }));

describe("prepare-standalone", () => {
  it("copies existing static assets and skips missing public assets", async () => {
    vi.resetModules();
    await import("./prepare-standalone.mjs");

    expect(existsSync).toHaveBeenCalledTimes(2);
    expect(cpSync).toHaveBeenCalledTimes(1);
    expect(cpSync).toHaveBeenCalledWith(
      `${process.cwd()}/.next/static`,
      `${process.cwd()}/.next/standalone/.next/static`,
      { force: true, recursive: true },
    );
  });
});
