// src\db\seeds\00-core-lookups.ts
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../schema";

type DB = PostgresJsDatabase<typeof schema>;

export async function seedCoreLookups(db: DB) {
  await db
    .insert(schema.roles)
    .values([
      { code: "SUPER_ADMIN", name: "Super Admin" },
      { code: "ADMIN", name: "Admin" },
      { code: "AGENT", name: "Agent" },
      { code: "CUSTOMER", name: "Customer" },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.propertyCategories)
    .values([
      { code: "LANDED", name: "Landed" },
      { code: "HIGH_RISE", name: "High Rise" },
      { code: "COMMERCIAL", name: "Commercial" },
    ])
    .onConflictDoNothing();

  const categories = await db.query.propertyCategories.findMany();
  const categoryByCode = new Map(categories.map((row) => [row.code, row.id]));

  const propertyTypesToSeed = [
    {
      code: "CONDO",
      slug: "condominium",
      name: "Condominium",
      categoryCode: "HIGH_RISE",
    },
    {
      code: "SERVICED_APT",
      slug: "serviced-apartment",
      name: "Serviced Apartment",
      categoryCode: "HIGH_RISE",
    },
    {
      code: "TERRACE",
      slug: "terrace-house",
      name: "Terrace House",
      categoryCode: "LANDED",
    },
    {
      code: "CLUSTER",
      slug: "cluster-home",
      name: "Cluster Home",
      categoryCode: "LANDED",
    },
  ] as const;

  for (const type of propertyTypesToSeed) {
    const categoryId = categoryByCode.get(type.categoryCode);
    if (!categoryId) {
      continue;
    }

    await db
      .insert(schema.propertyTypes)
      .values({
        code: type.code,
        slug: type.slug,
        name: type.name,
        categoryId,
      })
      .onConflictDoUpdate({
        target: schema.propertyTypes.slug,
        set: {
          code: type.code,
          name: type.name,
          categoryId,
        },
      });
  }

  await db
    .insert(schema.projectStatuses)
    .values([
      { code: "NEW_LAUNCH", name: "New Launch" },
      { code: "UNDER_CONSTRUCTION", name: "Under Construction" },
      { code: "COMPLETED", name: "Completed" },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.constructionStatuses)
    .values([
      { code: "NOT_STARTED", name: "Not Started" },
      { code: "IN_PROGRESS", name: "In Progress" },
      { code: "COMPLETED", name: "Completed" },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.bookingStatuses)
    .values([
      { code: "AVAILABLE", name: "Available" },
      { code: "RESERVED", name: "Reserved" },
      { code: "SOLD", name: "Sold" },
      { code: "CANCELLED", name: "Cancelled" },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.tenureTypes)
    .values([
      { code: "FREEHOLD", name: "Freehold" },
      { code: "LEASEHOLD_99", name: "Leasehold 99" },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.titleTypes)
    .values([
      { code: "INDIVIDUAL", name: "Individual" },
      { code: "STRATA", name: "Strata" },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.lotTypes)
    .values([
      { code: "BUMIPUTERA", name: "Bumiputera" },
      { code: "NON_BUMIPUTERA", name: "Non-Bumiputera" },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.unitPositions)
    .values([
      { code: "INTER", name: "Intermediate" },
      { code: "COR", name: "Corner" },
      { code: "END", name: "End" },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.buyerTypes)
    .values([
      { code: "MALAYSIAN", name: "Malaysian" },
      { code: "FOREIGNER", name: "Foreigner" },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.mediaTypes)
    .values([
      { code: "IMAGE", name: "Image" },
      { code: "VIDEO", name: "Video" },
      { code: "DOCUMENT", name: "Document" },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.layoutTypes)
    .values([
      { code: "STANDARD", name: "Standard" },
      { code: "DUPLEX", name: "Duplex" },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.amenities)
    .values([
      { slug: "swimming-pool", name: "Swimming Pool" },
      { slug: "gym", name: "Gym" },
      { slug: "playground", name: "Playground" },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.tags)
    .values([
      { slug: "new-launch", name: "New Launch" },
      { slug: "near-ciq", name: "Near CIQ" },
    ])
    .onConflictDoNothing();
}
