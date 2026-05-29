CREATE TYPE "public"."otp_channel" AS ENUM('SMS', 'WHATSAPP', 'DEV_CONSOLE');--> statement-breakpoint
CREATE TYPE "public"."otp_purpose" AS ENUM('LOGIN', 'REGISTER');--> statement-breakpoint
CREATE TABLE "otp_challenges" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" varchar(120) NOT NULL,
	"phone_e164" varchar(20) NOT NULL,
	"phone_normalized" varchar(20) NOT NULL,
	"purpose" "otp_purpose" NOT NULL,
	"channel" "otp_channel" NOT NULL,
	"otp_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"consumed_at" timestamp,
	"verified_at" timestamp,
	"locked_at" timestamp,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"resend_available_at" timestamp NOT NULL,
	"last_sent_at" timestamp,
	"send_count" integer DEFAULT 0 NOT NULL,
	"request_id" varchar(120),
	"ip_address_hash" varchar(128),
	"user_agent_hash" varchar(128),
	"user_agent" text,
	"user_id" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "otp_challenges" ADD CONSTRAINT "otp_challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "otp_challenges_phone_created_idx" ON "otp_challenges" USING btree ("phone_normalized","created_at");--> statement-breakpoint
CREATE INDEX "otp_challenges_identifier_created_idx" ON "otp_challenges" USING btree ("identifier","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "otp_challenges_identifier_uniq" ON "otp_challenges" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "otp_challenges_expires_at_idx" ON "otp_challenges" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "otp_challenges_request_id_idx" ON "otp_challenges" USING btree ("request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "otp_challenges_active_phone_purpose_uniq" ON "otp_challenges" USING btree ("phone_normalized","purpose") WHERE "otp_challenges"."consumed_at" is null and "otp_challenges"."locked_at" is null;