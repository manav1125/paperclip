import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Bot,
  Building2,
  Network,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";

const startHref = "/auth?next=%2Fonboarding";
const signInHref = "/auth?next=%2F";

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-y-auto bg-[linear-gradient(180deg,#f3efe6_0%,#f7f4ec_28%,#fbfaf6_100%)] text-stone-900">
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[26rem] bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.18),transparent_42%),radial-gradient(circle_at_top_right,rgba(217,119,6,0.18),transparent_38%)]" />
        <div className="absolute left-[8%] top-20 h-44 w-44 rounded-full bg-teal-600/10 blur-3xl" />
        <div className="absolute right-[10%] top-28 h-52 w-52 rounded-full bg-amber-500/10 blur-3xl" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 sm:px-10">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-900/10 bg-white/70 shadow-sm">
                <Building2 className="h-5 w-5 text-stone-900" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-[0.16em] text-stone-700 uppercase">
                  Paperclip
                </p>
                <p className="text-xs text-stone-500">
                  Hosted agent company control plane
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to={signInHref}>Sign In</Link>
              </Button>
              <Button size="sm" asChild className="bg-stone-900 text-stone-50 hover:bg-stone-800">
                <Link to={startHref}>
                  Start Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </header>

          <main className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
            <section className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-stone-900/10 bg-white/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-600 shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Launch an operating company, not a prompt folder
              </div>

              <h1 className="mt-6 max-w-4xl font-serif text-5xl leading-none tracking-tight text-stone-950 sm:text-6xl lg:text-7xl">
                Build a landing page, onboard a company, and launch its first agents from one place.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-700">
                Paperclip gives every customer a guided path from signup to mission, org chart, starter project,
                archetype selection, CEO agent, and live operating queue. One hosted control plane, many companies,
                clear isolation.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button
                  size="lg"
                  asChild
                  className="h-12 rounded-full bg-stone-900 px-6 text-stone-50 hover:bg-stone-800"
                >
                  <Link to={startHref}>
                    Create Your Company
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="h-12 rounded-full border-stone-300 bg-white/70 px-6 text-stone-800 hover:bg-white"
                >
                  <Link to={signInHref}>Sign In to an Existing Workspace</Link>
                </Button>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    label: "Clear value prop",
                    copy: "Market the platform around company goals, governance, and agent execution.",
                  },
                  {
                    label: "Guided onboarding",
                    copy: "Collect mission, customer, repo, and launch focus before the first run.",
                  },
                  {
                    label: "Tenant-safe setup",
                    copy: "Provision a new company, goal tree, project, and starter CEO task per signup.",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-stone-900/10 bg-white/70 p-4 shadow-sm backdrop-blur"
                  >
                    <p className="text-sm font-semibold text-stone-900">{item.label}</p>
                    <p className="mt-2 text-sm leading-6 text-stone-600">{item.copy}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="lg:pl-8">
              <div className="rounded-[2rem] border border-stone-900/10 bg-[#111111] p-5 text-stone-50 shadow-2xl shadow-stone-900/15">
                <div className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,#171717_0%,#0f1720_100%)] p-5">
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-teal-300/80">
                        SaaS v1 Flow
                      </p>
                      <h2 className="mt-1 text-xl font-semibold">From signup to operating queue</h2>
                    </div>
                    <div className="rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-xs text-teal-200">
                      Shared control plane
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {[
                      {
                        icon: Building2,
                        title: "1. Company brief",
                        copy: "Choose an archetype, capture what the business does, who it serves, and the first operating focus.",
                      },
                      {
                        icon: Bot,
                        title: "2. CEO setup",
                        copy: "Choose the runtime, test the environment, and create the first CEO agent.",
                      },
                      {
                        icon: Workflow,
                        title: "3. Starter execution",
                        copy: "Provision the company goal, optional starter project, and the first task queue automatically.",
                      },
                      {
                        icon: ShieldCheck,
                        title: "4. Govern and scale",
                        copy: "Invite teammates, review approvals, manage budgets, and add more agents over time.",
                      },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="flex gap-3 rounded-2xl border border-white/8 bg-white/4 p-4"
                      >
                        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/8">
                          <item.icon className="h-4 w-4 text-teal-200" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{item.title}</p>
                          <p className="mt-1 text-sm leading-6 text-stone-300">{item.copy}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                      <div className="flex items-center gap-2 text-teal-200">
                        <Network className="h-4 w-4" />
                        <p className="text-sm font-semibold">Multi-company foundation</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-stone-300">
                        Every signup maps cleanly to a company workspace with isolated goals, agents, issues, and audit history.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                      <div className="flex items-center gap-2 text-amber-200">
                        <Sparkles className="h-4 w-4" />
                        <p className="text-sm font-semibold">Template-ready onboarding</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-stone-300">
                        Start with guided setup now, then layer in packaged company templates and hosted workers next.
                      </p>
                    </div>
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
