import { spawn } from "node:child_process";

const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const child = spawn(
  command,
  ["exec", "playwright", "test", ...process.argv.slice(2)],
  {
    env: { ...process.env, PLAYWRIGHT_AUTH: "1" },
    stdio: "inherit",
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
