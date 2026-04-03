import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL ?? "file:./data/russian-accelerator.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
