import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Building2, Cpu, DollarSign, Layers3, ReceiptText, SlidersHorizontal } from "lucide-react";
import { adminUsageApi } from "@/api/adminUsage";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";
import { queryKeys } from "@/lib/queryKeys";
import { formatCents, formatDateTime, formatTokens } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type DatePreset = "mtd" | "7d" | "30d" | "ytd" | "all" | "custom";

const PRESET_LABELS: Record<DatePreset, string> = {
  mtd: "Month to Date",
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  ytd: "Year to Date",
  all: "All Time",
  custom: "Custom",
};

function computeRange(preset: DatePreset): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString();
  switch (preset) {
    case "mtd":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), to };
    case "7d":
      return { from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), to };
    case "30d":
      return { from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(), to };
    case "ytd":
      return { from: new Date(now.getFullYear(), 0, 1).toISOString(), to };
    case "all":
      return { from: "", to: "" };
    case "custom":
      return { from: "", to: "" };
  }
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function SectionTable({
  title,
  description,
  headers,
  rows,
}: {
  title: string;
  description: string;
  headers: string[];
  rows: Array<Array<ReactNode>>;
}) {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                {headers.map((header) => (
                  <th key={header} className="px-3 py-2 font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={headers.length} className="px-3 py-4 text-sm text-muted-foreground">
                    No usage captured in this time range yet.
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={index} className="border-b border-border/60 last:border-b-0">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-3 py-3 align-top">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export function InstanceUsageAnalytics() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const [preset, setPreset] = useState<DatePreset>("mtd");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [targetGrossMarginPct, setTargetGrossMarginPct] = useState("55");
  const [minimumCogsMarkupPct, setMinimumCogsMarkupPct] = useState("100");
  const [fixedPlatformFeeUsd, setFixedPlatformFeeUsd] = useState("149");
  const [overageMarginPct, setOverageMarginPct] = useState("55");
  const [safetyOverheadPct, setSafetyOverheadPct] = useState("15");
  const [reservePct, setReservePct] = useState("10");
  const [minimumPlanPriceUsd, setMinimumPlanPriceUsd] = useState("79");

  useEffect(() => {
    setBreadcrumbs([
      { label: "Instance Settings", href: "/instance/settings/heartbeats" },
      { label: "Usage & Costs" },
    ]);
  }, [setBreadcrumbs]);

  const { from, to } = useMemo(() => {
    if (preset === "custom") {
      return {
        from: customFrom ? new Date(customFrom).toISOString() : "",
        to: customTo ? new Date(`${customTo}T23:59:59.999Z`).toISOString() : "",
      };
    }
    return computeRange(preset);
  }, [preset, customFrom, customTo]);

  const pricingInput = useMemo(() => {
    const parse = (value: string): number | undefined => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    };
    const minimumUsd = parse(minimumPlanPriceUsd);
    const fixedPlatformFee = parse(fixedPlatformFeeUsd);
    return {
      targetGrossMarginPct: parse(targetGrossMarginPct),
      minimumCogsMarkupPct: parse(minimumCogsMarkupPct),
      fixedPlatformFeeCents: fixedPlatformFee !== undefined ? Math.round(fixedPlatformFee * 100) : undefined,
      overageMarginPct: parse(overageMarginPct),
      safetyOverheadPct: parse(safetyOverheadPct),
      reservePct: parse(reservePct),
      minimumPlanPriceCents: minimumUsd !== undefined ? Math.round(minimumUsd * 100) : undefined,
    };
  }, [
    fixedPlatformFeeUsd,
    minimumCogsMarkupPct,
    minimumPlanPriceUsd,
    overageMarginPct,
    reservePct,
    safetyOverheadPct,
    targetGrossMarginPct,
  ]);

  const analyticsQuery = useQuery({
    queryKey: queryKeys.instance.usageAnalytics(from || undefined, to || undefined),
    queryFn: async () => {
      const [summary, byCompany, byProvider, byModel, byTask] = await Promise.all([
        adminUsageApi.summary(from || undefined, to || undefined),
        adminUsageApi.byCompany(from || undefined, to || undefined),
        adminUsageApi.byProvider(from || undefined, to || undefined),
        adminUsageApi.byModel(from || undefined, to || undefined),
        adminUsageApi.byTask(from || undefined, to || undefined),
      ]);
      return { summary, byCompany, byProvider, byModel, byTask };
    },
  });

  const pricingPlanQuery = useQuery({
    queryKey: queryKeys.instance.pricingPlan(from || undefined, to || undefined, pricingInput),
    queryFn: () => adminUsageApi.pricingPlan(from || undefined, to || undefined, pricingInput),
  });

  const presetKeys: DatePreset[] = ["mtd", "7d", "30d", "ytd", "all", "custom"];

  if (analyticsQuery.isLoading) {
    return <div className="text-sm text-muted-foreground">Loading usage analytics...</div>;
  }

  if (analyticsQuery.error) {
    return (
      <div className="max-w-5xl space-y-4">
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {analyticsQuery.error instanceof Error
            ? analyticsQuery.error.message
            : "Failed to load usage analytics."}
        </div>
      </div>
    );
  }

  const data = analyticsQuery.data!;

  return (
    <div className="max-w-6xl space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Usage & Cost Analytics</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Cross-company LLM usage for instance admins. Use this view to understand provider mix,
          task-level burn, and how much spend each company is driving before you finalize pricing.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {presetKeys.map((key) => (
          <Button
            key={key}
            variant={preset === key ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setPreset(key)}
          >
            {PRESET_LABELS[key]}
          </Button>
        ))}
        {preset === "custom" ? (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customFrom}
              onChange={(event) => setCustomFrom(event.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground"
            />
            <span className="text-sm text-muted-foreground">to</span>
            <input
              type="date"
              value={customTo}
              onChange={(event) => setCustomTo(event.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground"
            />
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <DollarSign className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Total spend</p>
              <p className="text-2xl font-semibold tabular-nums">{formatCents(data.summary.spendCents)}</p>
              <p className="text-xs text-muted-foreground">{data.summary.apiCallCount} billable LLM events</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <ReceiptText className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Token usage</p>
              <p className="text-2xl font-semibold tabular-nums">
                {formatTokens(data.summary.inputTokens + data.summary.outputTokens)}
              </p>
              <p className="text-xs text-muted-foreground">
                in {formatTokens(data.summary.inputTokens)} / out {formatTokens(data.summary.outputTokens)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Active orgs</p>
              <p className="text-2xl font-semibold tabular-nums">{data.summary.companyCount}</p>
              <p className="text-xs text-muted-foreground">{data.summary.issueCount} task threads attributed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <Cpu className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Provider mix</p>
              <p className="text-2xl font-semibold tabular-nums">{data.summary.providerCount}</p>
              <p className="text-xs text-muted-foreground">{data.summary.modelCount} active models</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Pricing Lab</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Turn live usage into recommended tiers. Adjust the knobs until your pricing hits the
            business model you want: a platform subscription fee plus a guaranteed markup over LLM burn.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>Target gross margin (%)</span>
              <Input
                type="number"
                min={0}
                max={95}
                step={1}
                value={targetGrossMarginPct}
                onChange={(event) => setTargetGrossMarginPct(event.target.value)}
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>Min markup on LLM burn (%)</span>
              <Input
                type="number"
                min={100}
                max={600}
                step={5}
                value={minimumCogsMarkupPct}
                onChange={(event) => setMinimumCogsMarkupPct(event.target.value)}
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>Fixed platform fee (USD)</span>
              <Input
                type="number"
                min={0}
                step={1}
                value={fixedPlatformFeeUsd}
                onChange={(event) => setFixedPlatformFeeUsd(event.target.value)}
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>Overage margin (%)</span>
              <Input
                type="number"
                min={0}
                max={95}
                step={1}
                value={overageMarginPct}
                onChange={(event) => setOverageMarginPct(event.target.value)}
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>Safety overhead (%)</span>
              <Input
                type="number"
                min={0}
                max={100}
                step={1}
                value={safetyOverheadPct}
                onChange={(event) => setSafetyOverheadPct(event.target.value)}
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>Reserve cushion (%)</span>
              <Input
                type="number"
                min={0}
                max={100}
                step={1}
                value={reservePct}
                onChange={(event) => setReservePct(event.target.value)}
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              <span>Minimum plan price (USD)</span>
              <Input
                type="number"
                min={0}
                step={1}
                value={minimumPlanPriceUsd}
                onChange={(event) => setMinimumPlanPriceUsd(event.target.value)}
              />
            </label>
          </div>

          {pricingPlanQuery.isLoading ? (
            <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
              Building pricing recommendations...
            </div>
          ) : null}

          {pricingPlanQuery.error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {pricingPlanQuery.error instanceof Error
                ? pricingPlanQuery.error.message
                : "Failed to calculate pricing recommendations."}
            </div>
          ) : null}

          {pricingPlanQuery.data ? (
            <>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Card className="border-border/70">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">Blended cost / LLM event</p>
                    <p className="text-lg font-semibold tabular-nums">
                      {formatCents(Math.round(pricingPlanQuery.data.observed.averageCostPerApiCallCents))}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border/70">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">Blended cost / 1K tokens</p>
                    <p className="text-lg font-semibold tabular-nums">
                      {formatCents(Math.round(pricingPlanQuery.data.observed.averageCostPer1kTokensCents))}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border/70">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">Avg cost / active agent</p>
                    <p className="text-lg font-semibold tabular-nums">
                      {formatCents(Math.round(pricingPlanQuery.data.observed.averageCostPerActiveAgentCents))}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border/70">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">Avg cost / task thread</p>
                    <p className="text-lg font-semibold tabular-nums">
                      {formatCents(Math.round(pricingPlanQuery.data.observed.averageCostPerTaskCents))}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <SectionTable
                title="Recommended SaaS Tiers"
                description="Use these as your default packaging: monthly fee + included usage + overage."
                headers={[
                  "Tier",
                  "Monthly fee",
                  "Included usage value",
                  "Included LLM events",
                  "Included tokens",
                  "LLM markup",
                  "Gross margin",
                ]}
                rows={pricingPlanQuery.data.recommendations.tiers.map((tier) => [
                  <div className="space-y-1" key={`${tier.tier}-name`}>
                    <div className="font-medium">{tier.tier}</div>
                    <div className="text-xs text-muted-foreground">{tier.idealFor}</div>
                  </div>,
                  <span className="tabular-nums font-medium" key={`${tier.tier}-price`}>
                    {formatCents(tier.monthlyPriceCents)}
                  </span>,
                  <span className="tabular-nums" key={`${tier.tier}-credits`}>
                    {formatCents(tier.includedUsageCents)}
                  </span>,
                  <span className="tabular-nums" key={`${tier.tier}-calls`}>
                    {tier.includedApiCallsEstimate.toLocaleString()}
                  </span>,
                  <span className="tabular-nums" key={`${tier.tier}-tokens`}>
                    {formatTokens(tier.includedTokensEstimate)}
                  </span>,
                  <span className="tabular-nums" key={`${tier.tier}-llm-markup`}>
                    {formatPercent(tier.llmMarkupPct)}
                  </span>,
                  <span className="tabular-nums" key={`${tier.tier}-margin`}>
                    {formatPercent(tier.effectiveGrossMarginPct)}
                  </span>,
                ])}
              />

              <div className="grid gap-4 xl:grid-cols-2">
                <SectionTable
                  title="Overage Recommendation"
                  description="Charge overages at this rate to protect margin when customers exceed included usage."
                  headers={["Metric", "Suggested overage"]}
                  rows={[
                    [
                      <span key="overage-call-label">Per LLM event</span>,
                      <span className="tabular-nums font-medium" key="overage-call-value">
                        {formatCents(pricingPlanQuery.data.recommendations.overage.perApiCallCents)}
                      </span>,
                    ],
                    [
                      <span key="overage-token-label">Per 1K tokens</span>,
                      <span className="tabular-nums font-medium" key="overage-token-value">
                        {formatCents(pricingPlanQuery.data.recommendations.overage.per1kTokensCents)}
                      </span>,
                    ],
                  ]}
                />

                <SectionTable
                  title="Top-up Pack Suggestions"
                  description="Optional prepaid packs to keep workloads running without plan upgrades."
                  headers={["Sell price", "Usage value", "Estimated events", "Estimated tokens"]}
                  rows={pricingPlanQuery.data.recommendations.creditPacks.map((pack) => [
                    <span className="tabular-nums font-medium" key={`${pack.sellPriceCents}-sell`}>
                      {formatCents(pack.sellPriceCents)}
                    </span>,
                    <span className="tabular-nums" key={`${pack.sellPriceCents}-value`}>
                      {formatCents(pack.usageValueCents)}
                    </span>,
                    <span className="tabular-nums" key={`${pack.sellPriceCents}-calls`}>
                      {pack.includedApiCallsEstimate.toLocaleString()}
                    </span>,
                    <span className="tabular-nums" key={`${pack.sellPriceCents}-tokens`}>
                      {formatTokens(pack.includedTokensEstimate)}
                    </span>,
                  ])}
                />
              </div>

              <Card className="border-border/70">
                <CardHeader className="space-y-1 pb-2">
                  <CardTitle className="text-sm">Pricing Guardrails</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    Pricing floor: at least{" "}
                    <span className="font-medium text-foreground">
                      {formatPercent(pricingPlanQuery.data.parameters.minimumCogsMarkupPct)}
                    </span>{" "}
                    markup on LLM burn plus{" "}
                    <span className="font-medium text-foreground">
                      {formatCents(pricingPlanQuery.data.parameters.fixedPlatformFeeCents)}
                    </span>{" "}
                    monthly platform fee.
                  </p>
                  {pricingPlanQuery.data.recommendations.guardrails.map((guardrail) => (
                    <p key={guardrail}>- {guardrail}</p>
                  ))}
                  {pricingPlanQuery.data.observed.topProvider ? (
                    <p>
                      Top provider concentration: {pricingPlanQuery.data.observed.topProvider.provider} at{" "}
                      {formatPercent(pricingPlanQuery.data.observed.topProvider.sharePct)}.
                    </p>
                  ) : null}
                  {pricingPlanQuery.data.observed.topModel ? (
                    <p>
                      Top model concentration: {pricingPlanQuery.data.observed.topModel.model} at{" "}
                      {formatPercent(pricingPlanQuery.data.observed.topModel.sharePct)}.
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </>
          ) : null}
        </CardContent>
      </Card>

      <SectionTable
        title="By Organization"
        description="See which companies are driving the most spend and token usage."
        headers={["Organization", "Spend", "Tokens", "LLM events", "Active agents"]}
        rows={data.byCompany.map((row) => [
          <div className="space-y-1" key={`${row.companyId}-org`}>
            <div className="font-medium">{row.companyName}</div>
            <div className="text-xs text-muted-foreground">{row.issuePrefix}</div>
          </div>,
          <span className="tabular-nums font-medium" key={`${row.companyId}-spend`}>
            {formatCents(row.spendCents)}
          </span>,
          <span className="tabular-nums text-muted-foreground" key={`${row.companyId}-tokens`}>
            {formatTokens(row.inputTokens + row.outputTokens)}
          </span>,
          <span className="tabular-nums" key={`${row.companyId}-calls`}>
            {row.apiCallCount}
          </span>,
          <span className="tabular-nums" key={`${row.companyId}-agents`}>
            {row.activeAgentCount}
          </span>,
        ])}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionTable
          title="By Provider"
          description="Provider-level burn helps with pricing strategy and vendor negotiations."
          headers={["Provider", "Spend", "Tokens", "LLM events", "Orgs / Models"]}
          rows={data.byProvider.map((row) => [
            <Badge variant="outline" className="w-fit" key={`${row.provider}-provider`}>
              {row.provider}
            </Badge>,
            <span className="tabular-nums font-medium" key={`${row.provider}-spend`}>
              {formatCents(row.spendCents)}
            </span>,
            <span className="tabular-nums text-muted-foreground" key={`${row.provider}-tokens`}>
              {formatTokens(row.inputTokens + row.outputTokens)}
            </span>,
            <span className="tabular-nums" key={`${row.provider}-calls`}>
              {row.apiCallCount}
            </span>,
            <span className="text-muted-foreground" key={`${row.provider}-scope`}>
              {row.companyCount} orgs / {row.modelCount} models
            </span>,
          ])}
        />

        <SectionTable
          title="By Model"
          description="Use this to see where premium models are burning budget."
          headers={["Model", "Spend", "Tokens", "LLM events", "Organizations"]}
          rows={data.byModel.map((row) => [
            <div className="space-y-1" key={`${row.provider}-${row.model}-model`}>
              <div className="font-medium">{row.model}</div>
              <div className="text-xs text-muted-foreground">{row.provider}</div>
            </div>,
            <span className="tabular-nums font-medium" key={`${row.provider}-${row.model}-spend`}>
              {formatCents(row.spendCents)}
            </span>,
            <span className="tabular-nums text-muted-foreground" key={`${row.provider}-${row.model}-tokens`}>
              {formatTokens(row.inputTokens + row.outputTokens)}
            </span>,
            <span className="tabular-nums" key={`${row.provider}-${row.model}-calls`}>
              {row.apiCallCount}
            </span>,
            <span className="tabular-nums" key={`${row.provider}-${row.model}-orgs`}>
              {row.companyCount}
            </span>,
          ])}
        />
      </div>

      <SectionTable
        title="By Task"
        description="Task-level attribution makes it easier to understand which workflows are expensive and which ones deserve fixed pricing or limits."
        headers={["Task", "Organization", "Project / Goal", "Spend", "LLM events", "Last event"]}
        rows={data.byTask.slice(0, 25).map((row) => [
          <div className="space-y-1" key={`${row.companyId}-${row.issueId ?? "unattributed"}-task`}>
            <div className="font-medium">
              {row.issueTitle ?? "Unattributed usage"}
            </div>
            <div className="text-xs text-muted-foreground">
              {row.issueIdentifier ?? "No issue linked"}
            </div>
          </div>,
          <span key={`${row.companyId}-${row.issueId ?? "unattributed"}-org`}>
            {row.companyName}
          </span>,
          <div className="space-y-1" key={`${row.companyId}-${row.issueId ?? "unattributed"}-scope`}>
            <div>{row.projectName ?? "No project"}</div>
            <div className="text-xs text-muted-foreground">
              {row.goalTitle ?? "No goal"}
            </div>
          </div>,
          <div className="space-y-1" key={`${row.companyId}-${row.issueId ?? "unattributed"}-spend`}>
            <div className="tabular-nums font-medium">{formatCents(row.spendCents)}</div>
            <div className="text-xs text-muted-foreground">
              {formatTokens(row.inputTokens + row.outputTokens)} tok
            </div>
          </div>,
          <span className="tabular-nums" key={`${row.companyId}-${row.issueId ?? "unattributed"}-calls`}>
            {row.apiCallCount}
          </span>,
          <span className="text-muted-foreground" key={`${row.companyId}-${row.issueId ?? "unattributed"}-time`}>
            {row.latestOccurredAt ? formatDateTime(row.latestOccurredAt) : "Unknown"}
          </span>,
        ])}
      />

      <Card>
        <CardContent className="flex items-start gap-3 p-4 text-sm text-muted-foreground">
          <Layers3 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            This first cut is optimized for pricing discovery. It tracks cost events per org,
            provider, model, and task. The most important remaining improvement is deeper request-level
            telemetry if you later want margin analysis by feature or per-seat packaging.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
