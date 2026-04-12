import type { OnboardingProfileDraft } from "./onboarding-profile";

export type CompanyArchetypeId =
  | "custom"
  | "saas_studio"
  | "agency_ops"
  | "commerce_engine"
  | "media_engine";

type ArchetypeIssueTemplate = {
  title: string;
  description: string;
};

export type CompanyArchetype = {
  id: CompanyArchetypeId;
  name: string;
  strapline: string;
  description: string;
  defaults: Partial<
    Pick<
      OnboardingProfileDraft,
      | "companyDescription"
      | "targetCustomer"
      | "companyGoal"
      | "initialFocus"
      | "starterProjectName"
    >
  > & {
    budgetUsd?: string;
  };
  starterBacklog: ArchetypeIssueTemplate[];
};

function interpolate(template: string, input: OnboardingProfileDraft) {
  const companyName = input.companyName.trim() || "the company";
  const projectName = input.starterProjectName.trim() || "the first operating system";
  return template
    .replaceAll("{{companyName}}", companyName)
    .replaceAll("{{projectName}}", projectName);
}

export const COMPANY_ARCHETYPES: CompanyArchetype[] = [
  {
    id: "custom",
    name: "Custom",
    strapline: "Start from scratch",
    description: "Use your own mission, structure, and setup with no preset operating assumptions.",
    defaults: {},
    starterBacklog: [],
  },
  {
    id: "saas_studio",
    name: "SaaS Studio",
    strapline: "Product-led software company",
    description:
      "Best for launching an AI-native SaaS product with a clear ICP, roadmap, onboarding flow, and growth loop.",
    defaults: {
      companyDescription:
        "We are building a focused software product that turns a painful workflow into a repeatable, AI-powered system.",
      targetCustomer: "Ops-heavy SMB or mid-market teams with expensive manual workflows",
      companyGoal:
        "Reach product-market fit with a clear value proposition, a repeatable onboarding flow, and the first cohort of paying customers.",
      initialFocus:
        "Sharpen the ICP, define the core product promise, stand up the execution roadmap, and ship the first high-value workflow end to end.",
      starterProjectName: "Launch the core product experience",
      budgetUsd: "1500",
    },
    starterBacklog: [
      {
        title: "Define the ICP and pricing hypothesis for {{companyName}}",
        description:
          "Document the initial customer profile, buying triggers, main alternatives, and a first-pass pricing model for {{companyName}}.",
      },
      {
        title: "Map the activation funnel for {{projectName}}",
        description:
          "Break the first-user experience into acquisition, onboarding, activation, and retention checkpoints. Highlight the most fragile step.",
      },
      {
        title: "Draft a 30-day roadmap for {{companyName}}",
        description:
          "Turn the mission into a concrete 30-day operating plan with milestones, ownership, and success metrics.",
      },
    ],
  },
  {
    id: "agency_ops",
    name: "Agency Ops",
    strapline: "Service delivery company",
    description:
      "For client-service businesses that need lead gen, delivery systems, reporting, and repeatable account operations.",
    defaults: {
      companyDescription:
        "We run an AI-augmented service business that delivers measurable outcomes for clients through repeatable systems and expert execution.",
      targetCustomer: "Founder-led businesses that want premium execution without building a large internal team",
      companyGoal:
        "Build a dependable client acquisition and delivery engine with strong positioning, clean SOPs, and a scalable account workflow.",
      initialFocus:
        "Clarify the offer, standardize delivery, create a reporting cadence, and set up a healthy lead-to-delivery pipeline.",
      starterProjectName: "Stand up the client delivery engine",
      budgetUsd: "1000",
    },
    starterBacklog: [
      {
        title: "Package the flagship offer for {{companyName}}",
        description:
          "Define the service offer, target client profile, expected outcomes, pricing logic, and proof points for the flagship engagement.",
      },
      {
        title: "Create the client delivery operating cadence",
        description:
          "Design weekly rhythms, status reporting, handoffs, and escalation paths so client work can run predictably inside {{companyName}}.",
      },
      {
        title: "Build the outbound and referral pipeline plan",
        description:
          "Outline the first acquisition channels, referral loops, case-study strategy, and a simple revenue forecast.",
      },
    ],
  },
  {
    id: "commerce_engine",
    name: "Commerce Engine",
    strapline: "E-commerce operating team",
    description:
      "For brands or operators coordinating merchandising, lifecycle marketing, support, and conversion work across a store.",
    defaults: {
      companyDescription:
        "We operate a commerce business and use agents to improve conversion, retention, merchandising, support, and operations.",
      targetCustomer: "Online brands with growing traffic and meaningful repeat-purchase potential",
      companyGoal:
        "Increase revenue efficiency by tightening the core store funnel, repeat purchase systems, and operating visibility.",
      initialFocus:
        "Audit the revenue funnel, identify the largest leaks, improve lifecycle systems, and create a weekly operating dashboard.",
      starterProjectName: "Optimize the storefront and retention loop",
      budgetUsd: "1200",
    },
    starterBacklog: [
      {
        title: "Audit the conversion funnel for {{companyName}}",
        description:
          "Review landing, product, cart, checkout, and post-purchase moments. Identify the largest friction points and highest-leverage experiments.",
      },
      {
        title: "Design the lifecycle marketing engine",
        description:
          "Map win-back, post-purchase, abandoned cart, and VIP flows for {{companyName}} with the data and assets each flow needs.",
      },
      {
        title: "Build the weekly commerce scorecard",
        description:
          "Define the KPIs, reporting rhythm, and ownership model for the weekly operating review across acquisition, conversion, retention, and support.",
      },
    ],
  },
  {
    id: "media_engine",
    name: "Media Engine",
    strapline: "Content and distribution business",
    description:
      "For creator, newsletter, research, or media companies that need editorial planning, distribution, and monetization systems.",
    defaults: {
      companyDescription:
        "We run a content-driven business and use agents to handle editorial planning, asset production, distribution, and monetization workflows.",
      targetCustomer: "Audience-first businesses monetized through subscriptions, sponsorships, services, or premium products",
      companyGoal:
        "Build a durable content machine that compounds audience growth, publishing consistency, and monetization quality.",
      initialFocus:
        "Define the editorial thesis, establish the publishing cadence, create the distribution engine, and build the monetization roadmap.",
      starterProjectName: "Stand up the editorial and distribution system",
      budgetUsd: "800",
    },
    starterBacklog: [
      {
        title: "Define the editorial thesis for {{companyName}}",
        description:
          "Clarify the audience, core narrative territory, publishing promise, and the types of content that should compound authority.",
      },
      {
        title: "Design the weekly publishing system",
        description:
          "Create the recurring workflow for ideation, drafting, editing, asset production, publishing, and review for {{companyName}}.",
      },
      {
        title: "Map the audience growth and monetization plan",
        description:
          "Outline the primary distribution channels, conversion points, sponsorship opportunities, and premium offers that should power growth.",
      },
    ],
  },
];

export function getCompanyArchetype(id: CompanyArchetypeId | string | null | undefined) {
  return COMPANY_ARCHETYPES.find((archetype) => archetype.id === id) ?? COMPANY_ARCHETYPES[0];
}

export function buildArchetypeBacklogIssues(
  archetypeId: CompanyArchetypeId | string | null | undefined,
  input: OnboardingProfileDraft,
) {
  const archetype = getCompanyArchetype(archetypeId);
  if (!archetype || archetype.id === "custom") return [];
  return archetype.starterBacklog.map((issue) => ({
    title: interpolate(issue.title, input),
    description: interpolate(issue.description, input),
  }));
}
