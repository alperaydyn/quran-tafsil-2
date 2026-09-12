import { defineConfig } from "vitest/config";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../tafsil-web-app/src"),
    },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", "dist", "e2e"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    reporters: ["default"],
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
