// src\db\seeds\index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../schema";
import { seedAdminBootstrapDevOnly } from "./04-admin-bootstrap-dev-only";
import { seedCatalogMinimum } from "./02-catalog-minimum";
import { seedCoreLookups } from "./00-core-lookups";
import { seedDemoProjectsOptional } from "./03-demo-projects-optional";
import { seedGeo } from "./01-geo";

export async function runAllSeeds(databaseUrl: string) {
  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client, { schema });

  try {
    await seedCoreLookups(db);
    await seedGeo(db);
    await seedCatalogMinimum(db);
    await seedDemoProjectsOptional(db);
    await seedAdminBootstrapDevOnly(db);
  } finally {
    await client.end();
  }
}
