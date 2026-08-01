import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["tests/**", ".next/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      reportsDirectory: "./coverage",
    },
  },
});
