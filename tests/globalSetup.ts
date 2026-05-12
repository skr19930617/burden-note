// Runs once before all test files. Resets the test DB to a known schema.
import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import path from "node:path";

export async function setup() {
  const testDbPath = path.resolve("./prisma/test.db");
  process.env.BURDEN_DATABASE_URL = "file:./prisma/test.db";
  if (existsSync(testDbPath)) unlinkSync(testDbPath);
  execSync("npx prisma db push", {
    env: { ...process.env, BURDEN_DATABASE_URL: "file:./prisma/test.db" },
    stdio: "inherit",
  });
}

export async function teardown() {
  // Leave the file for inspection; cleared on next run anyway.
}
