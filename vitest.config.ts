import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["tests/**", ".next/**", "node_modules/**"],
    server: {
      deps: { inline: ["@ory/nextjs"] },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      reportsDirectory: "./coverage",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
