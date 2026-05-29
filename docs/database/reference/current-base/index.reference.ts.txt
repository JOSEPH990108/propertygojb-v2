// src\db\index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const createDatabase = () => {
  const queryClient = postgres(process.env.DATABASE_URL!, { max: 10 });
  return drizzle(queryClient, { schema });
};

type Database = ReturnType<typeof createDatabase>;

let db: Database;

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL is not set. Using mock DB mode.");
  db = {} as Database;
} else {
  db = createDatabase();
}

export { db };
export * from "./schema";
