import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "drizzle-kit";

const rootDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  schema: path.join(rootDirectory, "packages/db/src/schema.ts"),
  out: path.join(rootDirectory, "db/migrations"),
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/character_factory"
  },
  verbose: true,
  strict: true
});
