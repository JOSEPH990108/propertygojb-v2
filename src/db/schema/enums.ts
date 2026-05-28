// src\db\schema\enums.ts
import { pgEnum } from "drizzle-orm/pg-core";

export const fileScanStatusEnum = pgEnum("file_scan_status", [
  "PENDING",
  "CLEAN",
  "INFECTED",
  "ERROR",
]);

export const fileVisibilityScopeEnum = pgEnum("file_visibility_scope", [
  "PUBLIC",
  "INTERNAL",
  "RESTRICTED",
]);

export const PROJECT_NEARBY_PLACE_CATEGORIES = [
  "SHOPPING",
  "EDUCATION",
  "HEALTHCARE",
  "TRANSPORT",
  "RECREATION",
  "POLICE",
  "OTHERS",
] as const;
