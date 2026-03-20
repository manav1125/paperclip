import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "../lib/utils";
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  CircleDot,
  Compass,
  Inbox,
  Target,
} from "lucide-react";

type PlaybookStep = {
  number: number;
  title: string;
  description: string;
  href?: string;
  actionLabel?: string;
  complete: boolean;
  icon: typeof Target;
  onAction?: () => void;
};

function statusLabel(status: "done" | "current" | "upcoming") {
  if (status === "done") return "Done";
  if (status === "current") return "Do this next";
  return "Coming up";
}

export function OperatorPlaybookCard({
  hasGoal,
  hasAgents,
  hasProjectOrIssue,
  hasRunActivity,
  hasOperatingHistory,
  onCreateAgent,
  onReplayGuide,
}: {
  hasGoal: boolean;
  hasAgents: boolean;
  hasProjectOrIssue: boolean;
  hasRunActivity: boolean;
  hasOperatingHistory: boolean;
  onCreateAgent: () => void;
  onReplayGuide: () => void;
}) {
  const steps: PlaybookStep[] = [
    {
      number: 1,
      title: "Set one company outcome",
      description:
        "Define the main result the company is driving toward so every issue, project, and agent has a shared direction.",
      href: "/goals",
      actionLabel: "Open goals",
      complete: hasGoal,
      icon: Target,
    },
    {
      number: 2,
      title: "Stand up one dependable operator",
      description:
        "Start with one CEO or functional lead. A small, reliable org is easier to steer than a big one that behaves unpredictably.",
      actionLabel: hasAgents ? "Open agents" : "Add first agent",
      href: hasAgents ? "/agents" : undefined,
      onAction: hasAgents ? undefined : onCreateAgent,
      complete: hasAgents,
      icon: Bot,
    },
    {
      number: 3,
      title: "Turn plans into projects and issues",
      description:
        "Break the work into a project or a few issues with clear deliverables. Agents work best when the brief is scoped and concrete.",
      href: "/issues",
      actionLabel: "Open issues",
      complete: hasProjectOrIssue,
      icon: CircleDot,
    },
    {
      number: 4,
      title: "Run, review, and steer from Inbox",
      description:
        "Trigger a run, inspect what came back, and refine the task or context. Inbox is where you keep the loop tight in the first week.",
      href: "/inbox/recent",
      actionLabel: "Open inbox",
      complete: hasRunActivity,
      icon: Inbox,
    },
    {
      number: 5,
      title: "Tune the system before you scale it",
      description:
        "Watch costs and activity, then improve prompts, budgets, and role design before adding more agents or more complicated automation.",
      href: "/costs",
      actionLabel: "Review costs",
      complete: hasOperatingHistory,
      icon: Activity,
    },
  ];

  const firstIncompleteIndex = steps.findIndex((step) => !step.complete);
  const currentIndex = firstIncompleteIndex === -1 ? steps.length - 1 : firstIncompleteIndex;
  const nextStep = steps[currentIndex]!;

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
          <Button type="button" variant="outline" size="sm" onClick={onReplayGuide}>
            Replay guide
          </Button>
        </div>
        <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Recommended next move
          </div>
          <div className="mt-1 text-base font-semibold">
            Step {nextStep.number}: {nextStep.title}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">{nextStep.description}</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((step, index) => {
          const status: "done" | "current" | "upcoming" = step.complete
            ? "done"
            : index === currentIndex
              ? "current"
              : "upcoming";
          const Icon = step.icon;

          const action =
            step.onAction ? (
              <Button type="button" size="sm" variant={status === "current" ? "default" : "outline"} onClick={step.onAction}>
                {step.actionLabel}
              </Button>
            ) : step.href ? (
              <Button asChild size="sm" variant={status === "current" ? "default" : "outline"}>
                <Link to={step.href}>
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
