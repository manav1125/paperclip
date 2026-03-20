import { useEffect } from "react";
import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Bot,
  Briefcase,
  Building2,
  CheckCircle2,
  Compass,
  Factory,
  Handshake,
  Layers3,
  Network,
  ShieldCheck,
  Sparkles,
  Target,
  Workflow,
} from "lucide-react";

const startHref = "/auth?next=%2Fonboarding";
const signInHref = "/auth?next=%2F";

const audiences = [
  {
    icon: Briefcase,
    title: "Founders and executive teams",
    copy: "Turn strategy into a living operating system with goals, agents, approvals, and a clear execution loop.",
  },
  {
    icon: Factory,
    title: "Operators building repeatable workflows",
    copy: "Standardize how work gets scoped, delegated, reviewed, and improved instead of relying on scattered prompts.",
  },
  {
    icon: Handshake,
    title: "Agencies and service businesses",
    copy: "Spin up a structured client workspace with a reusable onboarding flow, starter agents, and clear accountability.",
  },
];

const valueProps = [
  "Guided company setup instead of a blank admin panel",
  "Archetypes and templates to seed goals, projects, and starter work",
  "One control plane for goals, agents, issues, approvals, and costs",
  "Governance built in so humans stay in charge as you scale",
];

const featureGroups = [
  {
    icon: Compass,
    title: "Operator-grade onboarding",
    copy: "Collect company mission, target customer, focus, budget, repo context, and archetype before the first run.",
  },
  {
    icon: Layers3,
    title: "Multi-company control plane",
    copy: "Each company gets its own isolated workspace with its own goals, issues, agents, history, and activity trail.",
  },
  {
    icon: Workflow,
    title: "Structured execution loop",
    copy: "Move from goal to project to issue to run to review without inventing the operating process from scratch.",
  },
  {
    icon: ShieldCheck,
    title: "Built-in governance",
    copy: "Keep approvals, budgets, and decision checkpoints visible so AI work stays supervised and auditable.",
  },
  {
    icon: Bot,
    title: "Role-based agent setup",
    copy: "Launch a CEO or function lead with presets and guided runtime setup instead of exposing raw configuration first.",
  },
  {
    icon: Network,
    title: "Platform foundation for scale",
    copy: "Start with a hosted control plane today, then grow into richer templates, teams, and execution infrastructure over time.",
  },
];

const differentiators = [
  {
    title: "Paperclip is not a prompt library.",
    copy: "It gives the company a structure: goals, projects, issues, operators, decisions, approvals, and review surfaces.",
  },
  {
    title: "Paperclip is not just an agent runner.",
    copy: "It helps teams decide what to run, how to brief it, who owns it, and what needs a human decision afterward.",
  },
  {
    title: "Paperclip is not pretending to be fully managed yet.",
    copy: "This version is a hosted control plane v1. The onboarding and management UX are polished, while execution still assumes local-style runtimes where needed.",
  },
];

const steps = [
  {
    label: "Step 1",
    title: "Set up the company properly",
    copy: "Choose an archetype, describe the business, define the mission, capture the target customer, and set the first operating focus.",
  },
  {
    label: "Step 2",
    title: "Create the first operator",
    copy: "Launch a CEO or function lead, choose the runtime, validate the environment, and avoid invalid local paths from the start.",
  },
  {
    label: "Step 3",
    title: "Seed the first execution system",
    copy: "Create the company goal, an optional starter project, a first issue, and a small backlog so the team knows what comes next.",
  },
  {
    label: "Step 4",
    title: "Run, review, and improve",
    copy: "Use Inbox, Costs, Activity, and approvals to inspect what happened and tighten prompts, roles, and budgets before scaling.",
  },
];

const companySamples = [
  { name: "Atlas Ops", detail: "7 agents live", accent: "bg-teal-400" },
  { name: "Northstar Studio", detail: "3 approvals waiting", accent: "bg-amber-400" },
  { name: "Signal Commerce", detail: "1 launch in progress", accent: "bg-cyan-400" },
];

