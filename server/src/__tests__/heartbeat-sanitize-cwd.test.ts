import { describe, expect, it } from "vitest";
import { sanitizeConfiguredCwdForAgentHomeFallback } from "../services/heartbeat.ts";

describe("sanitizeConfiguredCwdForAgentHomeFallback", () => {
  it("drops macOS desktop paths when a linux host is using fallback agent home", () => {
    const result = sanitizeConfiguredCwdForAgentHomeFallback({
      adapterConfig: { cwd: "/Users/manavgupta/Documents/Paperclip", model: "claude-sonnet-4-6" },
      workspaceSource: "agent_home",
      workspaceCwd: "/paperclip/instances/render-prod/workspaces/abc",
      platform: "linux",
    });

    expect(result.adapterConfig.cwd).toBeUndefined();
    expect(result.adapterConfig.model).toBe("claude-sonnet-4-6");
    expect(result.warning).toContain("Ignoring configured working directory");
  });

  it("keeps configured cwd on matching desktop platforms", () => {
    const result = sanitizeConfiguredCwdForAgentHomeFallback({
      adapterConfig: { cwd: "/Users/manavgupta/Documents/Paperclip" },
      workspaceSource: "agent_home",
      workspaceCwd: "/Users/manavgupta/.paperclip/workspaces/abc",
      platform: "darwin",
    });

    expect(result.adapterConfig.cwd).toBe("/Users/manavgupta/Documents/Paperclip");
    expect(result.warning).toBeNull();
  });
});
