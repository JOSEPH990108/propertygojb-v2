// src\db\schema\relations.ts
import { relations } from "drizzle-orm";
import {
  developers,
  projectAmenities,
  projectLayouts,
  projectMedia,
  projectNearbyPlaces,
  projectPhases,
  projects,
  projectTags,
  projectTowers,
} from "./catalog";
import { areas, regions, states } from "./geo";
import { account, roles, session, user } from "./identity-auth";
import { pricingSnapshots, units } from "./inventory";
import { amenities, bookingStatuses, tags } from "./lookups";

export const stateRelations = relations(states, ({ many }) => ({
  regions: many(regions),
}));

export const regionRelations = relations(regions, ({ one, many }) => ({
  state: one(states, { fields: [regions.stateId], references: [states.id] }),
  areas: many(areas),
  projects: many(projects),
}));

export const areaRelations = relations(areas, ({ one, many }) => ({
  region: one(regions, { fields: [areas.regionId], references: [regions.id] }),
  projects: many(projects),
}));

export const roleRelations = relations(roles, ({ many }) => ({
  users: many(user),
}));

export const userRelations = relations(user, ({ one, many }) => ({
  role: one(roles, { fields: [user.roleId], references: [roles.id] }),
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const developerRelations = relations(developers, ({ many }) => ({
  projects: many(projects),
}));

export const projectRelations = relations(projects, ({ one, many }) => ({
  developer: one(developers, {
    fields: [projects.developerId],
    references: [developers.id],
  }),
  region: one(regions, {
    fields: [projects.regionId],
    references: [regions.id],
  }),
  area: one(areas, { fields: [projects.areaId], references: [areas.id] }),
  layouts: many(projectLayouts),
  phases: many(projectPhases),
  towers: many(projectTowers),
  units: many(units),
  pricingSnapshots: many(pricingSnapshots),
  media: many(projectMedia),
  nearbyPlaces: many(projectNearbyPlaces),
  amenities: many(projectAmenities),
  tags: many(projectTags),
}));

export const projectLayoutRelations = relations(
  projectLayouts,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [projectLayouts.projectId],
      references: [projects.id],
    }),
    units: many(units),
    pricingSnapshots: many(pricingSnapshots),
  }),
);

export const projectPhaseRelations = relations(
  projectPhases,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [projectPhases.projectId],
      references: [projects.id],
    }),
    towers: many(projectTowers),
    units: many(units),
    pricingSnapshots: many(pricingSnapshots),
  }),
);

export const projectTowerRelations = relations(
  projectTowers,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [projectTowers.projectId],
      references: [projects.id],
    }),
    phase: one(projectPhases, {
      fields: [projectTowers.phaseId],
      references: [projectPhases.id],
    }),
    units: many(units),
    pricingSnapshots: many(pricingSnapshots),
  }),
);

export const projectMediaRelations = relations(projectMedia, ({ one }) => ({
  project: one(projects, {
    fields: [projectMedia.projectId],
    references: [projects.id],
  }),
}));

export const projectNearbyPlacesRelations = relations(
  projectNearbyPlaces,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectNearbyPlaces.projectId],
      references: [projects.id],
    }),
  }),
);

export const projectAmenitiesRelations = relations(
  projectAmenities,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectAmenities.projectId],
      references: [projects.id],
    }),
    amenity: one(amenities, {
      fields: [projectAmenities.amenityId],
      references: [amenities.id],
    }),
  }),
);

export const projectTagsRelations = relations(projectTags, ({ one }) => ({
  project: one(projects, {
    fields: [projectTags.projectId],
    references: [projects.id],
  }),
  tag: one(tags, { fields: [projectTags.tagId], references: [tags.id] }),
}));

export const unitRelations = relations(units, ({ one }) => ({
  project: one(projects, {
    fields: [units.projectId],
    references: [projects.id],
  }),
  layout: one(projectLayouts, {
    fields: [units.layoutId],
    references: [projectLayouts.id],
  }),
  tower: one(projectTowers, {
    fields: [units.towerId],
    references: [projectTowers.id],
  }),
  phase: one(projectPhases, {
    fields: [units.phaseId],
    references: [projectPhases.id],
  }),
  bookingStatus: one(bookingStatuses, {
    fields: [units.bookingStatusId],
    references: [bookingStatuses.id],
  }),
}));

export const pricingSnapshotsRelations = relations(
  pricingSnapshots,
  ({ one }) => ({
    project: one(projects, {
      fields: [pricingSnapshots.projectId],
      references: [projects.id],
    }),
    phase: one(projectPhases, {
      fields: [pricingSnapshots.phaseId],
      references: [projectPhases.id],
    }),
    tower: one(projectTowers, {
      fields: [pricingSnapshots.towerId],
      references: [projectTowers.id],
    }),
    layout: one(projectLayouts, {
      fields: [pricingSnapshots.layoutId],
      references: [projectLayouts.id],
    }),
  }),
);
