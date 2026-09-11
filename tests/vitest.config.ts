import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", "dist", "e2e"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    reporters: ["default"],
  },
});
