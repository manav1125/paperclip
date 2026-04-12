import { pgTable, uuid, integer, text, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";

export const companyWallets = pgTable(
  "company_wallets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    currency: text("currency").notNull().default("usd"),
    balanceCents: integer("balance_cents").notNull().default(0),
    lifetimeCreditsCents: integer("lifetime_credits_cents").notNull().default(0),
    lifetimeDebitsCents: integer("lifetime_debits_cents").notNull().default(0),
    hardLimitEnforced: boolean("hard_limit_enforced").notNull().default(true),
    minRunBalanceCents: integer("min_run_balance_cents").notNull().default(25),
    lowBalanceThresholdCents: integer("low_balance_threshold_cents").notNull().default(500),
    lastDebitedAt: timestamp("last_debited_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyUniqueIdx: uniqueIndex("company_wallets_company_idx").on(table.companyId),
  }),
);
