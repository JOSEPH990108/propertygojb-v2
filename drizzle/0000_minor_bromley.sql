CREATE TYPE "public"."file_scan_status" AS ENUM('PENDING', 'CLEAN', 'INFECTED', 'ERROR');--> statement-breakpoint
CREATE TYPE "public"."file_visibility_scope" AS ENUM('PUBLIC', 'INTERNAL', 'RESTRICTED');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(20),
	"icon" varchar(50),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "roles_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"phone_number" text,
	"phone_number_verified" boolean DEFAULT false NOT NULL,
	"nationality" varchar(100),
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"role_id" text,
	"ren_number" varchar(50),
	"agency_name" varchar(100),
	"referral_code" varchar(50),
	"referred_by_user_id" text,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_number_unique" UNIQUE("phone_number"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "amenities" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"slug" varchar(200) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "amenities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "appointment_statuses" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(20),
	"icon" varchar(50),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "appointment_statuses_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "booking_statuses" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(20),
	"icon" varchar(50),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "booking_statuses_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "buyer_types" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(20),
	"icon" varchar(50),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "buyer_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "construction_statuses" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(20),
	"icon" varchar(50),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "construction_statuses_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "layout_types" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(20),
	"icon" varchar(50),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "layout_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "lot_types" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(20),
	"icon" varchar(50),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "lot_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "media_types" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(20),
	"icon" varchar(50),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "media_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "project_statuses" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(20),
	"icon" varchar(50),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "project_statuses_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "property_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(20),
	"icon" varchar(50),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "property_categories_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "property_types" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(20),
	"icon" varchar(50),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"slug" varchar(100) NOT NULL,
	"category_id" text,
	CONSTRAINT "property_types_code_unique" UNIQUE("code"),
	CONSTRAINT "property_types_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"slug" varchar(200) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tenure_types" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(20),
	"icon" varchar(50),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "tenure_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "title_types" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(20),
	"icon" varchar(50),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "title_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "unit_positions" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(20),
	"icon" varchar(50),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "unit_positions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "areas" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"region_id" text NOT NULL,
	"name" varchar(150) NOT NULL,
	"slug" varchar(150) NOT NULL,
	CONSTRAINT "areas_region_id_slug_unique" UNIQUE("region_id","slug")
);
--> statement-breakpoint
CREATE TABLE "regions" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"state_id" text NOT NULL,
	"name" varchar(150) NOT NULL,
	"slug" varchar(150) NOT NULL,
	CONSTRAINT "regions_state_id_slug_unique" UNIQUE("state_id","slug")
);
--> statement-breakpoint
CREATE TABLE "states" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"country" varchar(100) DEFAULT 'Malaysia' NOT NULL,
	CONSTRAINT "states_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"provider" varchar(50) NOT NULL,
	"bucket" varchar(200) NOT NULL,
	"key" varchar(1000) NOT NULL,
	"url" varchar(1000),
	"mime_type" varchar(100),
	"size" integer,
	"checksum" varchar(255),
	"scan_status" "file_scan_status" DEFAULT 'PENDING' NOT NULL,
	"visibility_scope" "file_visibility_scope" DEFAULT 'INTERNAL' NOT NULL,
	"uploaded_by_user_id" text,
	CONSTRAINT "files_provider_bucket_key_unique" UNIQUE("provider","bucket","key")
);
--> statement-breakpoint
CREATE TABLE "developers" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"slug" varchar(200) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"legal_name" varchar(200),
	"country_code" varchar(10),
	"is_featured" boolean DEFAULT false NOT NULL,
	"logo_file_id" text,
	CONSTRAINT "developers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "project_amenities" (
	"project_id" text NOT NULL,
	"amenity_id" text NOT NULL,
	CONSTRAINT "project_amenities_project_id_amenity_id_pk" PRIMARY KEY("project_id","amenity_id")
);
--> statement-breakpoint
CREATE TABLE "project_layouts" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"project_id" text NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(100),
	"layout_type_id" text,
	"built_up_sqft" numeric(10, 2) NOT NULL,
	"bedrooms" integer NOT NULL,
	"bathrooms" integer NOT NULL,
	"study_rooms" integer DEFAULT 0 NOT NULL,
	"has_balcony" boolean DEFAULT false NOT NULL,
	"has_yard" boolean DEFAULT false NOT NULL,
	"is_dual_key" boolean DEFAULT false NOT NULL,
	"ceiling_height_m" numeric(4, 2),
	"furnishing_status" varchar(20) DEFAULT 'UNFURNISHED' NOT NULL,
	"floor_plan_file_id" text,
	"virtual_tour_url" varchar(1000),
	CONSTRAINT "project_layouts_project_id_code_unique" UNIQUE("project_id","code")
);
--> statement-breakpoint
CREATE TABLE "project_media" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"project_id" text NOT NULL,
	"file_id" text NOT NULL,
	"media_type_id" text,
	"caption" varchar(300),
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_nearby_places" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"project_id" text NOT NULL,
	"name" varchar(200) NOT NULL,
	"category" varchar(50) NOT NULL,
	"distance_km" numeric(6, 2),
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_phases" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"project_id" text NOT NULL,
	"name" varchar(100) NOT NULL,
	"phase_code" varchar(50),
	"completion_date" date,
	"construction_status_id" text,
	CONSTRAINT "project_phases_project_id_name_unique" UNIQUE("project_id","name"),
	CONSTRAINT "project_phases_project_id_phase_code_unique" UNIQUE("project_id","phase_code")
);
--> statement-breakpoint
CREATE TABLE "project_tags" (
	"project_id" text NOT NULL,
	"tag_id" text NOT NULL,
	CONSTRAINT "project_tags_project_id_tag_id_pk" PRIMARY KEY("project_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "project_towers" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"project_id" text NOT NULL,
	"phase_id" text,
	"tower_number" varchar(50),
	"name" varchar(100),
	"floor_count" integer,
	"floor_min" integer,
	"floor_max" integer,
	CONSTRAINT "project_towers_project_id_tower_number_unique" UNIQUE("project_id","tower_number")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"slug" varchar(200) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_name" varchar(200),
	"legal_name" varchar(200),
	"developer_id" text NOT NULL,
	"property_category_id" text,
	"property_type_id" text,
	"project_status_id" text,
	"tenure_type_id" text NOT NULL,
	"title_type_id" text,
	"tenure_expiry_date" date,
	"region_id" text,
	"area_id" text,
	"address" text,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"land_area_acres" numeric(10, 4),
	"booking_fee" numeric(10, 2) DEFAULT '1000.00',
	"booking_fee_bumi" numeric(10, 2),
	"maintenance_fee_per_sqft" numeric(10, 2),
	"sinking_fund_per_sqft" numeric(10, 2),
	"is_foreigner_eligible" boolean DEFAULT true NOT NULL,
	"foreigner_eligibility" jsonb,
	"is_gated_community" boolean DEFAULT false NOT NULL,
	"green_certification" varchar(100),
	"total_units" integer DEFAULT 0 NOT NULL,
	"launch_year" integer,
	"featured_file_id" text,
	"is_hot_deal" boolean DEFAULT false NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	CONSTRAINT "projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "pricing_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"project_id" text NOT NULL,
	"phase_id" text,
	"tower_id" text,
	"layout_id" text,
	"buyer_type_id" text,
	"view_key" varchar(100),
	"spa_price_min" numeric(15, 2),
	"spa_price_max" numeric(15, 2),
	"nett_price_min" numeric(15, 2),
	"nett_price_max" numeric(15, 2),
	"rebate_percent_total" numeric(6, 2),
	"snapshot_date" date NOT NULL,
	"source_note" text
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"project_id" text NOT NULL,
	"layout_id" text,
	"tower_id" text,
	"phase_id" text,
	"unit_no" varchar(50) NOT NULL,
	"floor" integer,
	"stack" varchar(10),
	"street_name" varchar(100),
	"display_sequence" integer DEFAULT 0 NOT NULL,
	"built_up_sqft" numeric(10, 2),
	"land_area_sqft" numeric(10, 2),
	"dimension_text" varchar(50),
	"facing" varchar(100),
	"position_type_id" text,
	"carpark_count" integer DEFAULT 1 NOT NULL,
	"carpark_lot_no" varchar(100),
	"carpark_type" varchar(50),
	"lot_type_id" text NOT NULL,
	"booking_status_id" text NOT NULL,
	"base_price" numeric(15, 2) NOT NULL,
	"final_price" numeric(15, 2),
	CONSTRAINT "units_project_id_unit_no_unique" UNIQUE("project_id","unit_no")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_referred_by_user_id_users_id_fk" FOREIGN KEY ("referred_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_types" ADD CONSTRAINT "property_types_category_id_property_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."property_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "areas" ADD CONSTRAINT "areas_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regions" ADD CONSTRAINT "regions_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "developers" ADD CONSTRAINT "developers_logo_file_id_files_id_fk" FOREIGN KEY ("logo_file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_amenities" ADD CONSTRAINT "project_amenities_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_amenities" ADD CONSTRAINT "project_amenities_amenity_id_amenities_id_fk" FOREIGN KEY ("amenity_id") REFERENCES "public"."amenities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_layouts" ADD CONSTRAINT "project_layouts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_layouts" ADD CONSTRAINT "project_layouts_layout_type_id_layout_types_id_fk" FOREIGN KEY ("layout_type_id") REFERENCES "public"."layout_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_layouts" ADD CONSTRAINT "project_layouts_floor_plan_file_id_files_id_fk" FOREIGN KEY ("floor_plan_file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_media" ADD CONSTRAINT "project_media_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_media" ADD CONSTRAINT "project_media_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_media" ADD CONSTRAINT "project_media_media_type_id_media_types_id_fk" FOREIGN KEY ("media_type_id") REFERENCES "public"."media_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_nearby_places" ADD CONSTRAINT "project_nearby_places_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_phases" ADD CONSTRAINT "project_phases_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_phases" ADD CONSTRAINT "project_phases_construction_status_id_construction_statuses_id_fk" FOREIGN KEY ("construction_status_id") REFERENCES "public"."construction_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tags" ADD CONSTRAINT "project_tags_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tags" ADD CONSTRAINT "project_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_towers" ADD CONSTRAINT "project_towers_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_towers" ADD CONSTRAINT "project_towers_phase_id_project_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."project_phases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_developer_id_developers_id_fk" FOREIGN KEY ("developer_id") REFERENCES "public"."developers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_property_category_id_property_categories_id_fk" FOREIGN KEY ("property_category_id") REFERENCES "public"."property_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_property_type_id_property_types_id_fk" FOREIGN KEY ("property_type_id") REFERENCES "public"."property_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_project_status_id_project_statuses_id_fk" FOREIGN KEY ("project_status_id") REFERENCES "public"."project_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_tenure_type_id_tenure_types_id_fk" FOREIGN KEY ("tenure_type_id") REFERENCES "public"."tenure_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_title_type_id_title_types_id_fk" FOREIGN KEY ("title_type_id") REFERENCES "public"."title_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_featured_file_id_files_id_fk" FOREIGN KEY ("featured_file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_snapshots" ADD CONSTRAINT "pricing_snapshots_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_snapshots" ADD CONSTRAINT "pricing_snapshots_phase_id_project_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."project_phases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_snapshots" ADD CONSTRAINT "pricing_snapshots_tower_id_project_towers_id_fk" FOREIGN KEY ("tower_id") REFERENCES "public"."project_towers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_snapshots" ADD CONSTRAINT "pricing_snapshots_layout_id_project_layouts_id_fk" FOREIGN KEY ("layout_id") REFERENCES "public"."project_layouts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_snapshots" ADD CONSTRAINT "pricing_snapshots_buyer_type_id_buyer_types_id_fk" FOREIGN KEY ("buyer_type_id") REFERENCES "public"."buyer_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_layout_id_project_layouts_id_fk" FOREIGN KEY ("layout_id") REFERENCES "public"."project_layouts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_tower_id_project_towers_id_fk" FOREIGN KEY ("tower_id") REFERENCES "public"."project_towers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_phase_id_project_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."project_phases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_position_type_id_unit_positions_id_fk" FOREIGN KEY ("position_type_id") REFERENCES "public"."unit_positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_lot_type_id_lot_types_id_fk" FOREIGN KEY ("lot_type_id") REFERENCES "public"."lot_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_booking_status_id_booking_statuses_id_fk" FOREIGN KEY ("booking_status_id") REFERENCES "public"."booking_statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "areas_region_slug_idx" ON "areas" USING btree ("region_id","slug");--> statement-breakpoint
CREATE INDEX "regions_state_slug_idx" ON "regions" USING btree ("state_id","slug");--> statement-breakpoint
CREATE INDEX "files_provider_bucket_key_idx" ON "files" USING btree ("provider","bucket","key");--> statement-breakpoint
CREATE INDEX "files_scan_status_idx" ON "files" USING btree ("scan_status");--> statement-breakpoint
CREATE INDEX "files_visibility_scope_idx" ON "files" USING btree ("visibility_scope");--> statement-breakpoint
CREATE INDEX "files_uploaded_by_user_idx" ON "files" USING btree ("uploaded_by_user_id");--> statement-breakpoint
CREATE INDEX "project_media_project_idx" ON "project_media" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_nearby_places_project_idx" ON "project_nearby_places" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_nearby_places_category_idx" ON "project_nearby_places" USING btree ("project_id","category");--> statement-breakpoint
CREATE INDEX "projects_status_idx" ON "projects" USING btree ("project_status_id");--> statement-breakpoint
CREATE INDEX "projects_type_idx" ON "projects" USING btree ("property_type_id");--> statement-breakpoint
CREATE INDEX "projects_region_idx" ON "projects" USING btree ("region_id");--> statement-breakpoint
CREATE INDEX "projects_area_idx" ON "projects" USING btree ("area_id");--> statement-breakpoint
CREATE INDEX "pricing_snapshots_project_idx" ON "pricing_snapshots" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "pricing_snapshots_snapshot_date_idx" ON "pricing_snapshots" USING btree ("snapshot_date");--> statement-breakpoint
CREATE INDEX "pricing_snapshots_query_idx" ON "pricing_snapshots" USING btree ("project_id","phase_id","tower_id","layout_id","buyer_type_id","snapshot_date");--> statement-breakpoint
CREATE INDEX "units_project_idx" ON "units" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "units_tower_idx" ON "units" USING btree ("tower_id");--> statement-breakpoint
CREATE INDEX "units_layout_idx" ON "units" USING btree ("layout_id");--> statement-breakpoint
CREATE INDEX "units_booking_status_idx" ON "units" USING btree ("booking_status_id");