const comparisonRows = [
  {
    without: "AI work lives across random chats, docs, tabs, and ad hoc prompts.",
    withPaperclip: "Every company gets one operating surface for goals, issues, agents, approvals, and review.",
  },
  {
    without: "People keep re-explaining strategy because context is trapped in someone's head.",
    withPaperclip: "Context flows from company brief to goal to project to issue so operators know what they are doing and why.",
  },
  {
    without: "There is no governance layer, so nobody knows what ran, what changed, or what it cost.",
    withPaperclip: "Approvals, budgets, and run history make AI work visible, auditable, and manageable.",
  },
];

export function LandingPage() {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyHeight = document.body.style.height;
    const previousHtmlHeight = document.documentElement.style.height;

    document.body.style.overflow = "auto";
    document.body.style.height = "auto";
    document.documentElement.style.height = "auto";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.height = previousBodyHeight;
      document.documentElement.style.height = previousHtmlHeight;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4efe5_0%,#f8f4eb_24%,#fcfbf7_52%,#f6f1e6_100%)] text-stone-950">
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top_left,rgba(13,148,136,0.18),transparent_42%),radial-gradient(circle_at_top_right,rgba(202,138,4,0.14),transparent_38%)]" />
        <div className="absolute left-[6%] top-24 h-48 w-48 rounded-full bg-teal-700/10 blur-3xl" />
        <div className="absolute right-[8%] top-20 h-56 w-56 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-6 sm:px-10 lg:px-12">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-900/10 bg-white/70 shadow-sm">
                <Building2 className="h-5 w-5 text-stone-950" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-700">Paperclip</p>
                <p className="text-xs text-stone-500">AI operating system control plane</p>
              </div>
            </div>

            <nav className="hidden items-center gap-6 text-sm text-stone-700 lg:flex">
              <a href="#who-its-for" className="transition-colors hover:text-stone-950">Who it is for</a>
              <a href="#how-it-works" className="transition-colors hover:text-stone-950">How it works</a>
              <a href="#features" className="transition-colors hover:text-stone-950">Features</a>
              <a href="#why-paperclip" className="transition-colors hover:text-stone-950">Why Paperclip</a>
            </nav>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to={signInHref}>Sign In</Link>
              </Button>
              <Button size="sm" asChild className="bg-stone-950 text-stone-50 hover:bg-stone-800">
                <Link to={startHref}>
                  Start setup
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </header>

          <main className="pb-20 pt-10 sm:pt-14 lg:pt-18">
            <section className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
              <div className="max-w-4xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-stone-900/10 bg-white/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-700 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  Built for teams turning AI into a managed operating system
                </div>

                <h1 className="mt-6 max-w-5xl font-serif text-[clamp(3.25rem,9vw,6.4rem)] leading-[0.92] tracking-tight text-stone-950">
                  Launch a company workspace for AI operators, not another pile of prompts.
                </h1>

                <p className="mt-6 max-w-3xl text-lg leading-8 text-stone-700 sm:text-xl">
                  Paperclip helps founders, operators, agencies, and lean teams stand up an AI operating system with
                  guided onboarding, role-based agents, company goals, starter projects, issue backlogs, approvals,
                  and cost visibility in one hosted control plane.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    asChild
                    className="h-12 rounded-full bg-stone-950 px-6 text-stone-50 hover:bg-stone-800"
                  >
                    <Link to={startHref}>
                      Create your workspace
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="h-12 rounded-full border-stone-300 bg-white/70 px-6 text-stone-800 hover:bg-white"
                  >
                    <a href="#how-it-works">See how it works</a>
                  </Button>
                </div>

                <div className="mt-10 grid gap-3 sm:grid-cols-2">
                  {valueProps.map((value) => (
                    <div
                      key={value}
                      className="flex items-start gap-3 rounded-3xl border border-stone-900/10 bg-white/75 p-4 shadow-sm backdrop-blur"
                    >
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
                      <p className="text-sm leading-6 text-stone-700">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:pl-6">
                <div className="rounded-[2rem] border border-stone-900/10 bg-[#121212] p-5 text-stone-50 shadow-[0_24px_80px_rgba(28,25,23,0.14)]">
                  <div className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,#171717_0%,#101828_100%)] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-teal-200/80">Hosted control plane v1</p>
                        <h2 className="mt-1 text-2xl font-semibold text-white">What customers get on day one</h2>
                      </div>
                      <div className="rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-xs text-teal-200">
                        Live onboarding
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      {[
                        { label: "Setup", value: "15 min" },
                        { label: "Companies", value: "Multi-tenant" },
                        { label: "Control", value: "Board approval" },
                      ].map((stat) => (
                        <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400">{stat.label}</p>
                          <p className="mt-2 text-lg font-semibold text-white">{stat.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 space-y-3">
                      {steps.map((step) => (
                        <div key={step.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">{step.label}</p>
                          <p className="mt-2 text-sm font-semibold text-white">{step.title}</p>
                          <p className="mt-1 text-sm leading-6 text-stone-300">{step.copy}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-white">Goal alignment</p>
                          <span className="rounded-full border border-teal-400/25 bg-teal-400/10 px-2 py-0.5 text-[11px] text-teal-200">
                            Live chain
                          </span>
                        </div>
                        <div className="mt-4 space-y-3">
                          {[
                            "Company mission: Reach $1M ARR with an AI-enabled service",
                            "Project: Launch the revenue engine",
                            "Agent: CEO",
                            "Task: Build marketing plan and revenue playbook",
                          ].map((item, index) => (
                            <div key={item} className="flex items-center gap-3">
                              <div className="flex flex-col items-center">
                                <div className="h-2.5 w-2.5 rounded-full bg-teal-300 animate-pulse" />
                                {index < 3 && <div className="mt-1 h-6 w-px bg-white/15" />}
                              </div>
                              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs leading-5 text-stone-300">
                                {item}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm font-semibold text-white">Portfolio view</p>
                        <div className="mt-4 space-y-3">
                          {companySamples.map((company) => (
                            <div
                              key={company.name}
                              className="rounded-xl border border-white/10 bg-black/20 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.15)]"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`h-2.5 w-2.5 rounded-full ${company.accent}`} />
                                <div>
                                  <p className="text-sm font-medium text-white">{company.name}</p>
                                  <p className="text-xs text-stone-400">{company.detail}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/8 p-3 text-xs leading-5 text-stone-300">
                          One deployment can manage multiple companies with separate workspaces, goals, operators, and audit trails.
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-amber-300/15 bg-amber-300/8 p-4">
                      <p className="text-sm font-semibold text-amber-100">Reality check</p>
                      <p className="mt-2 text-sm leading-6 text-stone-300">
                        This version is optimized for hosted setup, governance, and company management. Agent execution
                        still assumes local-style runtimes where needed, which is fine for this phase and clearly surfaced in-product.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-24">
              <div className="grid gap-5 lg:grid-cols-3">
                <div className="rounded-[2rem] border border-stone-900/10 bg-white/75 p-6 shadow-sm backdrop-blur">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-950">Mission to execution</p>
                      <p className="mt-1 text-sm text-stone-500">A visual chain, not a disconnected prompt.</p>
                    </div>
                    <Target className="h-5 w-5 text-teal-700" />
                  </div>
                  <div className="mt-5 space-y-3">
                    {[
                      { label: "Mission", tone: "bg-stone-950 text-white", text: "Make onboarding a growth advantage" },
                      { label: "Project", tone: "bg-teal-700 text-white", text: "Launch AI-assisted GTM system" },
                      { label: "Owner", tone: "bg-white text-stone-900 border border-stone-200", text: "CEO operator" },
                      { label: "Task", tone: "bg-white text-stone-900 border border-stone-200", text: "Create the first revenue sprint" },
                    ].map((item, index) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${item.tone}`}>
                          {item.label}
                        </div>
                        <div className="text-sm text-stone-700">{item.text}</div>
                        {index < 3 && <ArrowRight className="ml-auto h-4 w-4 text-stone-300" />}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-stone-900/10 bg-white/75 p-6 shadow-sm backdrop-blur">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-950">Budget visibility</p>
                      <p className="mt-1 text-sm text-stone-500">See who is burning tokens and where to tighten.</p>
                    </div>
                    <Workflow className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="mt-5 space-y-4">
                    {[
                      { agent: "CEO", used: "18 / 60", width: "w-[30%]" },
                      { agent: "CMO", used: "25 / 40", width: "w-[62%]" },
                      { agent: "Ops Lead", used: "9 / 35", width: "w-[26%]" },
                    ].map((row) => (
                      <div key={row.agent}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-stone-800">{row.agent}</span>
                          <span className="text-stone-500">${row.used}</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-stone-200">
                          <div className={`h-2 rounded-full bg-[linear-gradient(90deg,#0f766e,#f59e0b)] ${row.width}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-stone-900/10 bg-white/75 p-6 shadow-sm backdrop-blur">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-950">Managed work queue</p>
                      <p className="mt-1 text-sm text-stone-500">Tasks, review, and decisions stay in one loop.</p>
                    </div>
                    <Layers3 className="h-5 w-5 text-cyan-700" />
                  </div>
                  <div className="mt-5 space-y-3">
                    {[
                      { title: "Prepare launch messaging", state: "In review", tone: "text-amber-700 bg-amber-100" },
                      { title: "Stand up CEO operator", state: "Done", tone: "text-teal-700 bg-teal-100" },
                      { title: "Create sales collateral backlog", state: "Queued", tone: "text-cyan-700 bg-cyan-100" },
                    ].map((item) => (
                      <div key={item.title} className="rounded-xl border border-stone-200 bg-stone-50/80 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-stone-900">{item.title}</p>
                          <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${item.tone}`}>
                            {item.state}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section id="who-its-for" className="mt-24">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">Who it is for</p>
                <h2 className="mt-4 font-serif text-4xl leading-tight text-stone-950 sm:text-5xl">
                  For companies that want AI leverage with structure, review, and accountability.
                </h2>
                <p className="mt-4 text-lg leading-8 text-stone-700">
                  Paperclip works best for teams that do not want a toy chatbot experience. It is for people who want
                  to define outcomes, assign roles, supervise work, and improve the operating system over time.
                </p>
              </div>

              <div className="mt-10 grid gap-5 lg:grid-cols-3">
                {audiences.map((audience) => (
                  <div
                    key={audience.title}
                    className="rounded-[2rem] border border-stone-900/10 bg-white/75 p-6 shadow-sm backdrop-blur"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-950 text-white">
                      <audience.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold text-stone-950">{audience.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-stone-700">{audience.copy}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-24 rounded-[2rem] border border-stone-900/10 bg-white/75 p-8 shadow-sm backdrop-blur sm:p-10">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">Why it lands</p>
                <h2 className="mt-4 font-serif text-4xl leading-tight text-stone-950 sm:text-5xl">
                  The difference is not just more AI. It is better operating design.
                </h2>
              </div>

              <div className="mt-10 space-y-4">
                {comparisonRows.map((row, index) => (
                  <div key={index} className="grid gap-4 rounded-3xl border border-stone-900/10 bg-stone-50/70 p-5 lg:grid-cols-2">
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">Without Paperclip</p>
                      <p className="mt-3 text-sm leading-7 text-stone-700">{row.without}</p>
                    </div>
                    <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">With Paperclip</p>
                      <p className="mt-3 text-sm leading-7 text-stone-700">{row.withPaperclip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section id="why-paperclip" className="mt-24 rounded-[2rem] border border-stone-900/10 bg-white/75 p-8 shadow-sm backdrop-blur sm:p-10">
              <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">Core selling points</p>
                  <h2 className="mt-4 font-serif text-4xl leading-tight text-stone-950 sm:text-5xl">
                    Why teams buy this instead of stitching together tools.
                  </h2>
                  <p className="mt-4 text-lg leading-8 text-stone-700">
                    The value is not just “run an AI agent.” The value is being able to launch, govern, and improve a company-wide AI operating model from one place.
                  </p>
                </div>

                <div className="space-y-4">
                  {differentiators.map((item) => (
                    <div key={item.title} className="rounded-3xl border border-stone-900/10 bg-stone-50/80 p-5">
                      <p className="text-base font-semibold text-stone-950">{item.title}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-700">{item.copy}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="features" className="mt-24">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">Features</p>
                <h2 className="mt-4 font-serif text-4xl leading-tight text-stone-950 sm:text-5xl">
                  Everything the customer needs to stand up and manage the platform well.
                </h2>
                <p className="mt-4 text-lg leading-8 text-stone-700">
                  The experience is designed to take someone from first visit to first operating loop with less confusion, fewer bad defaults, and clearer control.
                </p>
              </div>

              <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {featureGroups.map((feature) => (
                  <div
                    key={feature.title}
                    className="rounded-[2rem] border border-stone-900/10 bg-white/75 p-6 shadow-sm backdrop-blur"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-700 text-white">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold text-stone-950">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-stone-700">{feature.copy}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="how-it-works" className="mt-24 rounded-[2rem] border border-stone-900/10 bg-[#171717] p-8 text-stone-50 shadow-[0_24px_80px_rgba(28,25,23,0.18)] sm:p-10">
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div className="max-w-3xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-200/80">How it works</p>
                  <h2 className="mt-4 font-serif text-4xl leading-tight text-white sm:text-5xl">
                    A cleaner path from first visit to first managed run.
                  </h2>
                </div>
                <Button size="lg" asChild className="rounded-full bg-white text-stone-950 hover:bg-stone-200">
                  <Link to={startHref}>
                    Start onboarding
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="mt-10 grid gap-4 lg:grid-cols-4">
                {steps.map((step) => (
                  <div key={step.title} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center gap-2 text-teal-200">
                      <Target className="h-4 w-4" />
                      <p className="text-xs font-semibold uppercase tracking-[0.2em]">{step.label}</p>
                    </div>
                    <p className="mt-4 text-lg font-semibold text-white">{step.title}</p>
                    <p className="mt-3 text-sm leading-7 text-stone-300">{step.copy}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-24">
              <div className="rounded-[2rem] border border-stone-900/10 bg-[linear-gradient(135deg,rgba(13,148,136,0.08),rgba(250,204,21,0.08),rgba(255,255,255,0.65))] p-8 shadow-sm sm:p-10">
                <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div className="max-w-3xl">
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-600">Call to action</p>
                    <h2 className="mt-4 font-serif text-4xl leading-tight text-stone-950 sm:text-5xl">
                      If you want AI to behave more like a managed team, start here.
                    </h2>
                    <p className="mt-4 text-lg leading-8 text-stone-700">
                      Create a company, choose an archetype, define the mission, launch the first operator, and start running the system in a clearer order.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      size="lg"
                      asChild
                      className="h-12 rounded-full bg-stone-950 px-6 text-stone-50 hover:bg-stone-800"
                    >
                      <Link to={startHref}>
                        Create your company
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      asChild
                      className="h-12 rounded-full border-stone-300 bg-white/70 px-6 text-stone-800 hover:bg-white"
                    >
                      <Link to={signInHref}>Sign in</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
