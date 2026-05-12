import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
  test: {
    globals: false,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    globalSetup: ["./tests/globalSetup.ts"],
    include: ["tests/**/*.test.ts"],
    sequence: { concurrent: false },
    pool: "forks",
    fileParallelism: false,
    testTimeout: 20_000,
    coverage: {
      provider: "v8",
      reporter: ["text"],
      include: ["app/api/**", "lib/**", "components/**"],
      exclude: ["**/*.test.ts", "tests/**"],
    },
  },
});
