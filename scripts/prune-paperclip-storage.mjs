import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const INSTANCE_ID_RE = /^[a-zA-Z0-9_-]+$/;

function asInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function resolvePaperclipHome() {
  const configured = String(process.env.PAPERCLIP_HOME ?? "").trim();
  if (configured) return path.resolve(configured);
  return path.resolve(os.homedir(), ".paperclip");
}

function resolveInstanceId() {
  const raw = String(process.env.PAPERCLIP_INSTANCE_ID ?? "default").trim() || "default";
  return INSTANCE_ID_RE.test(raw) ? raw : "default";
}

function retentionCutoffMs(days) {
  const safeDays = Math.max(0, days);
  return Date.now() - safeDays * 24 * 60 * 60 * 1000;
}

async function pathExists(target) {
  return fs
    .stat(target)
    .then(() => true)
    .catch(() => false);
}

async function removeRecursively(target) {
  await fs.rm(target, { recursive: true, force: true });
}

async function pruneWorkspaceDirs(workspacesDir, opts) {
  const { retentionDays, maxDirs } = opts;
  if (!(await pathExists(workspacesDir))) return { deleted: 0 };

  const entries = await fs.readdir(workspacesDir, { withFileTypes: true });
  const dirs = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const absolute = path.join(workspacesDir, entry.name);
    const stat = await fs.stat(absolute).catch(() => null);
    if (!stat) continue;
    dirs.push({ absolute, mtimeMs: stat.mtimeMs });
  }

  dirs.sort((a, b) => a.mtimeMs - b.mtimeMs);
  const cutoffMs = retentionCutoffMs(retentionDays);

  const stale = dirs.filter((dir) => dir.mtimeMs < cutoffMs);
  const overflowCount = Math.max(0, dirs.length - Math.max(0, maxDirs));
  const overflow = overflowCount > 0 ? dirs.slice(0, overflowCount) : [];

  const toDelete = new Set([...stale.map((d) => d.absolute), ...overflow.map((d) => d.absolute)]);
  for (const target of toDelete) {
    await removeRecursively(target);
  }
  return { deleted: toDelete.size };
}

async function pruneOldFiles(rootDir, retentionDays, opts = {}) {
  const keepBasenames = new Set(
    Array.isArray(opts.keepBasenames)
      ? opts.keepBasenames.filter((v) => typeof v === "string")
      : [],
  );
  if (!(await pathExists(rootDir))) return { deleted: 0 };
  const cutoffMs = retentionCutoffMs(retentionDays);
  let deleted = 0;

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(absolute);
        continue;
      }
      if (keepBasenames.has(entry.name)) continue;
      const stat = await fs.stat(absolute).catch(() => null);
      if (!stat) continue;
      if (stat.mtimeMs < cutoffMs) {
        await fs.rm(absolute, { force: true });
        deleted += 1;
      }
    }
  }

  await walk(rootDir);
  return { deleted };
}

async function pruneKnownLargeDirs(baseDir, relativeDirs) {
  if (!(await pathExists(baseDir))) return { deleted: 0 };
  let deleted = 0;
  for (const relDir of relativeDirs) {
    const absolute = path.resolve(baseDir, relDir);
    if (!(await pathExists(absolute))) continue;
    await removeRecursively(absolute);
    deleted += 1;
  }
  return { deleted };
}

async function trimServerLog(logFilePath, maxMb) {
  const maxBytes = Math.max(1, maxMb) * 1024 * 1024;
  const stat = await fs.stat(logFilePath).catch(() => null);
  if (!stat || stat.size <= maxBytes) return false;
  await fs.truncate(logFilePath, 0);
  return true;
}

async function main() {
  const enabled = String(process.env.PAPERCLIP_STARTUP_PRUNE ?? "true").toLowerCase() !== "false";
  if (!enabled) {
    console.log("[paperclip] Startup prune disabled.");
    return;
  }

  const home = resolvePaperclipHome();
  const instanceId = resolveInstanceId();
  const instanceRoot = path.resolve(home, "instances", instanceId);
  const workspacesDir = path.resolve(instanceRoot, "workspaces");
  const runLogsDir = String(process.env.RUN_LOG_BASE_PATH ?? "").trim()
    ? path.resolve(String(process.env.RUN_LOG_BASE_PATH))
    : path.resolve(instanceRoot, "data", "run-logs");
  const serverLogPath = path.resolve(instanceRoot, "logs", "server.log");
  const claudeHome = path.resolve(home, ".claude");
  const codexHome = path.resolve(home, ".codex");

  const workspaceRetentionDays = asInt(process.env.PAPERCLIP_WORKSPACE_RETENTION_DAYS, 3);
  const workspaceMaxDirs = asInt(process.env.PAPERCLIP_WORKSPACE_MAX_DIRS, 200);
  const runLogRetentionDays = asInt(process.env.PAPERCLIP_RUN_LOG_RETENTION_DAYS, 7);
  const maxServerLogMb = asInt(process.env.PAPERCLIP_SERVER_LOG_MAX_MB, 64);
  const claudeHomeRetentionDays = asInt(process.env.PAPERCLIP_CLAUDE_HOME_RETENTION_DAYS, 2);
  const codexHomeRetentionDays = asInt(process.env.PAPERCLIP_CODEX_HOME_RETENTION_DAYS, 2);

  const workspaceResult = await pruneWorkspaceDirs(workspacesDir, {
    retentionDays: workspaceRetentionDays,
    maxDirs: workspaceMaxDirs,
  });
  const runLogResult = await pruneOldFiles(runLogsDir, runLogRetentionDays);
  const claudeFilesResult = await pruneOldFiles(claudeHome, claudeHomeRetentionDays, {
    keepBasenames: ["auth.json", "settings.json"],
  });
  const codexFilesResult = await pruneOldFiles(codexHome, codexHomeRetentionDays, {
    keepBasenames: ["auth.json", "config.json", "settings.json", "memory.md"],
  });
  const claudeHeavyDirsResult = await pruneKnownLargeDirs(claudeHome, [
    "projects",
    "cache",
    "statsig",
    "tmp",
  ]);
  const codexHeavyDirsResult = await pruneKnownLargeDirs(codexHome, [
    "sessions",
    "logs",
    "tmp",
    "history",
  ]);
  const logTrimmed = await trimServerLog(serverLogPath, maxServerLogMb);

  console.log(
    `[paperclip] Startup prune complete: deleted ${workspaceResult.deleted} workspace dir(s), ` +
      `${runLogResult.deleted} old run-log file(s), ` +
      `${claudeFilesResult.deleted} old Claude file(s), ${codexFilesResult.deleted} old Codex file(s), ` +
      `${claudeHeavyDirsResult.deleted} Claude cache dir(s), ${codexHeavyDirsResult.deleted} Codex cache dir(s), ` +
      `server.log trimmed=${logTrimmed}.`,
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[paperclip] Startup prune failed: ${message}`);
  process.exit(0);
});
