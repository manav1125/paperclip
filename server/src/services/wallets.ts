import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "@paperclipai/db";
import {
  companies,
  companyWalletLedgerEntries,
  companyWallets,
} from "@paperclipai/db";
import { notFound, unprocessable } from "../errors.js";

export interface WalletPolicyUpdateInput {
  hardLimitEnforced?: boolean;
  minRunBalanceCents?: number;
  lowBalanceThresholdCents?: number;
}

export interface WalletLedgerListOptions {
  limit?: number;
}

function asNonNegativeInt(value: unknown, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.floor(parsed));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function walletService(db: Db) {
  async function assertCompany(companyId: string) {
    const company = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.id, companyId))
      .then((rows) => rows[0] ?? null);
    if (!company) throw notFound("Company not found");
  }

  async function ensureWallet(companyId: string) {
    await assertCompany(companyId);
    await db
      .insert(companyWallets)
      .values({ companyId })
      .onConflictDoNothing({ target: companyWallets.companyId });

    const wallet = await db
      .select()
      .from(companyWallets)
      .where(eq(companyWallets.companyId, companyId))
      .then((rows) => rows[0] ?? null);

    if (!wallet) throw notFound("Wallet not found");
    return wallet;
  }

  return {
    getOrCreate: async (companyId: string) => ensureWallet(companyId),

    listLedger: async (companyId: string, opts?: WalletLedgerListOptions) => {
      const wallet = await ensureWallet(companyId);
      const limit = clamp(asNonNegativeInt(opts?.limit, 50), 1, 200);
      return db
        .select()
        .from(companyWalletLedgerEntries)
        .where(eq(companyWalletLedgerEntries.walletId, wallet.id))
        .orderBy(desc(companyWalletLedgerEntries.createdAt))
        .limit(limit);
    },

    topUp: async (
      companyId: string,
      input: {
        amountCents: number;
        note?: string | null;
        sourceRef?: string | null;
        metadataJson?: Record<string, unknown> | null;
      },
    ) => {
      const amountCents = asNonNegativeInt(input.amountCents, 0);
      if (amountCents <= 0) throw unprocessable("Top-up amount must be greater than 0");

      return db.transaction(async (tx) => {
        await tx
          .insert(companyWallets)
          .values({ companyId })
          .onConflictDoNothing({ target: companyWallets.companyId });

        const walletBefore = await tx
          .select()
          .from(companyWallets)
          .where(eq(companyWallets.companyId, companyId))
          .then((rows) => rows[0] ?? null);
        if (!walletBefore) throw notFound("Wallet not found");

        const wallet = await tx
          .update(companyWallets)
          .set({
            balanceCents: sql`${companyWallets.balanceCents} + ${amountCents}`,
            lifetimeCreditsCents: sql`${companyWallets.lifetimeCreditsCents} + ${amountCents}`,
            updatedAt: new Date(),
          })
          .where(eq(companyWallets.id, walletBefore.id))
          .returning()
          .then((rows) => rows[0] ?? null);

        if (!wallet) throw notFound("Wallet not found");

        const ledgerEntry = await tx
          .insert(companyWalletLedgerEntries)
          .values({
            companyId,
            walletId: wallet.id,
            entryType: "credit",
            source: "manual_top_up",
            sourceRef: input.sourceRef ?? null,
            amountCents,
            balanceAfterCents: wallet.balanceCents,
            note: input.note ?? null,
            metadataJson: input.metadataJson ?? {},
          })
          .returning()
          .then((rows) => rows[0] ?? null);

        return { wallet, ledgerEntry };
      });
    },

    applyPolicy: async (companyId: string, input: WalletPolicyUpdateInput) => {
      const wallet = await ensureWallet(companyId);
      const updates: Partial<typeof companyWallets.$inferInsert> = {
        updatedAt: new Date(),
      };
      if (typeof input.hardLimitEnforced === "boolean") {
        updates.hardLimitEnforced = input.hardLimitEnforced;
      }
      if (input.minRunBalanceCents !== undefined) {
        updates.minRunBalanceCents = asNonNegativeInt(input.minRunBalanceCents, wallet.minRunBalanceCents);
      }
      if (input.lowBalanceThresholdCents !== undefined) {
        updates.lowBalanceThresholdCents = asNonNegativeInt(
          input.lowBalanceThresholdCents,
          wallet.lowBalanceThresholdCents,
        );
      }
      return db
        .update(companyWallets)
        .set(updates)
        .where(eq(companyWallets.id, wallet.id))
        .returning()
        .then((rows) => rows[0] ?? null);
    },

    recordCostDebit: async (
      companyId: string,
      input: {
        amountCents: number;
        costEventId?: string | null;
        runId?: string | null;
        sourceRef?: string | null;
        note?: string | null;
        metadataJson?: Record<string, unknown> | null;
      },
    ) => {
      const amountCents = asNonNegativeInt(input.amountCents, 0);
      if (amountCents <= 0) {
        return { wallet: await ensureWallet(companyId), ledgerEntry: null as null };
      }

      return db.transaction(async (tx) => {
        await tx
          .insert(companyWallets)
          .values({ companyId })
          .onConflictDoNothing({ target: companyWallets.companyId });

        const walletBefore = await tx
          .select()
          .from(companyWallets)
          .where(eq(companyWallets.companyId, companyId))
          .then((rows) => rows[0] ?? null);
        if (!walletBefore) throw notFound("Wallet not found");

        const wallet = await tx
          .update(companyWallets)
          .set({
            balanceCents: sql`${companyWallets.balanceCents} - ${amountCents}`,
            lifetimeDebitsCents: sql`${companyWallets.lifetimeDebitsCents} + ${amountCents}`,
            lastDebitedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(companyWallets.id, walletBefore.id))
          .returning()
          .then((rows) => rows[0] ?? null);
        if (!wallet) throw notFound("Wallet not found");

        const ledgerEntry = await tx
          .insert(companyWalletLedgerEntries)
          .values({
            companyId,
            walletId: wallet.id,
            entryType: "debit",
            source: "llm_run_cost",
            sourceRef: input.sourceRef ?? null,
            amountCents: -amountCents,
            balanceAfterCents: wallet.balanceCents,
            note: input.note ?? null,
            costEventId: input.costEventId ?? null,
            runId: input.runId ?? null,
            metadataJson: input.metadataJson ?? {},
          })
          .returning()
          .then((rows) => rows[0] ?? null);

        return { wallet, ledgerEntry };
      });
    },

    canStartRun: async (companyId: string) => {
      const wallet = await ensureWallet(companyId);
      if (!wallet.hardLimitEnforced) {
        return { allowed: true, wallet, reason: null as string | null };
      }
      if (wallet.balanceCents <= 0) {
        return {
          allowed: false,
          wallet,
          reason: "Wallet exhausted. Top up credits to continue running agents.",
        };
      }
      if (wallet.balanceCents < wallet.minRunBalanceCents) {
        return {
          allowed: false,
          wallet,
          reason:
            `Wallet balance (${wallet.balanceCents} cents) is below the minimum run threshold ` +
            `(${wallet.minRunBalanceCents} cents). Top up to continue.`,
        };
      }
      return { allowed: true, wallet, reason: null as string | null };
    },

    adminOverview: async (companyIds?: string[] | null) => {
      const conditions = [];
      if (companyIds) {
        if (companyIds.length === 0) {
          conditions.push(sql`1 = 0`);
        } else {
          conditions.push(inArray(companies.id, companyIds));
        }
      }

      const rows = await db
        .select({
          companyId: companies.id,
          companyName: companies.name,
          issuePrefix: companies.issuePrefix,
          walletId: companyWallets.id,
          balanceCents: companyWallets.balanceCents,
          currency: companyWallets.currency,
          hardLimitEnforced: companyWallets.hardLimitEnforced,
          minRunBalanceCents: companyWallets.minRunBalanceCents,
          lowBalanceThresholdCents: companyWallets.lowBalanceThresholdCents,
          lifetimeCreditsCents: companyWallets.lifetimeCreditsCents,
          lifetimeDebitsCents: companyWallets.lifetimeDebitsCents,
          updatedAt: companyWallets.updatedAt,
        })
        .from(companies)
        .leftJoin(companyWallets, eq(companyWallets.companyId, companies.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(companies.updatedAt));

      return rows.map((row) => ({
        ...row,
        walletMissing: !row.walletId,
      }));
    },
  };
}
