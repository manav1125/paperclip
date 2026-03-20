import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "../lib/utils";
import {
  Activity,
  ArrowRight,
  Bot,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  CircleDot,
  Compass,
  Inbox,
  Target,
} from "lucide-react";

type PlaybookStep = {
  id: string;
  number: number;
  title: string;
  description: string;
  successChecks: string[];
  href?: string;
  actionLabel?: string;
  icon: typeof Target;
  onAction?: () => void;
};

const PLAYBOOK_VERSION = "v1";

function completionKey(companyId: string) {
  return `paperclip.operatorPlaybook.${PLAYBOOK_VERSION}.completed:${companyId}`;
}

function readCompletedSteps(companyId: string) {
  if (typeof window === "undefined") return new Set<string>();
  try {
    const raw = window.localStorage.getItem(completionKey(companyId));
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set<string>(parsed.filter((value) => typeof value === "string")) : new Set<string>();
  } catch {
    return new Set<string>();
  }
}

function writeCompletedSteps(companyId: string, stepIds: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    if (stepIds.size === 0) {
      window.localStorage.removeItem(completionKey(companyId));
      return;
    }
    window.localStorage.setItem(completionKey(companyId), JSON.stringify(Array.from(stepIds)));
  } catch {
    // Ignore storage failures in restricted environments.
  }
}

function statusLabel(status: "done" | "current" | "upcoming") {
  if (status === "done") return "Done";
  if (status === "current") return "Do this next";
  return "Coming up";
}

