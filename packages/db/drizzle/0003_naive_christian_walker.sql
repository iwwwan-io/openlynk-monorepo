CREATE TABLE "order" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"buyer_name" text NOT NULL,
	"buyer_email" text NOT NULL,
	"product_title" text NOT NULL,
	"amount_idr" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"midtrans_order_id" text NOT NULL,
	"access_token" text NOT NULL,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "order_midtrans_order_id_unique" UNIQUE("midtrans_order_id"),
	CONSTRAINT "order_access_token_unique" UNIQUE("access_token")
);
--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_product_id_idx" ON "order" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "order_status_idx" ON "order" USING btree ("status");