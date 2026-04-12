-- Rollback:
--   DROP INDEX IF EXISTS "company_wallet_ledger_entries_cost_event_idx";
--   DROP INDEX IF EXISTS "company_wallet_ledger_entries_run_idx";
--   DROP INDEX IF EXISTS "company_wallet_ledger_entries_wallet_time_idx";
--   DROP INDEX IF EXISTS "company_wallet_ledger_entries_company_time_idx";
--   DROP INDEX IF EXISTS "company_wallets_company_idx";
--   DROP TABLE IF EXISTS "company_wallet_ledger_entries";
--   DROP TABLE IF EXISTS "company_wallets";

CREATE TABLE "company_wallets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "currency" text DEFAULT 'usd' NOT NULL,
  "balance_cents" integer DEFAULT 0 NOT NULL,
  "lifetime_credits_cents" integer DEFAULT 0 NOT NULL,
  "lifetime_debits_cents" integer DEFAULT 0 NOT NULL,
  "hard_limit_enforced" boolean DEFAULT true NOT NULL,
  "min_run_balance_cents" integer DEFAULT 25 NOT NULL,
  "low_balance_threshold_cents" integer DEFAULT 500 NOT NULL,
  "last_debited_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_wallet_ledger_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL,
  "wallet_id" uuid NOT NULL,
  "entry_type" text NOT NULL,
  "source" text NOT NULL,
  "source_ref" text,
  "amount_cents" integer NOT NULL,
  "balance_after_cents" integer NOT NULL,
  "note" text,
  "cost_event_id" uuid,
  "run_id" uuid,
  "metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "company_wallets"
  ADD CONSTRAINT "company_wallets_company_id_companies_id_fk"
  FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "company_wallet_ledger_entries"
  ADD CONSTRAINT "company_wallet_ledger_entries_company_id_companies_id_fk"
  FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "company_wallet_ledger_entries"
  ADD CONSTRAINT "company_wallet_ledger_entries_wallet_id_company_wallets_id_fk"
  FOREIGN KEY ("wallet_id") REFERENCES "public"."company_wallets"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "company_wallet_ledger_entries"
  ADD CONSTRAINT "company_wallet_ledger_entries_cost_event_id_cost_events_id_fk"
  FOREIGN KEY ("cost_event_id") REFERENCES "public"."cost_events"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "company_wallet_ledger_entries"
  ADD CONSTRAINT "company_wallet_ledger_entries_run_id_heartbeat_runs_id_fk"
  FOREIGN KEY ("run_id") REFERENCES "public"."heartbeat_runs"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "company_wallets_company_idx"
  ON "company_wallets" USING btree ("company_id");
--> statement-breakpoint
CREATE INDEX "company_wallet_ledger_entries_company_time_idx"
  ON "company_wallet_ledger_entries" USING btree ("company_id", "created_at");
--> statement-breakpoint
CREATE INDEX "company_wallet_ledger_entries_wallet_time_idx"
  ON "company_wallet_ledger_entries" USING btree ("wallet_id", "created_at");
--> statement-breakpoint
CREATE INDEX "company_wallet_ledger_entries_run_idx"
  ON "company_wallet_ledger_entries" USING btree ("run_id");
--> statement-breakpoint
CREATE INDEX "company_wallet_ledger_entries_cost_event_idx"
  ON "company_wallet_ledger_entries" USING btree ("cost_event_id");
