import { pgTable, uuid, text, integer, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";
import { companyWallets } from "./company_wallets.js";
import { costEvents } from "./cost_events.js";
import { heartbeatRuns } from "./heartbeat_runs.js";

export const companyWalletLedgerEntries = pgTable(
  "company_wallet_ledger_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    walletId: uuid("wallet_id")
      .notNull()
      .references(() => companyWallets.id, { onDelete: "cascade" }),
    entryType: text("entry_type").notNull(),
    source: text("source").notNull(),
    sourceRef: text("source_ref"),
    amountCents: integer("amount_cents").notNull(),
    balanceAfterCents: integer("balance_after_cents").notNull(),
    note: text("note"),
    costEventId: uuid("cost_event_id").references(() => costEvents.id, { onDelete: "set null" }),
    runId: uuid("run_id").references(() => heartbeatRuns.id, { onDelete: "set null" }),
    metadataJson: jsonb("metadata_json").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyTimeIdx: index("company_wallet_ledger_entries_company_time_idx").on(
      table.companyId,
      table.createdAt,
    ),
    walletTimeIdx: index("company_wallet_ledger_entries_wallet_time_idx").on(
      table.walletId,
      table.createdAt,
    ),
    runIdx: index("company_wallet_ledger_entries_run_idx").on(table.runId),
    costEventIdx: index("company_wallet_ledger_entries_cost_event_idx").on(table.costEventId),
  }),
);
