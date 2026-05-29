// src\db\seeds\01-geo.ts
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../schema";

type DB = PostgresJsDatabase<typeof schema>;

export async function seedGeo(db: DB) {
  await db
    .insert(schema.states)
    .values({
      name: "Johor",
      slug: "johor",
      country: "Malaysia",
    })
    .onConflictDoUpdate({
      target: schema.states.slug,
      set: {
        name: "Johor",
        country: "Malaysia",
      },
    });

  const johor = await db.query.states.findFirst({
    where: (states, { eq: eqOp }) => eqOp(states.slug, "johor"),
  });

  if (!johor) {
    return;
  }

  const regionSeeds = [
    {
      stateId: johor.id,
      name: "Johor Bahru City Centre",
      slug: "jb-city-centre",
    },
    {
      stateId: johor.id,
      name: "Iskandar Puteri",
      slug: "iskandar-puteri",
    },
  ];

  for (const regionSeed of regionSeeds) {
    await db
      .insert(schema.regions)
      .values(regionSeed)
      .onConflictDoUpdate({
        target: [schema.regions.stateId, schema.regions.slug],
        set: {
          name: regionSeed.name,
        },
      });
  }

  const regions = await db.query.regions.findMany({
    where: (regionsTable, { eq: eqOp }) => eqOp(regionsTable.stateId, johor.id),
  });

  const regionMap = new Map(regions.map((region) => [region.slug, region.id]));

  const jbRegionId = regionMap.get("jb-city-centre");
  const iskandarRegionId = regionMap.get("iskandar-puteri");

  if (jbRegionId) {
    const jbAreas = [
      { regionId: jbRegionId, name: "Danga Bay", slug: "danga-bay" },
      { regionId: jbRegionId, name: "Bukit Chagar", slug: "bukit-chagar" },
    ];

    for (const areaSeed of jbAreas) {
      await db
        .insert(schema.areas)
        .values(areaSeed)
        .onConflictDoUpdate({
          target: [schema.areas.regionId, schema.areas.slug],
          set: {
            name: areaSeed.name,
          },
        });
    }
  }

  if (iskandarRegionId) {
    const iskandarAreas = [
      { regionId: iskandarRegionId, name: "Medini", slug: "medini" },
      {
        regionId: iskandarRegionId,
        name: "Puteri Harbour",
        slug: "puteri-harbour",
      },
    ];

    for (const areaSeed of iskandarAreas) {
      await db
        .insert(schema.areas)
        .values(areaSeed)
        .onConflictDoUpdate({
          target: [schema.areas.regionId, schema.areas.slug],
          set: {
            name: areaSeed.name,
          },
        });
    }
  }
}
