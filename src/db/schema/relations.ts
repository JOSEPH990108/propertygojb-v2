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
import {
  inquiries,
  leadActivities,
  leadAssignments,
  leadSources,
  leads,
  leadStatusHistory,
} from "./crm-leads";
import { areas, regions, states } from "./geo";
import { account, roles, session, user } from "./identity-auth";
import { pricingSnapshots, units } from "./inventory";
import {
  amenities,
  bookingStatuses,
  propertyCategories,
  propertyTypes,
  tags,
} from "./lookups";
import {
  whatsappAgentQueueMembers,
  whatsappAgentQueues,
  whatsappAssignmentRules,
  whatsappConversations,
  whatsappDeliveryEvents,
  whatsappMessages,
  whatsappWebhookEvents,
} from "./whatsapp-routing";

export const stateRelations = relations(states, ({ many }) => ({
  regions: many(regions),
}));

export const regionRelations = relations(regions, ({ one, many }) => ({
  state: one(states, { fields: [regions.stateId], references: [states.id] }),
  areas: many(areas),
  projects: many(projects),
  preferredLeads: many(leads),
  routingQueues: many(whatsappAgentQueues),
  routingRules: many(whatsappAssignmentRules),
}));

export const areaRelations = relations(areas, ({ one, many }) => ({
  region: one(regions, { fields: [areas.regionId], references: [regions.id] }),
  projects: many(projects),
  preferredLeads: many(leads),
  routingQueues: many(whatsappAgentQueues),
  routingRules: many(whatsappAssignmentRules),
}));

export const roleRelations = relations(roles, ({ many }) => ({
  users: many(user),
}));

