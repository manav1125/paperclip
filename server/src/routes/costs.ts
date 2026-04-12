import { Router, type Request, type Response } from "express";
import type { Db } from "@paperclipai/db";
import { createCostEventSchema, updateBudgetSchema } from "@paperclipai/shared";
import { validate } from "../middleware/validate.js";
import { accessService, costService, companyService, agentService, logActivity, walletService } from "../services/index.js";
import { assertBoard, assertCompanyAccess, getActorInfo } from "./authz.js";
import { forbidden, unprocessable } from "../errors.js";

export function costRoutes(db: Db) {
  const router = Router();
  const costs = costService(db);
  const wallets = walletService(db);
  const access = accessService(db);
  const companies = companyService(db);
  const agents = agentService(db);

  router.post("/companies/:companyId/cost-events", validate(createCostEventSchema), async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);

    if (req.actor.type === "agent" && req.actor.agentId !== req.body.agentId) {
      res.status(403).json({ error: "Agent can only report its own costs" });
      return;
    }

    const event = await costs.createEvent(companyId, {
      ...req.body,
      occurredAt: new Date(req.body.occurredAt),
    });

    const actor = getActorInfo(req);
    await logActivity(db, {
      companyId,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      action: "cost.reported",
      entityType: "cost_event",
      entityId: event.id,
      details: { costCents: event.costCents, model: event.model },
    });

    res.status(201).json(event);
  });

  function parseDateRange(query: Record<string, unknown>) {
    const from = query.from ? new Date(query.from as string) : undefined;
    const to = query.to ? new Date(query.to as string) : undefined;
    return (from || to) ? { from, to } : undefined;
  }

  function resolveAdminUsageCompanyScope(req: Request, res: Response) {
    if (req.actor.type !== "board") {
      res.status(401).json({ error: "Unauthorized" });
      return null;
    }
    if (req.actor.source === "local_implicit" || req.actor.isInstanceAdmin) {
      return undefined;
    }
    return req.actor.companyIds ?? [];
  }

  router.get("/companies/:companyId/costs/summary", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const range = parseDateRange(req.query);
    const summary = await costs.summary(companyId, range);
    res.json(summary);
  });

  router.get("/companies/:companyId/costs/by-agent", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const range = parseDateRange(req.query);
    const rows = await costs.byAgent(companyId, range);
    res.json(rows);
  });

  router.get("/companies/:companyId/costs/by-project", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const range = parseDateRange(req.query);
    const rows = await costs.byProject(companyId, range);
    res.json(rows);
  });

  router.get("/admin/usage/summary", async (req, res) => {
    const companyIds = resolveAdminUsageCompanyScope(req, res);
    if (companyIds === null) return;
    const range = parseDateRange(req.query);
    const summary = await costs.adminSummary(companyIds, range);
    res.json(summary);
  });

  router.get("/admin/usage/by-company", async (req, res) => {
    const companyIds = resolveAdminUsageCompanyScope(req, res);
    if (companyIds === null) return;
    const range = parseDateRange(req.query);
    const rows = await costs.adminByCompany(companyIds, range);
    res.json(rows);
  });

  router.get("/admin/usage/by-provider", async (req, res) => {
    const companyIds = resolveAdminUsageCompanyScope(req, res);
    if (companyIds === null) return;
    const range = parseDateRange(req.query);
    const rows = await costs.adminByProvider(companyIds, range);
    res.json(rows);
  });

  router.get("/admin/usage/by-model", async (req, res) => {
    const companyIds = resolveAdminUsageCompanyScope(req, res);
    if (companyIds === null) return;
    const range = parseDateRange(req.query);
    const rows = await costs.adminByModel(companyIds, range);
    res.json(rows);
  });

  router.get("/admin/usage/by-task", async (req, res) => {
    const companyIds = resolveAdminUsageCompanyScope(req, res);
    if (companyIds === null) return;
    const range = parseDateRange(req.query);
    const rows = await costs.adminByTask(companyIds, range);
    res.json(rows);
  });

  router.get("/admin/usage/pricing-plan", async (req, res) => {
    const companyIds = resolveAdminUsageCompanyScope(req, res);
    if (companyIds === null) return;
    const range = parseDateRange(req.query);
    const parseNumber = (value: unknown): number | undefined => {
      if (value === undefined || value === null || value === "") return undefined;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    };

    const plan = await costs.adminPricingPlan(companyIds, range, {
      targetGrossMarginPct: parseNumber(req.query.targetGrossMarginPct),
      minimumCogsMarkupPct: parseNumber(req.query.minimumCogsMarkupPct),
      fixedPlatformFeeCents: parseNumber(req.query.fixedPlatformFeeCents),
      overageMarginPct: parseNumber(req.query.overageMarginPct),
      safetyOverheadPct: parseNumber(req.query.safetyOverheadPct),
      reservePct: parseNumber(req.query.reservePct),
      minimumPlanPriceCents: parseNumber(req.query.minimumPlanPriceCents),
    });
    res.json(plan);
  });

  router.get("/admin/wallets/overview", async (req, res) => {
    const companyIds = resolveAdminUsageCompanyScope(req, res);
    if (companyIds === null) return;
    const rows = await wallets.adminOverview(companyIds);
    res.json(rows);
  });

  router.get("/companies/:companyId/wallet", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const wallet = await wallets.getOrCreate(companyId);
    res.json(wallet);
  });

  router.get("/companies/:companyId/wallet/ledger", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const limitRaw = req.query.limit;
    const limit = typeof limitRaw === "string" ? Number(limitRaw) : undefined;
    const rows = await wallets.listLedger(companyId, { limit: Number.isFinite(limit) ? limit : undefined });
    res.json(rows);
  });

  async function assertWalletManager(req: Request, companyId: string) {
    if (req.actor.type !== "board") {
      throw forbidden("Board authentication required");
    }
    if (req.actor.source === "local_implicit" || req.actor.isInstanceAdmin) {
      return;
    }
    const allowed = await access.canUser(companyId, req.actor.userId, "joins:approve");
    if (!allowed) {
      throw forbidden("Instance admin or company owner required");
    }
  }

  router.post("/companies/:companyId/wallet/top-up", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    await assertWalletManager(req, companyId);

    const rawAmount = req.body?.amountCents;
    const amountCents = Number(rawAmount);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      throw unprocessable("amountCents must be a positive number");
    }

    const result = await wallets.topUp(companyId, {
      amountCents,
      note: typeof req.body?.note === "string" ? req.body.note : null,
      sourceRef: req.actor.userId ?? null,
      metadataJson:
        typeof req.body?.metadataJson === "object" && req.body?.metadataJson !== null
          ? req.body.metadataJson as Record<string, unknown>
          : null,
    });

    await logActivity(db, {
      companyId,
      actorType: "user",
      actorId: req.actor.userId ?? "board",
      agentId: null,
      action: "wallet.topped_up",
      entityType: "company",
      entityId: companyId,
      details: {
        amountCents: Math.floor(amountCents),
        balanceCents: result.wallet.balanceCents,
      },
    });

    res.status(201).json(result);
  });

  router.patch("/companies/:companyId/wallet/policy", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    await assertWalletManager(req, companyId);

    const minRunBalanceCentsRaw = req.body?.minRunBalanceCents;
    const minRunBalanceCents =
      minRunBalanceCentsRaw !== undefined ? Number(minRunBalanceCentsRaw) : undefined;
    const lowBalanceThresholdCentsRaw = req.body?.lowBalanceThresholdCents;
    const lowBalanceThresholdCents =
      lowBalanceThresholdCentsRaw !== undefined ? Number(lowBalanceThresholdCentsRaw) : undefined;
    const hardLimitEnforcedRaw = req.body?.hardLimitEnforced;

    if (
      hardLimitEnforcedRaw !== undefined &&
      typeof hardLimitEnforcedRaw !== "boolean"
    ) {
      throw unprocessable("hardLimitEnforced must be a boolean when provided");
    }
    if (
      minRunBalanceCents !== undefined &&
      (!Number.isFinite(minRunBalanceCents) || minRunBalanceCents < 0)
    ) {
      throw unprocessable("minRunBalanceCents must be a non-negative number");
    }
    if (
      lowBalanceThresholdCents !== undefined &&
      (!Number.isFinite(lowBalanceThresholdCents) || lowBalanceThresholdCents < 0)
    ) {
      throw unprocessable("lowBalanceThresholdCents must be a non-negative number");
    }

    const wallet = await wallets.applyPolicy(companyId, {
      hardLimitEnforced: hardLimitEnforcedRaw,
      minRunBalanceCents: minRunBalanceCents === undefined ? undefined : Math.floor(minRunBalanceCents),
      lowBalanceThresholdCents:
        lowBalanceThresholdCents === undefined ? undefined : Math.floor(lowBalanceThresholdCents),
    });

    await logActivity(db, {
      companyId,
      actorType: "user",
      actorId: req.actor.userId ?? "board",
      agentId: null,
      action: "wallet.policy_updated",
      entityType: "company",
      entityId: companyId,
      details: {
        hardLimitEnforced: wallet?.hardLimitEnforced ?? null,
        minRunBalanceCents: wallet?.minRunBalanceCents ?? null,
        lowBalanceThresholdCents: wallet?.lowBalanceThresholdCents ?? null,
      },
    });

    res.json(wallet);
  });

  router.patch("/companies/:companyId/budgets", validate(updateBudgetSchema), async (req, res) => {
    assertBoard(req);
    const companyId = req.params.companyId as string;
    const company = await companies.update(companyId, { budgetMonthlyCents: req.body.budgetMonthlyCents });
    if (!company) {
      res.status(404).json({ error: "Company not found" });
      return;
    }

    await logActivity(db, {
      companyId,
      actorType: "user",
      actorId: req.actor.userId ?? "board",
      action: "company.budget_updated",
      entityType: "company",
      entityId: companyId,
      details: { budgetMonthlyCents: req.body.budgetMonthlyCents },
    });

    res.json(company);
  });

  router.patch("/agents/:agentId/budgets", validate(updateBudgetSchema), async (req, res) => {
    const agentId = req.params.agentId as string;
    const agent = await agents.getById(agentId);
    if (!agent) {
      res.status(404).json({ error: "Agent not found" });
      return;
    }

    if (req.actor.type === "agent") {
      if (req.actor.agentId !== agentId) {
        res.status(403).json({ error: "Agent can only change its own budget" });
        return;
      }
    }

    const updated = await agents.update(agentId, { budgetMonthlyCents: req.body.budgetMonthlyCents });
    if (!updated) {
      res.status(404).json({ error: "Agent not found" });
      return;
    }

    const actor = getActorInfo(req);
    await logActivity(db, {
      companyId: updated.companyId,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      action: "agent.budget_updated",
      entityType: "agent",
      entityId: updated.id,
      details: { budgetMonthlyCents: updated.budgetMonthlyCents },
    });

    res.json(updated);
  });

  return router;
}
