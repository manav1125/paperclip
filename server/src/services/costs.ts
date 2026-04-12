import { and, desc, eq, gte, inArray, isNotNull, lte, sql, type SQL } from "drizzle-orm";
import type { Db } from "@paperclipai/db";
import { activityLog, agents, companies, costEvents, goals, heartbeatRuns, issues, projects } from "@paperclipai/db";
import { notFound, unprocessable } from "../errors.js";

export interface CostDateRange {
  from?: Date;
  to?: Date;
}

export interface AdminPricingPlanInput {
  targetGrossMarginPct?: number;
  minimumCogsMarkupPct?: number;
  fixedPlatformFeeCents?: number;
  overageMarginPct?: number;
  safetyOverheadPct?: number;
  reservePct?: number;
  minimumPlanPriceCents?: number;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function safeDivide(numerator: number, denominator: number): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return 0;
  return numerator / denominator;
}

function roundUp(value: number, step: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (step <= 0) return Math.ceil(value);
  return Math.ceil(value / step) * step;
}

function percentile(values: number[], pct: number): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0]!;
  const rank = (clamp(pct, 0, 100) / 100) * (values.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  if (lower === upper) return values[lower]!;
  const weight = rank - lower;
  const lowerValue = values[lower]!;
  const upperValue = values[upper]!;
  return lowerValue + (upperValue - lowerValue) * weight;
}

function buildCostEventConditions(
  companyId?: string,
  companyIds?: string[] | null,
  range?: CostDateRange,
): SQL<unknown>[] {
  const conditions: SQL<unknown>[] = [];
  if (companyId) {
    conditions.push(eq(costEvents.companyId, companyId));
  } else if (companyIds) {
    if (companyIds.length === 0) {
      conditions.push(sql`1 = 0`);
    } else {
      conditions.push(inArray(costEvents.companyId, companyIds));
    }
  }
  if (range?.from) conditions.push(gte(costEvents.occurredAt, range.from));
  if (range?.to) conditions.push(lte(costEvents.occurredAt, range.to));
  return conditions;
}

