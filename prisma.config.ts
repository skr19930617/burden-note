// Prisma 7 config — datasource URL lives here instead of schema.prisma.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("BURDEN_DATABASE_URL"),
  },
});
