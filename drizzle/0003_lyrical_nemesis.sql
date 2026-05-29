CREATE TABLE "permission_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "permission_groups_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"code" varchar(120) NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"module_key" varchar(50) NOT NULL,
	"action_key" varchar(50) NOT NULL,
	"resource_key" varchar(80) NOT NULL,
	"risk_level" varchar(20) DEFAULT 'MEDIUM' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "permissions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"role_id" text NOT NULL,
	"permission_id" text NOT NULL,
	"grant_scope" varchar(20) DEFAULT 'ALLOW' NOT NULL,
	"condition_json" jsonb,
	"granted_by_user_id" text,
	"granted_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp,
	"revoked_by_user_id" text,
	"reason_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"permission_id" text NOT NULL,
	"override_scope" varchar(20) NOT NULL,
	"is_temporary" boolean DEFAULT false NOT NULL,
	"effective_from" timestamp,
	"effective_to" timestamp,
	"granted_by_user_id" text,
	"granted_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp,
	"revoked_by_user_id" text,
	"reason_code" varchar(50),
	"reason_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_action_approvals" (
	"id" text PRIMARY KEY NOT NULL,
	"action_type" varchar(50) NOT NULL,
	"target_entity_type" varchar(60) NOT NULL,
	"target_entity_id" text,
	"requested_by_user_id" text NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"dedupe_key" varchar(200) NOT NULL,
	"approved_by_user_id" text,
	"approved_at" timestamp,
	"rejected_by_user_id" text,
	"rejected_at" timestamp,
	"expires_at" timestamp,
	"request_reason" text,
	"decision_reason" text,
	"payload_json" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_user_id" text,
	"actor_role_id" text,
	"action_type" varchar(40) NOT NULL,
	"entity_type" varchar(60) NOT NULL,
	"entity_id" text,
	"request_id" varchar(120),
	"trace_id" varchar(120),
	"before_json" jsonb,
	"after_json" jsonb,
	"change_summary" text,
	"source_app" varchar(30) NOT NULL,
	"ip_address" varchar(64),
	"user_agent" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"event_type" varchar(50) NOT NULL,
	"event_status" varchar(20) NOT NULL,
	"provider_id" varchar(60),
	"session_id" text,
	"account_id" text,
	"risk_level" varchar(20) DEFAULT 'LOW' NOT NULL,
	"failure_reason" text,
	"ip_address" varchar(64),
	"user_agent" text,
	"country_code" varchar(10),
	"source_app" varchar(30) NOT NULL,
	"metadata" jsonb,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flag_overrides" (
	"id" text PRIMARY KEY NOT NULL,
	"feature_flag_id" text NOT NULL,
	"role_id" text,
	"user_id" text,
	"override_enabled" boolean NOT NULL,
	"effective_from" timestamp,
	"effective_to" timestamp,
	"updated_by_user_id" text,
	"reason_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feature_flag_overrides_role_user_xor_check" CHECK (("feature_flag_overrides"."role_id" is not null and "feature_flag_overrides"."user_id" is null) or ("feature_flag_overrides"."role_id" is null and "feature_flag_overrides"."user_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" text PRIMARY KEY NOT NULL,
	"key" varchar(120) NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"category" varchar(50),
	"is_enabled" boolean DEFAULT false NOT NULL,
	"environment" varchar(20) NOT NULL,
	"rollout_mode" varchar(30) DEFAULT 'GLOBAL' NOT NULL,
	"rollout_percentage" integer,
	"prerequisites_json" jsonb,
	"sunset_at" timestamp,
	"updated_by_user_id" text,
	"change_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"key" varchar(120) NOT NULL,
	"value_json" jsonb NOT NULL,
	"value_type" varchar(20) NOT NULL,
	"category" varchar(50) NOT NULL,
	"environment" varchar(20) NOT NULL,
	"is_secret" boolean DEFAULT false NOT NULL,
	"is_read_only" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_by_user_id" text,
	"change_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_group_id_permission_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."permission_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_granted_by_user_id_users_id_fk" FOREIGN KEY ("granted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_revoked_by_user_id_users_id_fk" FOREIGN KEY ("revoked_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_granted_by_user_id_users_id_fk" FOREIGN KEY ("granted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_revoked_by_user_id_users_id_fk" FOREIGN KEY ("revoked_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_action_approvals" ADD CONSTRAINT "admin_action_approvals_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_action_approvals" ADD CONSTRAINT "admin_action_approvals_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_action_approvals" ADD CONSTRAINT "admin_action_approvals_rejected_by_user_id_users_id_fk" FOREIGN KEY ("rejected_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_role_id_roles_id_fk" FOREIGN KEY ("actor_role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_audit_logs" ADD CONSTRAINT "auth_audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_audit_logs" ADD CONSTRAINT "auth_audit_logs_session_id_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."session"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_audit_logs" ADD CONSTRAINT "auth_audit_logs_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flag_overrides" ADD CONSTRAINT "feature_flag_overrides_feature_flag_id_feature_flags_id_fk" FOREIGN KEY ("feature_flag_id") REFERENCES "public"."feature_flags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flag_overrides" ADD CONSTRAINT "feature_flag_overrides_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flag_overrides" ADD CONSTRAINT "feature_flag_overrides_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flag_overrides" ADD CONSTRAINT "feature_flag_overrides_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flags" ADD CONSTRAINT "feature_flags_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "permission_groups_active_sort_idx" ON "permission_groups" USING btree ("is_active","sort_order");--> statement-breakpoint
CREATE INDEX "permissions_module_action_active_idx" ON "permissions" USING btree ("module_key","action_key","is_active");--> statement-breakpoint
CREATE INDEX "permissions_group_active_idx" ON "permissions" USING btree ("group_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "role_permissions_active_role_permission_uniq" ON "role_permissions" USING btree ("role_id","permission_id") WHERE "role_permissions"."revoked_at" is null;--> statement-breakpoint
CREATE INDEX "role_permissions_role_revoked_idx" ON "role_permissions" USING btree ("role_id","revoked_at");--> statement-breakpoint
CREATE INDEX "role_permissions_permission_revoked_idx" ON "role_permissions" USING btree ("permission_id","revoked_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_permissions_active_user_permission_uniq" ON "user_permissions" USING btree ("user_id","permission_id") WHERE "user_permissions"."revoked_at" is null;--> statement-breakpoint
CREATE INDEX "user_permissions_user_effective_idx" ON "user_permissions" USING btree ("user_id","effective_to");--> statement-breakpoint
CREATE INDEX "user_permissions_permission_effective_idx" ON "user_permissions" USING btree ("permission_id","effective_to");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_action_approvals_pending_dedupe_uniq" ON "admin_action_approvals" USING btree ("dedupe_key") WHERE "admin_action_approvals"."status" = 'PENDING';--> statement-breakpoint
CREATE INDEX "admin_action_approvals_status_requested_idx" ON "admin_action_approvals" USING btree ("status","requested_at");--> statement-breakpoint
CREATE INDEX "admin_action_approvals_requested_by_status_idx" ON "admin_action_approvals" USING btree ("requested_by_user_id","status");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_created_idx" ON "audit_logs" USING btree ("entity_type","entity_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_created_idx" ON "audit_logs" USING btree ("actor_user_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_action_created_idx" ON "audit_logs" USING btree ("action_type","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_source_created_idx" ON "audit_logs" USING btree ("source_app","created_at");--> statement-breakpoint
CREATE INDEX "auth_audit_logs_user_occurred_idx" ON "auth_audit_logs" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "auth_audit_logs_event_occurred_idx" ON "auth_audit_logs" USING btree ("event_type","occurred_at");--> statement-breakpoint
CREATE INDEX "auth_audit_logs_status_occurred_idx" ON "auth_audit_logs" USING btree ("event_status","occurred_at");--> statement-breakpoint
CREATE INDEX "auth_audit_logs_risk_occurred_idx" ON "auth_audit_logs" USING btree ("risk_level","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "feature_flag_overrides_active_role_uniq" ON "feature_flag_overrides" USING btree ("feature_flag_id","role_id") WHERE "feature_flag_overrides"."role_id" is not null and "feature_flag_overrides"."effective_to" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "feature_flag_overrides_active_user_uniq" ON "feature_flag_overrides" USING btree ("feature_flag_id","user_id") WHERE "feature_flag_overrides"."user_id" is not null and "feature_flag_overrides"."effective_to" is null;--> statement-breakpoint
CREATE INDEX "feature_flag_overrides_flag_effective_to_idx" ON "feature_flag_overrides" USING btree ("feature_flag_id","effective_to");--> statement-breakpoint
CREATE UNIQUE INDEX "feature_flags_active_key_env_uniq" ON "feature_flags" USING btree ("key","environment") WHERE "feature_flags"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "feature_flags_env_enabled_idx" ON "feature_flags" USING btree ("environment","is_enabled");--> statement-breakpoint
CREATE INDEX "feature_flags_category_env_idx" ON "feature_flags" USING btree ("category","environment");--> statement-breakpoint
CREATE UNIQUE INDEX "system_settings_active_key_env_uniq" ON "system_settings" USING btree ("key","environment") WHERE "system_settings"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "system_settings_category_env_active_idx" ON "system_settings" USING btree ("category","environment","is_active");