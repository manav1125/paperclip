export type ProductGuideStep = {
  id: string;
  selector: string;
  title: string;
  description: string;
};

const GUIDE_VERSION = "v1";
const WORKSPACE_GUIDE_PENDING_KEY = `paperclip.workspaceGuide.${GUIDE_VERSION}.pendingCompanyId`;

export const WORKSPACE_GUIDE_STEPS: ProductGuideStep[] = [
  {
    id: "dashboard",
    selector: '[data-guide-id="dashboard"]',
    title: "Start each session on Dashboard",
    description:
      "Dashboard is your operating cockpit. It gives you the company health view and the step-by-step playbook for what to do next as you manage the system.",
  },
  {
    id: "new-issue",
    selector: '[data-guide-id="new-issue"]',
    title: "Start work from New Issue",
    description:
      "Every meaningful request should become an issue first. That gives your agents a clean brief, status tracking, and a place for comments and attachments.",
  },
  {
    id: "inbox",
    selector: '[data-guide-id="inbox"]',
    title: "Use Inbox as your command center",
    description:
      "Inbox is where failed runs, approvals, and important agent updates surface. If something feels off, check here before digging through the rest of the workspace.",
  },
  {
    id: "issues",
    selector: '[data-guide-id="issues"]',
    title: "Issues are the execution layer",
    description:
      "Turn ideas into scoped tasks here. Assign them to agents, attach context, and use comments to steer work without losing history.",
  },
  {
    id: "goals",
    selector: '[data-guide-id="goals"]',
    title: "Goals keep the company aligned",
    description:
      "Use goals for outcomes, not tasks. Agents and projects should roll up into a small set of clear business objectives.",
  },
  {
    id: "projects",
    selector: '[data-guide-id="projects-section"]',
    title: "Projects group related workstreams",
    description:
      "Projects are where you organize recurring bodies of work like marketing, fundraising, product, or operations. Keep issues and workspaces attached here when they belong together.",
  },
  {
    id: "agents",
    selector: '[data-guide-id="agents-section"]',
    title: "Agents are your operating roles",
    description:
      "Create focused agents with one clear lane each. Start small, then expand the org only after the first few roles are consistently useful.",
  },
  {
    id: "costs",
    selector: '[data-guide-id="costs"]',
    title: "Monitor spend and activity",
    description:
      "Costs and Activity help you see whether the system is working. Watch them closely in the first week so you can tune prompts, budgets, and role design early.",
  },
];

function completionKey(companyId: string) {
  return `paperclip.workspaceGuide.${GUIDE_VERSION}.completed:${companyId}`;
}

export function readPendingWorkspaceGuideCompanyId() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(WORKSPACE_GUIDE_PENDING_KEY);
  } catch {
    return null;
  }
}

export function writePendingWorkspaceGuideCompanyId(companyId: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (!companyId) {
      window.localStorage.removeItem(WORKSPACE_GUIDE_PENDING_KEY);
      return;
    }
    window.localStorage.setItem(WORKSPACE_GUIDE_PENDING_KEY, companyId);
  } catch {
    // Ignore storage failures in restricted environments.
  }
}

export function hasCompletedWorkspaceGuide(companyId: string) {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(completionKey(companyId)) === "1";
  } catch {
    return false;
  }
}

export function markWorkspaceGuideCompleted(companyId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(completionKey(companyId), "1");
  } catch {
    // Ignore storage failures in restricted environments.
  }
}