export function OperatorPlaybookCard({
  companyId,
  onCreateAgent,
  onReplayGuide,
}: {
  companyId: string;
  onCreateAgent: () => void;
  onReplayGuide: () => void;
}) {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [expandedStepId, setExpandedStepId] = useState<string>("goal");

  useEffect(() => {
    setCompletedSteps(readCompletedSteps(companyId));
  }, [companyId]);

  const markStepComplete = useCallback(
    (stepId: string) => {
      setCompletedSteps((current) => {
        if (current.has(stepId)) return current;
        const next = new Set(current);
        next.add(stepId);
        writeCompletedSteps(companyId, next);
        return next;
      });
    },
    [companyId],
  );

  const resetProgress = useCallback(() => {
    const cleared = new Set<string>();
    writeCompletedSteps(companyId, cleared);
    setCompletedSteps(cleared);
  }, [companyId]);

  const steps: PlaybookStep[] = useMemo(() => [
    {
      id: "goal",
      number: 1,
      title: "Set one company outcome",
      description:
        "Define the main result the company is driving toward so every issue, project, and agent has a shared direction.",
      successChecks: [
        "There is one clear company-level outcome, not five competing goals.",
        "The goal is written in business language, not model or tool language.",
        "A human could say whether progress is happening within one week.",
      ],
      href: "/goals",
      actionLabel: "Open goals",
      icon: Target,
    },
    {
      id: "agent",
      number: 2,
      title: "Stand up one dependable operator",
      description:
        "Start with one CEO or functional lead. A small, reliable org is easier to steer than a big one that behaves unpredictably.",
      successChecks: [
        "The first agent has one lane and one manager, not a vague all-purpose role.",
        "The working directory and adapter test both succeed before first real work.",
        "You can explain in one sentence what this agent owns.",
      ],
      actionLabel: "Add first agent",
      onAction: onCreateAgent,
      icon: Bot,
    },
    {
      id: "issue",
      number: 3,
      title: "Turn plans into projects and issues",
      description:
        "Break the work into a project or a few issues with clear deliverables. Agents work best when the brief is scoped and concrete.",
      successChecks: [
        "The first issue asks for a deliverable, not just investigation.",
        "The issue has enough context that the agent does not need to guess the objective.",
        "Projects group recurring workstreams instead of becoming a dumping ground.",
      ],
      href: "/issues",
      actionLabel: "Open issues",
      icon: CircleDot,
    },
    {
      id: "inbox",
      number: 4,
      title: "Run, review, and steer from Inbox",
      description:
        "Trigger a run, inspect what came back, and refine the task or context. Inbox is where you keep the loop tight in the first week.",
      successChecks: [
        "The first run is reviewed by a human before scaling the org.",
        "Errors or unclear outputs are turned into sharper instructions quickly.",
        "Inbox is checked before assuming the platform is broken.",
      ],
      href: "/inbox/recent",
      actionLabel: "Open inbox",
      icon: Inbox,
    },
    {
      id: "costs",
      number: 5,
      title: "Tune the system before you scale it",
      description:
        "Watch costs and activity, then improve prompts, budgets, and role design before adding more agents or more complicated automation.",
      successChecks: [
        "You know which prompt or role change improved behavior.",
        "Costs are reviewed before enabling more automation.",
        "New agents are added only after the first ones are consistently useful.",
      ],
      href: "/costs",
      actionLabel: "Review costs",
      icon: Activity,
    },
  ], [onCreateAgent]);

  const firstIncompleteIndex = steps.findIndex((step) => !completedSteps.has(step.id));
  const currentIndex = firstIncompleteIndex === -1 ? steps.length - 1 : firstIncompleteIndex;
  const nextStep = steps[currentIndex]!;
  const allDone = firstIncompleteIndex === -1;

  useEffect(() => {
    if (allDone) return;
    setExpandedStepId(steps[currentIndex]?.id ?? "goal");
  }, [allDone, currentIndex, steps]);

  return (
    <Card className="border-border/80 bg-card/80" data-guide-id="operator-playbook">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <Compass className="h-3.5 w-3.5" />
              Operating Playbook
            </div>
            <CardTitle className="mt-2 text-xl">Run Paperclip in a clear order</CardTitle>
            <CardDescription className="mt-2 max-w-2xl leading-6">
              This is the practical sequence for managing the platform well. Move through these steps in order until the system feels stable, then replay the product tour anytime you need a refresher.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={resetProgress}>
              Reset checklist
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onReplayGuide}>
              Replay guide
            </Button>
          </div>
        </div>
        <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {allDone ? "Playbook complete" : "Recommended next move"}
          </div>
          <div className="mt-1 text-base font-semibold">
            {allDone ? "You have walked through the first-pass operating loop" : `Step ${nextStep.number}: ${nextStep.title}`}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {allDone
              ? "You can still revisit any step below, replay the guide, and keep using Dashboard as your control center."
              : nextStep.description}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((step, index) => {
          const status: "done" | "current" | "upcoming" = completedSteps.has(step.id)
            ? "done"
            : index === currentIndex
              ? "current"
              : "upcoming";
          const Icon = step.icon;

          const action =
            step.onAction ? (
              <Button
                type="button"
                size="sm"
                variant={status === "current" ? "default" : "outline"}
                onClick={() => {
                  markStepComplete(step.id);
                  step.onAction?.();
                }}
              >
                {step.actionLabel}
              </Button>
            ) : step.href ? (
              <Button asChild size="sm" variant={status === "current" ? "default" : "outline"}>
                <Link
                  to={step.href}
                  onClick={() => {
                    markStepComplete(step.id);
                  }}
                >
                  {step.actionLabel}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            ) : null;

          return (
            <div
              key={step.number}
              className={cn(
                "rounded-xl border px-4 py-4 transition-colors",
                status === "current"
                  ? "border-foreground/20 bg-accent/20"
                  : "border-border/70 bg-background/50",
              )}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                        status === "done"
                          ? "bg-green-500/15 text-green-700 dark:text-green-300"
                          : status === "current"
                            ? "bg-foreground text-background"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {status === "done" ? <CheckCircle2 className="h-4 w-4" /> : step.number}
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div className="text-base font-semibold">{step.title}</div>
                    </div>
                    <div
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em]",
                        status === "done"
                          ? "bg-green-500/10 text-green-700 dark:text-green-300"
                          : status === "current"
                            ? "bg-foreground text-background"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {statusLabel(status)}
                    </div>
                  </div>
                  <div className="mt-2 pl-11 text-sm leading-6 text-muted-foreground">
                    {step.description}
                  </div>
                  <div className="mt-3 pl-11">
                    <Collapsible
                      open={expandedStepId === step.id}
                      onOpenChange={(open) => setExpandedStepId(open ? step.id : "")}
                    >
                      <CollapsibleTrigger className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground transition-colors">
                        {expandedStepId === step.id ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                        What good looks like
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-3">
                        <div className="space-y-2">
                          {step.successChecks.map((check) => (
                            <div key={check} className="flex items-start gap-2 text-sm text-foreground/85">
                              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground" />
                              <span>{check}</span>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </div>
                <div className="pl-11 md:pl-0">{action}</div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
