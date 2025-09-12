import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: '.env.local' });

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL not set. Using default connection.");
  process.env.DATABASE_URL = "postgresql://postgres:Js902273F@localhost:5432/assetlogix";
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
