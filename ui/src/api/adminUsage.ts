import { api } from "./client";

export interface AdminUsageSummary {
  spendCents: number;
  inputTokens: number;
  outputTokens: number;
  apiCallCount: number;
  companyCount: number;
  providerCount: number;
  modelCount: number;
  issueCount: number;
}

export interface AdminUsageByCompany {
  companyId: string;
  companyName: string;
  issuePrefix: string;
  spendCents: number;
  inputTokens: number;
  outputTokens: number;
  apiCallCount: number;
  activeAgentCount: number;
}

export interface AdminUsageByProvider {
  provider: string;
  spendCents: number;
  inputTokens: number;
  outputTokens: number;
  apiCallCount: number;
  companyCount: number;
  modelCount: number;
}

export interface AdminUsageByModel {
  provider: string;
  model: string;
  spendCents: number;
  inputTokens: number;
  outputTokens: number;
  apiCallCount: number;
  companyCount: number;
}

export interface AdminUsageByTask {
  companyId: string;
  companyName: string;
  issueId: string | null;
  issueIdentifier: string | null;
  issueTitle: string | null;
  projectId: string | null;
  projectName: string | null;
  goalId: string | null;
  goalTitle: string | null;
  spendCents: number;
  inputTokens: number;
  outputTokens: number;
  apiCallCount: number;
  latestOccurredAt: string | null;
}

export interface AdminPricingPlan {
  parameters: {
    targetGrossMarginPct: number;
    overageMarginPct: number;
    safetyOverheadPct: number;
    reservePct: number;
    minimumPlanPriceCents: number;
  };
  observed: {
    spendCents: number;
    inputTokens: number;
    outputTokens: number;
    apiCallCount: number;
    companyCount: number;
    issueCount: number;
    activeAgentCount: number;
    averageCostPerApiCallCents: number;
    averageCostPer1kTokensCents: number;
    averageCostPerActiveAgentCents: number;
    averageCostPerTaskCents: number;
    companySpendPercentilesCents: {
      p50: number;
      p80: number;
      p95: number;
      average: number;
    };
    topProvider: {
      provider: string;
      sharePct: number;
    } | null;
    topModel: {
      provider: string;
      model: string;
      sharePct: number;
    } | null;
  };
  recommendations: {
    tiers: Array<{
      tier: "Starter" | "Growth" | "Scale";
      idealFor: string;
      includedUsageCents: number;
      monthlyPriceCents: number;
      includedApiCallsEstimate: number;
      includedTokensEstimate: number;
      effectiveGrossMarginPct: number;
    }>;
    overage: {
      perApiCallCents: number;
      per1kTokensCents: number;
    };
    creditPacks: Array<{
      sellPriceCents: number;
      usageValueCents: number;
      includedApiCallsEstimate: number;
      includedTokensEstimate: number;
    }>;
    guardrails: string[];
  };
}

function dateParams(from?: string, to?: string): string {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function pricingPlanParams(
  from?: string,
  to?: string,
  input?: {
    targetGrossMarginPct?: number;
    overageMarginPct?: number;
    safetyOverheadPct?: number;
    reservePct?: number;
    minimumPlanPriceCents?: number;
  },
): string {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (input?.targetGrossMarginPct !== undefined) {
    params.set("targetGrossMarginPct", String(input.targetGrossMarginPct));
  }
  if (input?.overageMarginPct !== undefined) {
    params.set("overageMarginPct", String(input.overageMarginPct));
  }
  if (input?.safetyOverheadPct !== undefined) {
    params.set("safetyOverheadPct", String(input.safetyOverheadPct));
  }
  if (input?.reservePct !== undefined) {
    params.set("reservePct", String(input.reservePct));
  }
  if (input?.minimumPlanPriceCents !== undefined) {
    params.set("minimumPlanPriceCents", String(input.minimumPlanPriceCents));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const adminUsageApi = {
  summary: (from?: string, to?: string) =>
    api.get<AdminUsageSummary>(`/admin/usage/summary${dateParams(from, to)}`),
  byCompany: (from?: string, to?: string) =>
    api.get<AdminUsageByCompany[]>(`/admin/usage/by-company${dateParams(from, to)}`),
  byProvider: (from?: string, to?: string) =>
    api.get<AdminUsageByProvider[]>(`/admin/usage/by-provider${dateParams(from, to)}`),
  byModel: (from?: string, to?: string) =>
    api.get<AdminUsageByModel[]>(`/admin/usage/by-model${dateParams(from, to)}`),
  byTask: (from?: string, to?: string) =>
    api.get<AdminUsageByTask[]>(`/admin/usage/by-task${dateParams(from, to)}`),
  pricingPlan: (
    from?: string,
    to?: string,
    input?: {
      targetGrossMarginPct?: number;
      overageMarginPct?: number;
      safetyOverheadPct?: number;
      reservePct?: number;
      minimumPlanPriceCents?: number;
    },
  ) =>
    api.get<AdminPricingPlan>(`/admin/usage/pricing-plan${pricingPlanParams(from, to, input)}`),
};
