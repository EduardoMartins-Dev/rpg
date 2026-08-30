CREATE TABLE "campaign_rolls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"character_name" varchar(255),
	"label" varchar(255) NOT NULL,
	"pool" integer NOT NULL,
	"hunger" integer NOT NULL,
	"difficulty" integer NOT NULL,
	"dice" jsonb NOT NULL,
	"successes" integer NOT NULL,
	"outcome" varchar(32) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campaign_rolls" ADD CONSTRAINT "campaign_rolls_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_rolls" ADD CONSTRAINT "campaign_rolls_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_campaign_rolls_campaign" ON "campaign_rolls" USING btree ("campaign_id","created_at");