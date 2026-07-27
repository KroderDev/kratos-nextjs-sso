import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["tests/**", ".next/**", "node_modules/**"],
  },
});
