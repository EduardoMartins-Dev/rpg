CREATE TABLE "campaign_folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"kind" varchar(16) NOT NULL,
	"parent_id" uuid,
	"name" varchar(255) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"content_type" varchar(100) NOT NULL,
	"bytes" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "campaign_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "campaign_board_items" ADD COLUMN "folder_id" uuid;--> statement-breakpoint
ALTER TABLE "campaign_notes" ADD COLUMN "folder_id" uuid;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "system_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "campaign_folders" ADD CONSTRAINT "campaign_folders_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_folders" ADD CONSTRAINT "campaign_folders_parent_id_campaign_folders_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."campaign_folders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_media" ADD CONSTRAINT "user_media_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_campaign_folders" ON "campaign_folders" USING btree ("campaign_id","kind","parent_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_user_media_owner" ON "user_media" USING btree ("owner_id","created_at");--> statement-breakpoint
ALTER TABLE "campaign_board_items" ADD CONSTRAINT "campaign_board_items_folder_id_campaign_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."campaign_folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_notes" ADD CONSTRAINT "campaign_notes_folder_id_campaign_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."campaign_folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_system_id_rpg_systems_id_fk" FOREIGN KEY ("system_id") REFERENCES "public"."rpg_systems"("id") ON DELETE no action ON UPDATE no action;