export const userRelations = relations(user, ({ one, many }) => ({
  role: one(roles, { fields: [user.roleId], references: [roles.id] }),
  sessions: many(session),
  accounts: many(account),
  ownedLeads: many(leads),
  assignedLeadAssignments: many(leadAssignments, { relationName: "assignmentTo" }),
  assignmentSources: many(leadAssignments, { relationName: "assignmentFrom" }),
  assignmentActors: many(leadAssignments, { relationName: "assignmentBy" }),
  leadActivities: many(leadActivities),
  leadStatusChanges: many(leadStatusHistory),
  queueMemberships: many(whatsappAgentQueueMembers),
  directAssignmentRules: many(whatsappAssignmentRules),
  ownedConversations: many(whatsappConversations),
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
  inquiries: many(inquiries),
  routingQueues: many(whatsappAgentQueues),
  routingRules: many(whatsappAssignmentRules),
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

export const leadSourceRelations = relations(leadSources, ({ many }) => ({
  leads: many(leads),
  inquiries: many(inquiries),
  assignmentRules: many(whatsappAssignmentRules),
}));

export const leadRelations = relations(leads, ({ one, many }) => ({
  source: one(leadSources, { fields: [leads.sourceId], references: [leadSources.id] }),
  desiredPropertyCategory: one(propertyCategories, {
    fields: [leads.desiredPropertyCategoryId],
    references: [propertyCategories.id],
  }),
  desiredPropertyType: one(propertyTypes, {
    fields: [leads.desiredPropertyTypeId],
    references: [propertyTypes.id],
  }),
  preferredRegion: one(regions, {
    fields: [leads.preferredRegionId],
    references: [regions.id],
  }),
  preferredArea: one(areas, {
    fields: [leads.preferredAreaId],
    references: [areas.id],
  }),
  currentAssignee: one(user, {
    fields: [leads.currentAssigneeUserId],
    references: [user.id],
  }),
  currentQueue: one(whatsappAgentQueues, {
    fields: [leads.currentQueueId],
    references: [whatsappAgentQueues.id],
  }),
  inquiries: many(inquiries),
  assignments: many(leadAssignments),
  activities: many(leadActivities),
  statusHistory: many(leadStatusHistory),
  conversations: many(whatsappConversations),
  messages: many(whatsappMessages),
  webhookEvents: many(whatsappWebhookEvents),
}));

export const inquiryRelations = relations(inquiries, ({ one, many }) => ({
  lead: one(leads, { fields: [inquiries.leadId], references: [leads.id] }),
  source: one(leadSources, {
    fields: [inquiries.sourceId],
    references: [leadSources.id],
  }),
  project: one(projects, { fields: [inquiries.projectId], references: [projects.id] }),
  phase: one(projectPhases, {
    fields: [inquiries.phaseId],
    references: [projectPhases.id],
  }),
  tower: one(projectTowers, {
    fields: [inquiries.towerId],
    references: [projectTowers.id],
  }),
  layout: one(projectLayouts, {
    fields: [inquiries.layoutId],
    references: [projectLayouts.id],
  }),
  unit: one(units, { fields: [inquiries.unitId], references: [units.id] }),
  conversations: many(whatsappConversations),
}));

export const leadAssignmentRelations = relations(
  leadAssignments,
  ({ one, many }) => ({
    lead: one(leads, { fields: [leadAssignments.leadId], references: [leads.id] }),
    fromUser: one(user, {
      relationName: "assignmentFrom",
      fields: [leadAssignments.fromUserId],
      references: [user.id],
    }),
    toUser: one(user, {
      relationName: "assignmentTo",
      fields: [leadAssignments.toUserId],
      references: [user.id],
    }),
    assignedByUser: one(user, {
      relationName: "assignmentBy",
      fields: [leadAssignments.assignedByUserId],
      references: [user.id],
    }),
    queue: one(whatsappAgentQueues, {
      fields: [leadAssignments.queueId],
      references: [whatsappAgentQueues.id],
    }),
    rule: one(whatsappAssignmentRules, {
      fields: [leadAssignments.ruleId],
      references: [whatsappAssignmentRules.id],
    }),
    activities: many(leadActivities),
  }),
);

export const leadActivityRelations = relations(leadActivities, ({ one }) => ({
  lead: one(leads, { fields: [leadActivities.leadId], references: [leads.id] }),
  assignment: one(leadAssignments, {
    fields: [leadActivities.assignmentId],
    references: [leadAssignments.id],
  }),
  actor: one(user, { fields: [leadActivities.actorUserId], references: [user.id] }),
}));

export const leadStatusHistoryRelations = relations(
  leadStatusHistory,
  ({ one }) => ({
    lead: one(leads, {
      fields: [leadStatusHistory.leadId],
      references: [leads.id],
    }),
    changedBy: one(user, {
      fields: [leadStatusHistory.changedByUserId],
      references: [user.id],
    }),
  }),
);

export const whatsappAgentQueueRelations = relations(
  whatsappAgentQueues,
  ({ one, many }) => ({
    region: one(regions, {
      fields: [whatsappAgentQueues.regionId],
      references: [regions.id],
    }),
    area: one(areas, { fields: [whatsappAgentQueues.areaId], references: [areas.id] }),
    project: one(projects, {
      fields: [whatsappAgentQueues.projectId],
      references: [projects.id],
    }),
    members: many(whatsappAgentQueueMembers),
    rules: many(whatsappAssignmentRules),
    fallbackRules: many(whatsappAssignmentRules, {
      relationName: "fallbackQueue",
    }),
    leads: many(leads),
    assignments: many(leadAssignments),
    conversations: many(whatsappConversations),
  }),
);

export const whatsappAgentQueueMemberRelations = relations(
  whatsappAgentQueueMembers,
  ({ one }) => ({
    queue: one(whatsappAgentQueues, {
      fields: [whatsappAgentQueueMembers.queueId],
      references: [whatsappAgentQueues.id],
    }),
    user: one(user, {
      fields: [whatsappAgentQueueMembers.userId],
      references: [user.id],
    }),
  }),
);

export const whatsappAssignmentRuleRelations = relations(
  whatsappAssignmentRules,
  ({ one, many }) => ({
    source: one(leadSources, {
      fields: [whatsappAssignmentRules.matchSourceId],
      references: [leadSources.id],
    }),
    region: one(regions, {
      fields: [whatsappAssignmentRules.matchRegionId],
      references: [regions.id],
    }),
    area: one(areas, {
      fields: [whatsappAssignmentRules.matchAreaId],
      references: [areas.id],
    }),
    project: one(projects, {
      fields: [whatsappAssignmentRules.matchProjectId],
      references: [projects.id],
    }),
    queue: one(whatsappAgentQueues, {
      fields: [whatsappAssignmentRules.queueId],
      references: [whatsappAgentQueues.id],
    }),
    assignToUser: one(user, {
      fields: [whatsappAssignmentRules.assignToUserId],
      references: [user.id],
    }),
    fallbackQueue: one(whatsappAgentQueues, {
      relationName: "fallbackQueue",
      fields: [whatsappAssignmentRules.fallbackQueueId],
      references: [whatsappAgentQueues.id],
    }),
    assignments: many(leadAssignments),
  }),
);

export const whatsappConversationRelations = relations(
  whatsappConversations,
  ({ one, many }) => ({
    lead: one(leads, { fields: [whatsappConversations.leadId], references: [leads.id] }),
    inquiry: one(inquiries, {
      fields: [whatsappConversations.inquiryId],
      references: [inquiries.id],
    }),
    queue: one(whatsappAgentQueues, {
      fields: [whatsappConversations.queueId],
      references: [whatsappAgentQueues.id],
    }),
    ownerUser: one(user, {
      fields: [whatsappConversations.ownerUserId],
      references: [user.id],
    }),
    messages: many(whatsappMessages),
    webhookEvents: many(whatsappWebhookEvents),
  }),
);

export const whatsappMessageRelations = relations(whatsappMessages, ({ one, many }) => ({
  conversation: one(whatsappConversations, {
    fields: [whatsappMessages.conversationId],
    references: [whatsappConversations.id],
  }),
  lead: one(leads, { fields: [whatsappMessages.leadId], references: [leads.id] }),
  webhookEvents: many(whatsappWebhookEvents),
  deliveryEvents: many(whatsappDeliveryEvents),
}));

export const whatsappWebhookEventRelations = relations(
  whatsappWebhookEvents,
  ({ one }) => ({
    conversation: one(whatsappConversations, {
      fields: [whatsappWebhookEvents.conversationId],
      references: [whatsappConversations.id],
    }),
    message: one(whatsappMessages, {
      fields: [whatsappWebhookEvents.messageId],
      references: [whatsappMessages.id],
    }),
    lead: one(leads, { fields: [whatsappWebhookEvents.leadId], references: [leads.id] }),
  }),
);

export const whatsappDeliveryEventRelations = relations(
  whatsappDeliveryEvents,
  ({ one }) => ({
    message: one(whatsappMessages, {
      fields: [whatsappDeliveryEvents.messageId],
      references: [whatsappMessages.id],
    }),
  }),
);
