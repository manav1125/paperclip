import { parseOnboardingGoalInput } from "./onboarding-goal";

export type OnboardingProfileDraft = {
  companyName: string;
  companyDescription: string;
  companyWebsite: string;
  targetCustomer: string;
  companyGoal: string;
  initialFocus: string;
  starterProjectName: string;
  starterRepoUrl: string;
  starterRepoRef: string;
};

const CEO_PERSONA_URL =
  "https://github.com/paperclipai/companies/blob/main/default/ceo/AGENTS.md";

function clean(value: string) {
  return value.trim();
}

function bullets(entries: Array<[label: string, value: string]>) {
  return entries
    .map(([label, value]) => {
      const trimmed = clean(value);
      return trimmed ? `- ${label}: ${trimmed}` : null;
    })
    .filter((value): value is string => value !== null);
}

function section(title: string, lines: string[]) {
  if (lines.length === 0) return [];
  return [`## ${title}`, "", ...lines, ""];
}

export function deriveStarterProjectName(input: OnboardingProfileDraft) {
  const explicit = clean(input.starterProjectName);
  if (explicit) return explicit;
  if (clean(input.initialFocus) || clean(input.starterRepoUrl)) {
    return `Launch ${clean(input.companyName) || "Company"}`;
  }
  return null;
}

export function hasStarterProjectInput(input: OnboardingProfileDraft) {
  return Boolean(
    deriveStarterProjectName(input) ||
      clean(input.initialFocus) ||
      clean(input.starterRepoUrl),
  );
}

export function buildCompanyGoalDraft(input: OnboardingProfileDraft) {
  const parsedGoal = parseOnboardingGoalInput(input.companyGoal);
  const title =
    parsedGoal.title ||
    (clean(input.initialFocus)
      ? `Execute the first operating focus for ${clean(input.companyName) || "the company"}`
      : `Launch ${clean(input.companyName) || "the company"}`);

  const briefLines = bullets([
    ["What we do", input.companyDescription],
    ["Website", input.companyWebsite],
    ["Target customer", input.targetCustomer],
    ["Initial operating focus", input.initialFocus],
  ]);

  const descriptionParts = [
    clean(parsedGoal.description ?? ""),
    ...section("Company Brief", briefLines),
  ].filter((value) => value.length > 0);

  return {
    title,
    description: descriptionParts.length > 0 ? descriptionParts.join("\n") : null,
  };
}

export function buildStarterProjectDescription(input: OnboardingProfileDraft) {
  const opening = clean(input.initialFocus) || clean(input.companyGoal);
  const briefLines = bullets([
    ["What we do", input.companyDescription],
    ["Target customer", input.targetCustomer],
    ["Website", input.companyWebsite],
    ["Repo", input.starterRepoUrl],
    ["Repo ref", input.starterRepoRef],
  ]);

  const lines = [
    opening,
    ...section("Execution Context", briefLines),
  ].filter((value) => value.length > 0);

  return lines.length > 0 ? lines.join("\n") : null;
}

export function buildStarterTaskTitle(input: OnboardingProfileDraft) {
  const companyName = clean(input.companyName) || "your company";
  const projectName = deriveStarterProjectName(input);
  if (projectName) return `Stand up ${projectName}`;
  return `Draft the operating plan for ${companyName}`;
}

export function buildStarterTaskDescription(input: OnboardingProfileDraft) {
  const companyName = clean(input.companyName) || "this company";
  const projectName = deriveStarterProjectName(input);
  const briefLines = bullets([
    ["What we do", input.companyDescription],
    ["Website", input.companyWebsite],
    ["Target customer", input.targetCustomer],
    ["Mission", input.companyGoal],
    ["Initial operating focus", input.initialFocus],
    ["Starter project", projectName ?? ""],
    ["Starter repo", input.starterRepoUrl],
    ["Repo ref", input.starterRepoRef],
  ]);

  const lines = [
    `You are the founding CEO for ${companyName}.`,
    "",
    ...section("Company Brief", briefLines),
    "## First Tasks",
    "",
    `1. Set yourself up as CEO. Use the persona found here: ${CEO_PERSONA_URL}`,
    "2. Create an operating plan for the next 30 days with clear priorities, hires, and execution milestones.",
    "3. If a starter project or repo is provided, make it the first concrete operating surface for the company.",
    "4. Hire a Founding Engineer agent and break the work into concrete projects and issues.",
    "5. Leave the company with a clear mission, roadmap, and staffed next steps.",
  ];

  return lines.join("\n");
}
