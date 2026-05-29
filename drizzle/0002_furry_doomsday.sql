CREATE TYPE "public"."booking_status" AS ENUM('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'PAYMENT_PENDING', 'PAYMENT_VERIFIED', 'DOCS_PENDING', 'DOCS_VERIFIED', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."document_request_status" AS ENUM('REQUESTED', 'SUBMITTED', 'VERIFIED', 'REJECTED', 'WAIVED');--> statement-breakpoint
CREATE TYPE "public"."document_submission_status" AS ENUM('SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'REPLACED');--> statement-breakpoint
CREATE TYPE "public"."document_verification_status" AS ENUM('PENDING', 'VERIFIED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'RECEIVED', 'VERIFIED', 'REJECTED', 'REFUNDED');--> statement-breakpoint
CREATE TABLE "booking_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"booking_id" text NOT NULL,
	"actor_user_id" text,
	"activity_type" varchar(40) NOT NULL,
	"title" varchar(150),
	"body" text,
	"visibility_scope" varchar(20) DEFAULT 'INTERNAL' NOT NULL,
	"activity_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "booking_participants" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"booking_id" text NOT NULL,
	"role" varchar(30) NOT NULL,
	"full_name" varchar(200) NOT NULL,
	"phone_e164" varchar(30),
	"email" varchar(255),
	"nationality" varchar(100),
	"identity_type" varchar(30),
	"identity_no_masked" varchar(60),
	"is_primary_contact" boolean DEFAULT false NOT NULL,
	"is_signatory" boolean DEFAULT false NOT NULL,
	"participant_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "booking_participants_booking_id_participant_order_unique" UNIQUE("booking_id","participant_order")
);
--> statement-breakpoint
CREATE TABLE "booking_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"booking_id" text NOT NULL,
	"payment_type" varchar(30) NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'MYR' NOT NULL,
	"payment_method" varchar(30),
	"payment_status" "payment_status" NOT NULL,
	"received_at" timestamp,
	"verified_at" timestamp,
	"verified_by_user_id" text,
	"reference_no" varchar(120),
	"proof_file_id" text,
	"rejection_reason" text,
	"reason_code" varchar(50),
	"reason_note" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "booking_status_history" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"booking_id" text NOT NULL,
	"from_status" "booking_status",
	"to_status" "booking_status" NOT NULL,
	"changed_by_user_id" text,
	"changed_at" timestamp DEFAULT now() NOT NULL,
	"reason_code" varchar(50),
	"reason_note" text,
	"source_event_type" varchar(40)
);
--> statement-breakpoint
CREATE TABLE "booking_units" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"booking_id" text NOT NULL,
	"project_id" text NOT NULL,
	"unit_id" text NOT NULL,
	"reserved_price" numeric(15, 2),
	"booking_fee_allocated_amount" numeric(15, 2),
	"reservation_started_at" timestamp,
	"reservation_expires_at" timestamp,
	"released_at" timestamp,
	"release_reason" text,
	CONSTRAINT "booking_units_booking_id_unique" UNIQUE("booking_id")
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"lead_id" text NOT NULL,
	"project_id" text NOT NULL,
	"booking_code" varchar(50) NOT NULL,
	"status" "booking_status" DEFAULT 'DRAFT' NOT NULL,
	"booking_channel" varchar(30) NOT NULL,
	"submitted_by_user_id" text,
	"assigned_agent_user_id" text,
	"booking_fee_amount" numeric(15, 2),
	"booking_fee_currency" varchar(10) DEFAULT 'MYR' NOT NULL,
	"booking_fee_paid_amount" numeric(15, 2) DEFAULT '0.00' NOT NULL,
	"booking_fee_due_at" timestamp,
	"submitted_at" timestamp,
	"approved_at" timestamp,
	"approved_by_user_id" text,
	"rejected_at" timestamp,
	"rejected_by_user_id" text,
	"rejection_reason" text,
	"expired_at" timestamp,
	"cancelled_at" timestamp,
	"cancellation_reason" text,
	"metadata" jsonb,
	CONSTRAINT "bookings_booking_code_unique" UNIQUE("booking_code")
);
--> statement-breakpoint
CREATE TABLE "document_access_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"submission_id" text NOT NULL,
	"booking_id" text NOT NULL,
	"actor_user_id" text,
	"access_type" varchar(30) NOT NULL,
	"access_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" varchar(64),
	"user_agent" text,
	"source_context" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "document_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"booking_id" text NOT NULL,
	"participant_id" text,
	"document_type_id" text NOT NULL,
	"request_status" "document_request_status" NOT NULL,
	"requested_by_user_id" text,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"due_at" timestamp,
	"waived_at" timestamp,
	"waived_by_user_id" text,
	"waive_reason" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "document_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"booking_id" text NOT NULL,
	"request_id" text,
	"participant_id" text,
	"document_type_id" text NOT NULL,
	"file_id" text NOT NULL,
	"submission_status" "document_submission_status" NOT NULL,
	"uploaded_by_user_id" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"version_no" integer DEFAULT 1 NOT NULL,
	"replaced_by_submission_id" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "document_types" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"code" varchar(50) NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"category" varchar(40) NOT NULL,
	"allowed_mime_patterns" jsonb,
	"max_file_size_bytes" integer,
	"is_mandatory_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "document_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "document_verification_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"submission_id" text NOT NULL,
	"booking_id" text NOT NULL,
	"verification_status" "document_verification_status" NOT NULL,
	"verified_by_user_id" text,
	"verified_at" timestamp,
	"reason_code" varchar(50),
	"reason_note" text,
	"checklist_json" jsonb
);
--> statement-breakpoint
ALTER TABLE "booking_activities" ADD CONSTRAINT "booking_activities_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_activities" ADD CONSTRAINT "booking_activities_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_participants" ADD CONSTRAINT "booking_participants_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_payments" ADD CONSTRAINT "booking_payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_payments" ADD CONSTRAINT "booking_payments_verified_by_user_id_users_id_fk" FOREIGN KEY ("verified_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_payments" ADD CONSTRAINT "booking_payments_proof_file_id_files_id_fk" FOREIGN KEY ("proof_file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_units" ADD CONSTRAINT "booking_units_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_units" ADD CONSTRAINT "booking_units_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_units" ADD CONSTRAINT "booking_units_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_submitted_by_user_id_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_assigned_agent_user_id_users_id_fk" FOREIGN KEY ("assigned_agent_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_rejected_by_user_id_users_id_fk" FOREIGN KEY ("rejected_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_access_logs" ADD CONSTRAINT "document_access_logs_submission_id_document_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."document_submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_access_logs" ADD CONSTRAINT "document_access_logs_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_access_logs" ADD CONSTRAINT "document_access_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_participant_id_booking_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."booking_participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_document_type_id_document_types_id_fk" FOREIGN KEY ("document_type_id") REFERENCES "public"."document_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_requests" ADD CONSTRAINT "document_requests_waived_by_user_id_users_id_fk" FOREIGN KEY ("waived_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_submissions" ADD CONSTRAINT "document_submissions_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_submissions" ADD CONSTRAINT "document_submissions_request_id_document_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."document_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_submissions" ADD CONSTRAINT "document_submissions_participant_id_booking_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."booking_participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_submissions" ADD CONSTRAINT "document_submissions_document_type_id_document_types_id_fk" FOREIGN KEY ("document_type_id") REFERENCES "public"."document_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_submissions" ADD CONSTRAINT "document_submissions_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_submissions" ADD CONSTRAINT "document_submissions_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_submissions" ADD CONSTRAINT "document_submissions_replaced_by_submission_id_document_submissions_id_fk" FOREIGN KEY ("replaced_by_submission_id") REFERENCES "public"."document_submissions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_verification_logs" ADD CONSTRAINT "document_verification_logs_submission_id_document_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."document_submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_verification_logs" ADD CONSTRAINT "document_verification_logs_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_verification_logs" ADD CONSTRAINT "document_verification_logs_verified_by_user_id_users_id_fk" FOREIGN KEY ("verified_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_activities_booking_activity_at_idx" ON "booking_activities" USING btree ("booking_id","activity_at");--> statement-breakpoint
CREATE INDEX "booking_participants_booking_role_idx" ON "booking_participants" USING btree ("booking_id","role");--> statement-breakpoint
CREATE INDEX "booking_payments_booking_status_idx" ON "booking_payments" USING btree ("booking_id","payment_status");--> statement-breakpoint
CREATE INDEX "booking_payments_reference_no_idx" ON "booking_payments" USING btree ("reference_no");--> statement-breakpoint
CREATE INDEX "booking_status_history_booking_changed_at_idx" ON "booking_status_history" USING btree ("booking_id","changed_at");--> statement-breakpoint
CREATE INDEX "booking_units_unit_idx" ON "booking_units" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "booking_units_booking_expiry_idx" ON "booking_units" USING btree ("booking_id","reservation_expires_at");--> statement-breakpoint
CREATE INDEX "bookings_status_created_idx" ON "bookings" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "bookings_lead_created_idx" ON "bookings" USING btree ("lead_id","created_at");--> statement-breakpoint
CREATE INDEX "bookings_project_status_idx" ON "bookings" USING btree ("project_id","status");--> statement-breakpoint
CREATE INDEX "bookings_assigned_status_idx" ON "bookings" USING btree ("assigned_agent_user_id","status");--> statement-breakpoint
CREATE INDEX "document_access_logs_submission_access_at_idx" ON "document_access_logs" USING btree ("submission_id","access_at");--> statement-breakpoint
CREATE INDEX "document_access_logs_booking_access_at_idx" ON "document_access_logs" USING btree ("booking_id","access_at");--> statement-breakpoint
CREATE INDEX "document_requests_booking_status_idx" ON "document_requests" USING btree ("booking_id","request_status");--> statement-breakpoint
CREATE INDEX "document_requests_participant_status_idx" ON "document_requests" USING btree ("participant_id","request_status");--> statement-breakpoint
CREATE UNIQUE INDEX "document_requests_participant_open_uniq" ON "document_requests" USING btree ("booking_id","participant_id","document_type_id") WHERE "document_requests"."participant_id" is not null and "document_requests"."request_status" != 'WAIVED';--> statement-breakpoint
CREATE UNIQUE INDEX "document_requests_booking_open_uniq" ON "document_requests" USING btree ("booking_id","document_type_id") WHERE "document_requests"."participant_id" is null and "document_requests"."request_status" != 'WAIVED';--> statement-breakpoint
CREATE INDEX "document_submissions_booking_status_idx" ON "document_submissions" USING btree ("booking_id","submission_status");--> statement-breakpoint
CREATE INDEX "document_submissions_request_version_idx" ON "document_submissions" USING btree ("request_id","version_no");--> statement-breakpoint
CREATE INDEX "document_submissions_file_id_idx" ON "document_submissions" USING btree ("file_id");--> statement-breakpoint
CREATE UNIQUE INDEX "document_submissions_request_version_uniq" ON "document_submissions" USING btree ("request_id","version_no") WHERE "document_submissions"."request_id" is not null;--> statement-breakpoint
CREATE INDEX "document_types_active_category_idx" ON "document_types" USING btree ("is_active","category");--> statement-breakpoint
CREATE INDEX "document_verification_logs_submission_created_idx" ON "document_verification_logs" USING btree ("submission_id","created_at");