export function costService(db: Db) {
  return {
    createEvent: async (companyId: string, data: Omit<typeof costEvents.$inferInsert, "companyId">) => {
      const agent = await db
        .select()
        .from(agents)
        .where(eq(agents.id, data.agentId))
        .then((rows) => rows[0] ?? null);

      if (!agent) throw notFound("Agent not found");
      if (agent.companyId !== companyId) {
        throw unprocessable("Agent does not belong to company");
      }

      const event = await db
        .insert(costEvents)
        .values({ ...data, companyId })
        .returning()
        .then((rows) => rows[0]);

      await db
        .update(agents)
        .set({
          spentMonthlyCents: sql`${agents.spentMonthlyCents} + ${event.costCents}`,
          updatedAt: new Date(),
        })
        .where(eq(agents.id, event.agentId));

      await db
        .update(companies)
        .set({
          spentMonthlyCents: sql`${companies.spentMonthlyCents} + ${event.costCents}`,
          updatedAt: new Date(),
        })
        .where(eq(companies.id, companyId));

      const updatedAgent = await db
        .select()
        .from(agents)
        .where(eq(agents.id, event.agentId))
        .then((rows) => rows[0] ?? null);

      if (
        updatedAgent &&
        updatedAgent.budgetMonthlyCents > 0 &&
        updatedAgent.spentMonthlyCents >= updatedAgent.budgetMonthlyCents &&
        updatedAgent.status !== "paused" &&
        updatedAgent.status !== "terminated"
      ) {
        await db
          .update(agents)
          .set({ status: "paused", updatedAt: new Date() })
          .where(eq(agents.id, updatedAgent.id));
      }

      return event;
    },

    summary: async (companyId: string, range?: CostDateRange) => {
      const company = await db
        .select()
        .from(companies)
        .where(eq(companies.id, companyId))
        .then((rows) => rows[0] ?? null);

      if (!company) throw notFound("Company not found");

      const conditions = buildCostEventConditions(companyId, undefined, range);

      const [{ total }] = await db
        .select({
          total: sql<number>`coalesce(sum(${costEvents.costCents}), 0)::int`,
        })
        .from(costEvents)
        .where(and(...conditions));

      const spendCents = Number(total);
      const utilization =
        company.budgetMonthlyCents > 0
          ? (spendCents / company.budgetMonthlyCents) * 100
          : 0;

      return {
        companyId,
        spendCents,
        budgetCents: company.budgetMonthlyCents,
        utilizationPercent: Number(utilization.toFixed(2)),
      };
    },

    byAgent: async (companyId: string, range?: CostDateRange) => {
      const conditions = buildCostEventConditions(companyId, undefined, range);

      const costRows = await db
        .select({
          agentId: costEvents.agentId,
          agentName: agents.name,
          agentStatus: agents.status,
          costCents: sql<number>`coalesce(sum(${costEvents.costCents}), 0)::int`,
          inputTokens: sql<number>`coalesce(sum(${costEvents.inputTokens}), 0)::int`,
          outputTokens: sql<number>`coalesce(sum(${costEvents.outputTokens}), 0)::int`,
        })
        .from(costEvents)
        .leftJoin(agents, eq(costEvents.agentId, agents.id))
        .where(and(...conditions))
        .groupBy(costEvents.agentId, agents.name, agents.status)
        .orderBy(desc(sql`coalesce(sum(${costEvents.costCents}), 0)::int`));

      const runConditions: ReturnType<typeof eq>[] = [eq(heartbeatRuns.companyId, companyId)];
      if (range?.from) runConditions.push(gte(heartbeatRuns.finishedAt, range.from));
      if (range?.to) runConditions.push(lte(heartbeatRuns.finishedAt, range.to));

      const runRows = await db
        .select({
          agentId: heartbeatRuns.agentId,
          apiRunCount:
            sql<number>`coalesce(sum(case when coalesce((${heartbeatRuns.usageJson} ->> 'billingType'), 'unknown') = 'api' then 1 else 0 end), 0)::int`,
          subscriptionRunCount:
            sql<number>`coalesce(sum(case when coalesce((${heartbeatRuns.usageJson} ->> 'billingType'), 'unknown') = 'subscription' then 1 else 0 end), 0)::int`,
          subscriptionInputTokens:
            sql<number>`coalesce(sum(case when coalesce((${heartbeatRuns.usageJson} ->> 'billingType'), 'unknown') = 'subscription' then coalesce((${heartbeatRuns.usageJson} ->> 'inputTokens')::int, 0) else 0 end), 0)::int`,
          subscriptionOutputTokens:
            sql<number>`coalesce(sum(case when coalesce((${heartbeatRuns.usageJson} ->> 'billingType'), 'unknown') = 'subscription' then coalesce((${heartbeatRuns.usageJson} ->> 'outputTokens')::int, 0) else 0 end), 0)::int`,
        })
        .from(heartbeatRuns)
        .where(and(...runConditions))
        .groupBy(heartbeatRuns.agentId);

      const runRowsByAgent = new Map(runRows.map((row) => [row.agentId, row]));
      return costRows.map((row) => {
        const runRow = runRowsByAgent.get(row.agentId);
        return {
          ...row,
          apiRunCount: runRow?.apiRunCount ?? 0,
          subscriptionRunCount: runRow?.subscriptionRunCount ?? 0,
          subscriptionInputTokens: runRow?.subscriptionInputTokens ?? 0,
          subscriptionOutputTokens: runRow?.subscriptionOutputTokens ?? 0,
        };
      });
    },

    byProject: async (companyId: string, range?: CostDateRange) => {
      const issueIdAsText = sql<string>`${issues.id}::text`;
      const runProjectLinks = db
        .selectDistinctOn([activityLog.runId, issues.projectId], {
          runId: activityLog.runId,
          projectId: issues.projectId,
        })
        .from(activityLog)
        .innerJoin(
          issues,
          and(
            eq(activityLog.entityType, "issue"),
            eq(activityLog.entityId, issueIdAsText),
          ),
        )
        .where(
          and(
            eq(activityLog.companyId, companyId),
            eq(issues.companyId, companyId),
            isNotNull(activityLog.runId),
            isNotNull(issues.projectId),
          ),
        )
        .orderBy(activityLog.runId, issues.projectId, desc(activityLog.createdAt))
        .as("run_project_links");

      const conditions: ReturnType<typeof eq>[] = [eq(heartbeatRuns.companyId, companyId)];
      if (range?.from) conditions.push(gte(heartbeatRuns.finishedAt, range.from));
      if (range?.to) conditions.push(lte(heartbeatRuns.finishedAt, range.to));

      const costCentsExpr = sql<number>`coalesce(sum(round(coalesce((${heartbeatRuns.usageJson} ->> 'costUsd')::numeric, 0) * 100)), 0)::int`;

      return db
        .select({
          projectId: runProjectLinks.projectId,
          projectName: projects.name,
          costCents: costCentsExpr,
          inputTokens: sql<number>`coalesce(sum(coalesce((${heartbeatRuns.usageJson} ->> 'inputTokens')::int, 0)), 0)::int`,
          outputTokens: sql<number>`coalesce(sum(coalesce((${heartbeatRuns.usageJson} ->> 'outputTokens')::int, 0)), 0)::int`,
        })
        .from(runProjectLinks)
        .innerJoin(heartbeatRuns, eq(runProjectLinks.runId, heartbeatRuns.id))
        .innerJoin(projects, eq(runProjectLinks.projectId, projects.id))
        .where(and(...conditions))
        .groupBy(runProjectLinks.projectId, projects.name)
        .orderBy(desc(costCentsExpr));
    },

    adminSummary: async (companyIds?: string[] | null, range?: CostDateRange) => {
      const conditions = buildCostEventConditions(undefined, companyIds, range);

      const [row] = await db
        .select({
          spendCents: sql<number>`coalesce(sum(${costEvents.costCents}), 0)::int`,
          inputTokens: sql<number>`coalesce(sum(${costEvents.inputTokens}), 0)::int`,
          outputTokens: sql<number>`coalesce(sum(${costEvents.outputTokens}), 0)::int`,
          apiCallCount: sql<number>`count(*)::int`,
          companyCount: sql<number>`count(distinct ${costEvents.companyId})::int`,
          providerCount: sql<number>`count(distinct ${costEvents.provider})::int`,
          modelCount: sql<number>`count(distinct ${costEvents.model})::int`,
          issueCount: sql<number>`count(distinct ${costEvents.issueId})::int`,
        })
        .from(costEvents)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return row;
    },

    adminByCompany: async (companyIds?: string[] | null, range?: CostDateRange) => {
      const conditions = buildCostEventConditions(undefined, companyIds, range);

      return db
        .select({
          companyId: costEvents.companyId,
          companyName: companies.name,
          issuePrefix: companies.issuePrefix,
          spendCents: sql<number>`coalesce(sum(${costEvents.costCents}), 0)::int`,
          inputTokens: sql<number>`coalesce(sum(${costEvents.inputTokens}), 0)::int`,
          outputTokens: sql<number>`coalesce(sum(${costEvents.outputTokens}), 0)::int`,
          apiCallCount: sql<number>`count(*)::int`,
          activeAgentCount: sql<number>`count(distinct ${costEvents.agentId})::int`,
        })
        .from(costEvents)
        .innerJoin(companies, eq(costEvents.companyId, companies.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(costEvents.companyId, companies.name, companies.issuePrefix)
        .orderBy(desc(sql`coalesce(sum(${costEvents.costCents}), 0)::int`));
    },

    adminByProvider: async (companyIds?: string[] | null, range?: CostDateRange) => {
      const conditions = buildCostEventConditions(undefined, companyIds, range);

      return db
        .select({
          provider: costEvents.provider,
          spendCents: sql<number>`coalesce(sum(${costEvents.costCents}), 0)::int`,
          inputTokens: sql<number>`coalesce(sum(${costEvents.inputTokens}), 0)::int`,
          outputTokens: sql<number>`coalesce(sum(${costEvents.outputTokens}), 0)::int`,
          apiCallCount: sql<number>`count(*)::int`,
          companyCount: sql<number>`count(distinct ${costEvents.companyId})::int`,
          modelCount: sql<number>`count(distinct ${costEvents.model})::int`,
        })
        .from(costEvents)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(costEvents.provider)
        .orderBy(desc(sql`coalesce(sum(${costEvents.costCents}), 0)::int`));
    },

    adminByModel: async (companyIds?: string[] | null, range?: CostDateRange) => {
      const conditions = buildCostEventConditions(undefined, companyIds, range);

      return db
        .select({
          provider: costEvents.provider,
          model: costEvents.model,
          spendCents: sql<number>`coalesce(sum(${costEvents.costCents}), 0)::int`,
          inputTokens: sql<number>`coalesce(sum(${costEvents.inputTokens}), 0)::int`,
          outputTokens: sql<number>`coalesce(sum(${costEvents.outputTokens}), 0)::int`,
          apiCallCount: sql<number>`count(*)::int`,
          companyCount: sql<number>`count(distinct ${costEvents.companyId})::int`,
        })
        .from(costEvents)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(costEvents.provider, costEvents.model)
        .orderBy(desc(sql`coalesce(sum(${costEvents.costCents}), 0)::int`));
    },

    adminByTask: async (companyIds?: string[] | null, range?: CostDateRange) => {
      const conditions = buildCostEventConditions(undefined, companyIds, range);

      return db
        .select({
          companyId: costEvents.companyId,
          companyName: companies.name,
          issueId: costEvents.issueId,
          issueIdentifier: issues.identifier,
          issueTitle: issues.title,
          projectId: sql<string | null>`coalesce(${costEvents.projectId}, ${issues.projectId})`,
          projectName: projects.name,
          goalId: sql<string | null>`coalesce(${costEvents.goalId}, ${issues.goalId})`,
          goalTitle: goals.title,
          spendCents: sql<number>`coalesce(sum(${costEvents.costCents}), 0)::int`,
          inputTokens: sql<number>`coalesce(sum(${costEvents.inputTokens}), 0)::int`,
          outputTokens: sql<number>`coalesce(sum(${costEvents.outputTokens}), 0)::int`,
          apiCallCount: sql<number>`count(*)::int`,
          latestOccurredAt: sql<Date | null>`max(${costEvents.occurredAt})`,
        })
        .from(costEvents)
        .innerJoin(companies, eq(costEvents.companyId, companies.id))
        .leftJoin(issues, eq(costEvents.issueId, issues.id))
        .leftJoin(
          projects,
          sql`${projects.id} = coalesce(${costEvents.projectId}, ${issues.projectId})`,
        )
        .leftJoin(
          goals,
          sql`${goals.id} = coalesce(${costEvents.goalId}, ${issues.goalId})`,
        )
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(
          costEvents.companyId,
          companies.name,
          costEvents.issueId,
          issues.identifier,
          issues.title,
          sql`coalesce(${costEvents.projectId}, ${issues.projectId})`,
          projects.name,
          sql`coalesce(${costEvents.goalId}, ${issues.goalId})`,
          goals.title,
        )
        .orderBy(desc(sql`coalesce(sum(${costEvents.costCents}), 0)::int`), desc(sql`max(${costEvents.occurredAt})`));
    },

    adminPricingPlan: async (
      companyIds?: string[] | null,
      range?: CostDateRange,
      input?: AdminPricingPlanInput,
    ) => {
      const targetGrossMarginPct = clamp(input?.targetGrossMarginPct ?? 55, 30, 90);
      const minimumCogsMarkupPct = clamp(input?.minimumCogsMarkupPct ?? 100, 100, 600);
      const fixedPlatformFeeCents = Math.max(0, Math.floor(input?.fixedPlatformFeeCents ?? 14900));
      const overageMarginPct = clamp(input?.overageMarginPct ?? 55, 20, 90);
      const safetyOverheadPct = clamp(input?.safetyOverheadPct ?? 15, 0, 100);
      const reservePct = clamp(input?.reservePct ?? 10, 0, 100);
      const minimumPlanPriceCents = Math.max(0, Math.floor(input?.minimumPlanPriceCents ?? 7900));

      const [summary, byCompany, byProvider, byModel] = await Promise.all([
        (async () => {
          const conditions = buildCostEventConditions(undefined, companyIds, range);
          const [row] = await db
            .select({
              spendCents: sql<number>`coalesce(sum(${costEvents.costCents}), 0)::int`,
              inputTokens: sql<number>`coalesce(sum(${costEvents.inputTokens}), 0)::int`,
              outputTokens: sql<number>`coalesce(sum(${costEvents.outputTokens}), 0)::int`,
              apiCallCount: sql<number>`count(*)::int`,
              companyCount: sql<number>`count(distinct ${costEvents.companyId})::int`,
              issueCount: sql<number>`count(distinct ${costEvents.issueId})::int`,
            })
            .from(costEvents)
            .where(conditions.length > 0 ? and(...conditions) : undefined);
          return row;
        })(),
        (async () => {
          const conditions = buildCostEventConditions(undefined, companyIds, range);
          return db
            .select({
              companyId: costEvents.companyId,
              companyName: companies.name,
              spendCents: sql<number>`coalesce(sum(${costEvents.costCents}), 0)::int`,
              inputTokens: sql<number>`coalesce(sum(${costEvents.inputTokens}), 0)::int`,
              outputTokens: sql<number>`coalesce(sum(${costEvents.outputTokens}), 0)::int`,
              apiCallCount: sql<number>`count(*)::int`,
              activeAgentCount: sql<number>`count(distinct ${costEvents.agentId})::int`,
            })
            .from(costEvents)
            .innerJoin(companies, eq(costEvents.companyId, companies.id))
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .groupBy(costEvents.companyId, companies.name)
            .orderBy(desc(sql`coalesce(sum(${costEvents.costCents}), 0)::int`));
        })(),
        (async () => {
          const conditions = buildCostEventConditions(undefined, companyIds, range);
          return db
            .select({
              provider: costEvents.provider,
              spendCents: sql<number>`coalesce(sum(${costEvents.costCents}), 0)::int`,
              apiCallCount: sql<number>`count(*)::int`,
            })
            .from(costEvents)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .groupBy(costEvents.provider)
            .orderBy(desc(sql`coalesce(sum(${costEvents.costCents}), 0)::int`));
        })(),
        (async () => {
          const conditions = buildCostEventConditions(undefined, companyIds, range);
          return db
            .select({
              provider: costEvents.provider,
              model: costEvents.model,
              spendCents: sql<number>`coalesce(sum(${costEvents.costCents}), 0)::int`,
              apiCallCount: sql<number>`count(*)::int`,
            })
            .from(costEvents)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .groupBy(costEvents.provider, costEvents.model)
            .orderBy(desc(sql`coalesce(sum(${costEvents.costCents}), 0)::int`));
        })(),
      ]);

      const spendCents = Number(summary.spendCents ?? 0);
      const inputTokens = Number(summary.inputTokens ?? 0);
      const outputTokens = Number(summary.outputTokens ?? 0);
      const apiCallCount = Number(summary.apiCallCount ?? 0);
      const issueCount = Number(summary.issueCount ?? 0);
      const totalTokens = inputTokens + outputTokens;
      const activeAgentCount = byCompany.reduce((total, row) => total + Number(row.activeAgentCount ?? 0), 0);

      const companySpends = byCompany
        .map((row) => Number(row.spendCents ?? 0))
        .filter((value) => value > 0)
        .sort((a, b) => a - b);

      const spendP50Cents = percentile(companySpends, 50);
      const spendP80Cents = percentile(companySpends, 80);
      const spendP95Cents = percentile(companySpends, 95);
      const averageCompanySpendCents =
        companySpends.length > 0 ? companySpends.reduce((sum, value) => sum + value, 0) / companySpends.length : 0;

      const averageCostPerApiCallCents = safeDivide(spendCents, apiCallCount);
      const averageCostPer1kTokensCents = safeDivide(spendCents * 1000, totalTokens);
      const averageCostPerActiveAgentCents = safeDivide(spendCents, activeAgentCount);
      const averageCostPerTaskCents = safeDivide(spendCents, issueCount);

      const topProvider = byProvider[0] ?? null;
      const topModel = byModel[0] ?? null;
      const topProviderSharePct = safeDivide(Number(topProvider?.spendCents ?? 0) * 100, spendCents);
      const topModelSharePct = safeDivide(Number(topModel?.spendCents ?? 0) * 100, spendCents);
      const overheadMultiplier = 1 + (safetyOverheadPct + reservePct) / 100;
      const targetMarginRatio = targetGrossMarginPct / 100;
      const minimumCogsMarkupRatio = minimumCogsMarkupPct / 100;
      const overageMarginRatio = overageMarginPct / 100;

      const starterBaselineCents = Math.max(spendP50Cents, averageCompanySpendCents * 0.7, 7500);
      const growthBaselineCents = Math.max(spendP80Cents, starterBaselineCents * 2, 20000);
      const scaleBaselineCents = Math.max(spendP95Cents, growthBaselineCents * 2, 60000);

      function estimateInclusion(includeCents: number) {
        return {
          includedApiCallsEstimate:
            averageCostPerApiCallCents > 0
              ? Math.max(0, Math.floor(includeCents / averageCostPerApiCallCents))
              : 0,
          includedTokensEstimate:
            averageCostPer1kTokensCents > 0
              ? Math.max(0, Math.floor((includeCents / averageCostPer1kTokensCents) * 1000))
              : 0,
        };
      }

      function buildTier(name: "Starter" | "Growth" | "Scale", baselineCents: number, idealFor: string) {
        const includedUsageCents = roundUp(Math.max(baselineCents * overheadMultiplier, 5000), 2500);
        const marginFloorPrice = includedUsageCents / Math.max(0.01, 1 - targetMarginRatio);
        const markupFloorPrice =
          fixedPlatformFeeCents + includedUsageCents * (1 + minimumCogsMarkupRatio);
        const monthlyPriceCents = Math.max(
          minimumPlanPriceCents,
          roundUp(Math.max(marginFloorPrice, markupFloorPrice), 500),
        );
        const { includedApiCallsEstimate, includedTokensEstimate } = estimateInclusion(includedUsageCents);
        const effectiveGrossMarginPct = monthlyPriceCents > 0
          ? ((monthlyPriceCents - includedUsageCents) / monthlyPriceCents) * 100
          : 0;
        const llmOnlyRevenueCents = Math.max(0, monthlyPriceCents - fixedPlatformFeeCents);
        const llmMarkupPct = includedUsageCents > 0
          ? ((llmOnlyRevenueCents - includedUsageCents) / includedUsageCents) * 100
          : 0;
        return {
          tier: name,
          idealFor,
          includedUsageCents,
          monthlyPriceCents,
          includedApiCallsEstimate,
          includedTokensEstimate,
          effectiveGrossMarginPct: Number(effectiveGrossMarginPct.toFixed(2)),
          llmMarkupPct: Number(llmMarkupPct.toFixed(2)),
        };
      }

      const tiers = [
        buildTier("Starter", starterBaselineCents, "Founders proving the first operating workflow."),
        buildTier("Growth", growthBaselineCents, "Teams running multiple recurring agent loops."),
        buildTier("Scale", scaleBaselineCents, "Organizations coordinating many agents and goals."),
      ];

      const overageApiCallCents = averageCostPerApiCallCents > 0
        ? roundUp(
            Math.max(
              (averageCostPerApiCallCents * overheadMultiplier) / Math.max(0.01, 1 - overageMarginRatio),
              averageCostPerApiCallCents * overheadMultiplier * (1 + minimumCogsMarkupRatio),
            ),
            1,
          )
        : 0;
      const overagePer1kTokensCents = averageCostPer1kTokensCents > 0
        ? roundUp(
            Math.max(
              (averageCostPer1kTokensCents * overheadMultiplier) / Math.max(0.01, 1 - overageMarginRatio),
              averageCostPer1kTokensCents * overheadMultiplier * (1 + minimumCogsMarkupRatio),
            ),
            1,
          )
        : 0;

      const creditPacks = [9900, 24900, 49900].map((sellPriceCents) => {
        const usageValueFromMargin = Math.floor(sellPriceCents * (1 - overageMarginRatio));
        const usageValueFromMarkup = Math.floor(sellPriceCents / (1 + minimumCogsMarkupRatio));
        const usageValueCents = Math.max(0, Math.min(usageValueFromMargin, usageValueFromMarkup));
        const { includedApiCallsEstimate, includedTokensEstimate } = estimateInclusion(usageValueCents);
        return {
          sellPriceCents,
          usageValueCents,
          includedApiCallsEstimate,
          includedTokensEstimate,
        };
      });

      const guardrails: string[] = [];
      if (topProvider && topProviderSharePct >= 70) {
        guardrails.push(
          `${topProvider.provider} is ${topProviderSharePct.toFixed(1)}% of spend. Keep provider-specific cushions in pricing.`,
        );
      }
      if (topModel && topModelSharePct >= 45) {
        guardrails.push(
          `${topModel.model} is ${topModelSharePct.toFixed(1)}% of spend. Introduce model routing controls before lowering price.`,
        );
      }
      if (averageCostPerApiCallCents > 0 && averageCostPerApiCallCents >= 150) {
        guardrails.push("Average call cost is above $1.50. Require tighter run scopes or lower-cost default models.");
      }
      if (guardrails.length === 0) {
        guardrails.push("Current spread is healthy. Keep a 20-25% usage reserve for prompt or model drift.");
      }

      return {
        parameters: {
          targetGrossMarginPct,
          minimumCogsMarkupPct,
          fixedPlatformFeeCents,
          overageMarginPct,
          safetyOverheadPct,
          reservePct,
          minimumPlanPriceCents,
        },
        observed: {
          spendCents,
          inputTokens,
          outputTokens,
          apiCallCount,
          companyCount: Number(summary.companyCount ?? 0),
          issueCount,
          activeAgentCount,
          averageCostPerApiCallCents: Number(averageCostPerApiCallCents.toFixed(2)),
          averageCostPer1kTokensCents: Number(averageCostPer1kTokensCents.toFixed(2)),
          averageCostPerActiveAgentCents: Number(averageCostPerActiveAgentCents.toFixed(2)),
          averageCostPerTaskCents: Number(averageCostPerTaskCents.toFixed(2)),
          companySpendPercentilesCents: {
            p50: Math.round(spendP50Cents),
            p80: Math.round(spendP80Cents),
            p95: Math.round(spendP95Cents),
            average: Math.round(averageCompanySpendCents),
          },
          topProvider: topProvider
            ? {
                provider: topProvider.provider,
                sharePct: Number(topProviderSharePct.toFixed(2)),
              }
            : null,
          topModel: topModel
            ? {
                provider: topModel.provider,
                model: topModel.model,
                sharePct: Number(topModelSharePct.toFixed(2)),
              }
            : null,
        },
        recommendations: {
          tiers,
          overage: {
            perApiCallCents: overageApiCallCents,
            per1kTokensCents: overagePer1kTokensCents,
          },
          creditPacks,
          guardrails,
        },
      };
    },
  };
}
