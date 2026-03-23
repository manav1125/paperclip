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

function dateParams(from?: string, to?: string): string {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
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
};
