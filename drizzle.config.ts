import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Cargar variables de entorno desde .env.local
config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
