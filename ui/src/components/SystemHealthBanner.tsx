import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "../lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Compass,
  Inbox,
  Sparkles,
} from "lucide-react";

type HealthItem = {
  id: string;
  title: string;
  detail: string;
  tone: "critical" | "attention" | "healthy";
  href?: string;
  actionLabel?: string;
  onAction?: () => void;
};

function toneStyles(tone: HealthItem["tone"]) {
  if (tone === "critical") {
    return {
      badge: "bg-red-500/12 text-red-700 dark:text-red-300",
      border: "border-red-500/20 bg-red-500/5",
    };
  }
  if (tone === "attention") {
    return {
      badge: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
      border: "border-amber-500/20 bg-amber-500/5",
    };
  }
  return {
    badge: "bg-green-500/12 text-green-700 dark:text-green-300",
    border: "border-green-500/20 bg-green-500/5",
  };
}

export function SystemHealthBanner({
  hasAgents,
  hasIssues,
  hasRuns,
  agentErrors,
  failedRuns,
  pendingApprovals,
  onCreateAgent,
}: {
  hasAgents: boolean;
  hasIssues: boolean;
  hasRuns: boolean;
  agentErrors: number;
  failedRuns: number;
  pendingApprovals: number;
  onCreateAgent: () => void;
}) {
  const items: HealthItem[] = [
    !hasAgents
      ? {
          id: "no-agents",
          title: "No operating agent is configured yet",
          detail:
            "Create one dependable agent first so the workspace has a real operator before you scale the org.",
          tone: "critical",
          actionLabel: "Add first agent",
          onAction: onCreateAgent,
        }
      : {
          id: "agents-ok",
          title: "An operator exists",
          detail:
            "You have at least one agent in the workspace, so the operating loop can start.",
          tone: "healthy",
          href: "/agents",
          actionLabel: "Open agents",
        },
    !hasIssues
      ? {
          id: "no-issues",
          title: "There is no active work yet",
          detail:
            "Create or refine the first issue so the agent has a scoped assignment with a clear deliverable.",
          tone: "attention",
          href: "/issues",
          actionLabel: "Open issues",
        }
      : {
          id: "issues-ok",
          title: "Work is scoped into issues",
          detail:
            "The company has active task objects, which is the right execution model for Paperclip.",
          tone: "healthy",
          href: "/issues",
          actionLabel: "Review issues",
        },
    !hasRuns
      ? {
          id: "no-runs",
          title: "No agent has run yet",
          detail:
            "Trigger the first run and review the output before adding more structure or more agents.",
          tone: "attention",
          href: "/inbox/recent",
          actionLabel: "Open inbox",
        }
      : failedRuns > 0 || agentErrors > 0
        ? {
            id: "runs-need-review",
            title: "The system needs review",
            detail: `${failedRuns} failed runs and ${agentErrors} errored agents need operator attention before scaling further.`,
            tone: "critical",
            href: "/inbox/recent",
            actionLabel: "Review failures",
          }
        : {
            id: "runs-healthy",
            title: "The operating loop is active",
            detail:
              "Agents have already run, so now the main job is steering quality and keeping the loop tight.",
            tone: "healthy",
            href: "/activity",
            actionLabel: "Open activity",
          },
    pendingApprovals > 0
      ? {
          id: "approvals",
          title: "Human review is waiting",
          detail: `${pendingApprovals} approval${pendingApprovals === 1 ? "" : "s"} should be cleared so work does not stall.`,
          tone: "attention",
          href: "/approvals/pending",
          actionLabel: "Review approvals",
        }
      : {
          id: "approvals-clear",
          title: "No approval backlog",
          detail:
            "There are no pending approvals blocking the company right now.",
          tone: "healthy",
          href: "/approvals/pending",
          actionLabel: "Open approvals",
        },
  ];

  const criticalCount = items.filter((item) => item.tone === "critical").length;
  const attentionCount = items.filter((item) => item.tone === "attention").length;
  const statusLabel =
    criticalCount > 0
      ? "Needs operator attention"
      : attentionCount > 0
        ? "Getting started"
        : "Healthy enough to scale carefully";

  return (
    <Card className="border-border/80 bg-card/80">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <Compass className="h-3.5 w-3.5" />
              System Health
            </div>
            <CardTitle className="mt-2 text-xl">{statusLabel}</CardTitle>
          </div>
          <div
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em]",
              criticalCount > 0
                ? "bg-red-500/12 text-red-700 dark:text-red-300"
                : attentionCount > 0
                  ? "bg-amber-500/12 text-amber-700 dark:text-amber-300"
                  : "bg-green-500/12 text-green-700 dark:text-green-300",
            )}
          >
            {criticalCount > 0 ? "Fix now" : attentionCount > 0 ? "Work through next" : "Looking good"}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {items.map((item) => {
          const styles = toneStyles(item.tone);
          const icon =
            item.tone === "critical" ? (
              <AlertTriangle className="h-4 w-4" />
            ) : item.tone === "attention" ? (
              <Sparkles className="h-4 w-4" />
            ) : item.id.includes("agent") ? (
              <Bot className="h-4 w-4" />
            ) : item.id.includes("approval") ? (
              <Inbox className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            );

          return (
            <div key={item.id} className={cn("rounded-xl border px-4 py-4", styles.border)}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("rounded-full p-2", styles.badge)}>{icon}</span>
                    <div className="text-sm font-semibold">{item.title}</div>
                  </div>
                  <div className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</div>
                </div>
              </div>
              {(item.href || item.onAction) && item.actionLabel && (
                <div className="mt-4">
                  {item.onAction ? (
                    <Button type="button" size="sm" variant="outline" onClick={item.onAction}>
                      {item.actionLabel}
                    </Button>
                  ) : (
                    <Button asChild size="sm" variant="outline">
                      <Link to={item.href!}>
                        {item.actionLabel}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
