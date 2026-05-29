CREATE TYPE "public"."lead_status" AS ENUM('NEW', 'UNCONTACTED', 'ASSIGNED', 'CONTACTED', 'QUALIFIED', 'NURTURING', 'APPOINTMENT_SET', 'LOST', 'SPAM', 'CLOSED');--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"lead_id" text NOT NULL,
	"source_id" text NOT NULL,
	"channel" varchar(30) NOT NULL,
	"external_reference" varchar(150),
	"requester_name" varchar(150),
	"requester_phone_e164" varchar(30),
	"requester_phone_normalized" varchar(30),
	"requester_email" varchar(255),
	"project_id" text,
	"phase_id" text,
	"tower_id" text,
	"layout_id" text,
	"unit_id" text,
	"message_text" text,
	"payload" jsonb,
	"received_at" timestamp NOT NULL,
	CONSTRAINT "inquiries_external_reference_unique" UNIQUE("external_reference")
);
--> statement-breakpoint
CREATE TABLE "lead_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"lead_id" text NOT NULL,
	"assignment_id" text,
	"actor_user_id" text,
	"activity_type" varchar(40) NOT NULL,
	"title" varchar(150),
	"body" text,
	"due_at" timestamp,
	"completed_at" timestamp,
	"visibility_scope" varchar(20) DEFAULT 'INTERNAL' NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "lead_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"lead_id" text NOT NULL,
	"from_user_id" text,
	"to_user_id" text,
	"queue_id" text,
	"assigned_by_user_id" text,
	"assignment_type" varchar(30) NOT NULL,
	"reason_code" varchar(50),
	"reason_note" text,
	"rule_id" text,
	"effective_from" timestamp DEFAULT now() NOT NULL,
	"effective_to" timestamp,
	"is_current" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"channel" varchar(30) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"assignment_sla_minutes" integer,
	"first_response_sla_minutes" integer,
	"business_hours_json" jsonb,
	CONSTRAINT "lead_sources_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "lead_status_history" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"lead_id" text NOT NULL,
	"from_status" "lead_status",
	"to_status" "lead_status" NOT NULL,
	"changed_by_user_id" text,
	"changed_at" timestamp DEFAULT now() NOT NULL,
	"reason_code" varchar(50),
	"reason_note" text,
	"source_event_type" varchar(40)
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"source_id" text NOT NULL,
	"full_name" varchar(150),
	"primary_phone_e164" varchar(30) NOT NULL,
	"primary_phone_normalized" varchar(30) NOT NULL,
	"email" varchar(255),
	"preferred_language" varchar(20),
	"nationality" varchar(100),
	"desired_property_category_id" text,
	"desired_property_type_id" text,
	"preferred_region_id" text,
	"preferred_area_id" text,
	"current_status" "lead_status" DEFAULT 'NEW' NOT NULL,
	"current_assignee_user_id" text,
	"current_queue_id" text,
	"first_inquiry_at" timestamp,
	"last_activity_at" timestamp,
	"first_assigned_at" timestamp,
	"first_responded_at" timestamp,
	"assignment_due_at" timestamp,
	"first_response_due_at" timestamp,
	"closed_at" timestamp,
	"closed_reason" varchar(120),
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "whatsapp_agent_queue_members" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"queue_id" text NOT NULL,
	"user_id" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"weight" integer DEFAULT 1 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"max_active_leads" integer,
	"last_assigned_at" timestamp,
	CONSTRAINT "whatsapp_agent_queue_members_queue_id_user_id_unique" UNIQUE("queue_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_agent_queues" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"region_id" text,
	"area_id" text,
	"project_id" text,
	"assignment_strategy" varchar(30) DEFAULT 'ROUND_ROBIN' NOT NULL,
	"max_queue_depth" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "whatsapp_agent_queues_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_assignment_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"name" varchar(120) NOT NULL,
	"priority" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"trigger_channel" varchar(30) DEFAULT 'WHATSAPP' NOT NULL,
	"match_source_id" text,
	"match_region_id" text,
	"match_area_id" text,
	"match_project_id" text,
	"match_language" varchar(20),
	"queue_id" text,
	"assign_to_user_id" text,
	"fallback_queue_id" text,
	"effective_from" timestamp,
	"effective_to" timestamp,
	"stop_processing_after_match" boolean DEFAULT true NOT NULL,
	CONSTRAINT "whatsapp_assignment_rules_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"lead_id" text,
	"inquiry_id" text,
	"provider" varchar(30) NOT NULL,
	"channel_account_id" varchar(100),
	"provider_conversation_id" varchar(120),
	"customer_phone_e164" varchar(30) NOT NULL,
	"customer_phone_normalized" varchar(30) NOT NULL,
	"customer_display_name" varchar(150),
	"queue_id" text,
	"owner_user_id" text,
	"is_open" boolean DEFAULT true NOT NULL,
	"first_inbound_at" timestamp,
	"last_message_at" timestamp,
	"last_inbound_at" timestamp,
	"last_outbound_at" timestamp,
	"closed_at" timestamp,
	"closed_reason" varchar(120)
);
--> statement-breakpoint
CREATE TABLE "whatsapp_delivery_events" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"message_id" text NOT NULL,
	"provider" varchar(30) NOT NULL,
	"provider_event_id" varchar(150),
	"event_type" varchar(40) NOT NULL,
	"event_status" varchar(40) NOT NULL,
	"occurred_at_provider" timestamp,
	"received_at_server" timestamp NOT NULL,
	"error_code" varchar(80),
	"error_detail" text,
	"payload" jsonb
);
--> statement-breakpoint
CREATE TABLE "whatsapp_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"conversation_id" text NOT NULL,
	"lead_id" text,
	"direction" varchar(20) NOT NULL,
	"message_type" varchar(30) NOT NULL,
	"provider_message_id" varchar(120),
	"provider_reply_to_message_id" varchar(120),
	"text_body" text,
	"media_file_id" text,
	"media_mime_type" varchar(100),
	"media_size_bytes" integer,
	"sent_at_provider" timestamp,
	"delivered_at_provider" timestamp,
	"read_at_provider" timestamp,
	"failed_at_provider" timestamp,
	"failure_code" varchar(80),
	"failure_reason" text,
	"payload" jsonb,
	CONSTRAINT "whatsapp_messages_provider_message_id_unique" UNIQUE("provider_message_id")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"provider" varchar(30) NOT NULL,
	"event_type" varchar(80) NOT NULL,
	"event_key" varchar(150) NOT NULL,
	"provider_event_id" varchar(150),
	"occurred_at_provider" timestamp,
	"received_at_server" timestamp NOT NULL,
	"signature_valid" boolean,
	"processing_status" varchar(30) DEFAULT 'RECEIVED' NOT NULL,
	"processing_attempts" integer DEFAULT 0 NOT NULL,
	"processing_error" text,
	"next_retry_at" timestamp,
	"conversation_id" text,
	"message_id" text,
	"lead_id" text,
	"payload" jsonb NOT NULL,
	CONSTRAINT "whatsapp_webhook_events_provider_event_key_unique" UNIQUE("provider","event_key")
);
--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_source_id_lead_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."lead_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_phase_id_project_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."project_phases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_tower_id_project_towers_id_fk" FOREIGN KEY ("tower_id") REFERENCES "public"."project_towers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_layout_id_project_layouts_id_fk" FOREIGN KEY ("layout_id") REFERENCES "public"."project_layouts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_assignment_id_lead_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."lead_assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_assignments" ADD CONSTRAINT "lead_assignments_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_assignments" ADD CONSTRAINT "lead_assignments_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_assignments" ADD CONSTRAINT "lead_assignments_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_assignments" ADD CONSTRAINT "lead_assignments_queue_id_whatsapp_agent_queues_id_fk" FOREIGN KEY ("queue_id") REFERENCES "public"."whatsapp_agent_queues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_assignments" ADD CONSTRAINT "lead_assignments_assigned_by_user_id_users_id_fk" FOREIGN KEY ("assigned_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_assignments" ADD CONSTRAINT "lead_assignments_rule_id_whatsapp_assignment_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."whatsapp_assignment_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_status_history" ADD CONSTRAINT "lead_status_history_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_status_history" ADD CONSTRAINT "lead_status_history_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_source_id_lead_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."lead_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_desired_property_category_id_property_categories_id_fk" FOREIGN KEY ("desired_property_category_id") REFERENCES "public"."property_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_desired_property_type_id_property_types_id_fk" FOREIGN KEY ("desired_property_type_id") REFERENCES "public"."property_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_preferred_region_id_regions_id_fk" FOREIGN KEY ("preferred_region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_preferred_area_id_areas_id_fk" FOREIGN KEY ("preferred_area_id") REFERENCES "public"."areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_current_assignee_user_id_users_id_fk" FOREIGN KEY ("current_assignee_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_current_queue_id_whatsapp_agent_queues_id_fk" FOREIGN KEY ("current_queue_id") REFERENCES "public"."whatsapp_agent_queues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_agent_queue_members" ADD CONSTRAINT "whatsapp_agent_queue_members_queue_id_whatsapp_agent_queues_id_fk" FOREIGN KEY ("queue_id") REFERENCES "public"."whatsapp_agent_queues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_agent_queue_members" ADD CONSTRAINT "whatsapp_agent_queue_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_agent_queues" ADD CONSTRAINT "whatsapp_agent_queues_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_agent_queues" ADD CONSTRAINT "whatsapp_agent_queues_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_agent_queues" ADD CONSTRAINT "whatsapp_agent_queues_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_assignment_rules" ADD CONSTRAINT "whatsapp_assignment_rules_match_source_id_lead_sources_id_fk" FOREIGN KEY ("match_source_id") REFERENCES "public"."lead_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_assignment_rules" ADD CONSTRAINT "whatsapp_assignment_rules_match_region_id_regions_id_fk" FOREIGN KEY ("match_region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_assignment_rules" ADD CONSTRAINT "whatsapp_assignment_rules_match_area_id_areas_id_fk" FOREIGN KEY ("match_area_id") REFERENCES "public"."areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_assignment_rules" ADD CONSTRAINT "whatsapp_assignment_rules_match_project_id_projects_id_fk" FOREIGN KEY ("match_project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_assignment_rules" ADD CONSTRAINT "whatsapp_assignment_rules_queue_id_whatsapp_agent_queues_id_fk" FOREIGN KEY ("queue_id") REFERENCES "public"."whatsapp_agent_queues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_assignment_rules" ADD CONSTRAINT "whatsapp_assignment_rules_assign_to_user_id_users_id_fk" FOREIGN KEY ("assign_to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_assignment_rules" ADD CONSTRAINT "whatsapp_assignment_rules_fallback_queue_id_whatsapp_agent_queues_id_fk" FOREIGN KEY ("fallback_queue_id") REFERENCES "public"."whatsapp_agent_queues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_inquiry_id_inquiries_id_fk" FOREIGN KEY ("inquiry_id") REFERENCES "public"."inquiries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_queue_id_whatsapp_agent_queues_id_fk" FOREIGN KEY ("queue_id") REFERENCES "public"."whatsapp_agent_queues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_delivery_events" ADD CONSTRAINT "whatsapp_delivery_events_message_id_whatsapp_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."whatsapp_messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_conversation_id_whatsapp_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."whatsapp_conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_media_file_id_files_id_fk" FOREIGN KEY ("media_file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_webhook_events" ADD CONSTRAINT "whatsapp_webhook_events_conversation_id_whatsapp_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."whatsapp_conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_webhook_events" ADD CONSTRAINT "whatsapp_webhook_events_message_id_whatsapp_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."whatsapp_messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_webhook_events" ADD CONSTRAINT "whatsapp_webhook_events_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inquiries_lead_received_idx" ON "inquiries" USING btree ("lead_id","received_at");--> statement-breakpoint
CREATE INDEX "inquiries_project_received_idx" ON "inquiries" USING btree ("project_id","received_at");--> statement-breakpoint
CREATE INDEX "lead_activities_lead_created_idx" ON "lead_activities" USING btree ("lead_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "lead_assignments_current_uniq" ON "lead_assignments" USING btree ("lead_id") WHERE "lead_assignments"."is_current" = true;--> statement-breakpoint
CREATE INDEX "lead_assignments_lead_effective_from_idx" ON "lead_assignments" USING btree ("lead_id","effective_from");--> statement-breakpoint
CREATE INDEX "lead_assignments_to_user_current_idx" ON "lead_assignments" USING btree ("to_user_id","is_current");--> statement-breakpoint
CREATE INDEX "lead_sources_channel_idx" ON "lead_sources" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "lead_sources_priority_idx" ON "lead_sources" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "lead_status_history_lead_changed_at_idx" ON "lead_status_history" USING btree ("lead_id","changed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "leads_phone_normalized_active_uniq" ON "leads" USING btree ("primary_phone_normalized") WHERE "leads"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "leads_source_idx" ON "leads" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "leads_status_updated_idx" ON "leads" USING btree ("current_status","updated_at");--> statement-breakpoint
CREATE INDEX "leads_assignee_status_idx" ON "leads" USING btree ("current_assignee_user_id","current_status");--> statement-breakpoint
CREATE INDEX "leads_queue_status_idx" ON "leads" USING btree ("current_queue_id","current_status");--> statement-breakpoint
CREATE INDEX "whatsapp_queue_members_queue_active_idx" ON "whatsapp_agent_queue_members" USING btree ("queue_id","is_active");--> statement-breakpoint
CREATE INDEX "whatsapp_queue_members_user_active_idx" ON "whatsapp_agent_queue_members" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX "whatsapp_queue_members_last_assigned_at_idx" ON "whatsapp_agent_queue_members" USING btree ("last_assigned_at");--> statement-breakpoint
CREATE INDEX "whatsapp_agent_queues_active_strategy_idx" ON "whatsapp_agent_queues" USING btree ("is_active","assignment_strategy");--> statement-breakpoint
CREATE INDEX "whatsapp_assignment_rules_active_priority_idx" ON "whatsapp_assignment_rules" USING btree ("is_active","priority");--> statement-breakpoint
CREATE UNIQUE INDEX "whatsapp_conversations_open_provider_phone_uniq" ON "whatsapp_conversations" USING btree ("provider","customer_phone_normalized") WHERE "whatsapp_conversations"."is_open" = true;--> statement-breakpoint
CREATE INDEX "whatsapp_conversations_lead_open_idx" ON "whatsapp_conversations" USING btree ("lead_id","is_open");--> statement-breakpoint
CREATE INDEX "whatsapp_conversations_owner_open_idx" ON "whatsapp_conversations" USING btree ("owner_user_id","is_open");--> statement-breakpoint
CREATE UNIQUE INDEX "whatsapp_delivery_events_message_provider_event_uniq" ON "whatsapp_delivery_events" USING btree ("message_id","provider_event_id") WHERE "whatsapp_delivery_events"."provider_event_id" is not null;--> statement-breakpoint
CREATE INDEX "whatsapp_delivery_events_message_created_idx" ON "whatsapp_delivery_events" USING btree ("message_id","created_at");--> statement-breakpoint
CREATE INDEX "whatsapp_messages_conversation_created_idx" ON "whatsapp_messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "whatsapp_messages_lead_created_idx" ON "whatsapp_messages" USING btree ("lead_id","created_at");--> statement-breakpoint
CREATE INDEX "whatsapp_webhook_events_processing_received_idx" ON "whatsapp_webhook_events" USING btree ("processing_status","received_at_server");--> statement-breakpoint
CREATE INDEX "whatsapp_webhook_events_next_retry_idx" ON "whatsapp_webhook_events" USING btree ("next_retry_at");