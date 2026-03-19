import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { companyRoutes } from "../routes/companies.js";

const companyServiceMocks = {
  list: vi.fn(),
  stats: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  archive: vi.fn(),
  remove: vi.fn(),
};

const portabilityServiceMocks = {
  exportBundle: vi.fn(),
  previewImport: vi.fn(),
  importBundle: vi.fn(),
};

const accessServiceMocks = {
  canUser: vi.fn(),
  ensureMembership: vi.fn(),
  promoteInstanceAdmin: vi.fn(),
};

const logActivityMock = vi.fn();

vi.mock("../services/index.js", () => ({
  companyService: () => companyServiceMocks,
  companyPortabilityService: () => portabilityServiceMocks,
  accessService: () => accessServiceMocks,
  logActivity: logActivityMock,
}));

function createTestApp(actor: Record<string, unknown>) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as any).actor = actor;
    next();
  });
  app.use("/api/companies", companyRoutes({} as any));
  return app;
}

describe("company bootstrap creation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("promotes the first hosted user when creating the first company", async () => {
    companyServiceMocks.list.mockResolvedValue([]);
    companyServiceMocks.create.mockResolvedValue({
      id: "company-1",
      name: "Gentle Play",
      issuePrefix: "GPL",
    });
    accessServiceMocks.ensureMembership.mockResolvedValue({
      id: "membership-1",
    });

    const app = createTestApp({
      type: "board",
      userId: "user-1",
      source: "session",
      isInstanceAdmin: false,
      companyIds: [],
    });

    const res = await request(app).post("/api/companies").send({ name: "Gentle Play" });

    expect(res.status).toBe(201);
    expect(accessServiceMocks.promoteInstanceAdmin).toHaveBeenCalledWith("user-1");
    expect(accessServiceMocks.ensureMembership).toHaveBeenCalledWith(
      "company-1",
      "user",
      "user-1",
      "owner",
      "active",
    );
  });

  it("still rejects non-admin creation when a company already exists", async () => {
    companyServiceMocks.create.mockResolvedValue({
      id: "company-2",
      name: "Second Company",
      issuePrefix: "SEC",
    });
    accessServiceMocks.ensureMembership.mockResolvedValue({
      id: "membership-2",
    });
    companyServiceMocks.list.mockResolvedValue([{ id: "company-1" }]);

    const app = createTestApp({
      type: "board",
      userId: "user-2",
      source: "session",
      isInstanceAdmin: false,
      companyIds: [],
    });

    const res = await request(app).post("/api/companies").send({ name: "Second Company" });

    expect(res.status).toBe(201);
    expect(companyServiceMocks.create).toHaveBeenCalledWith({ name: "Second Company" });
    expect(accessServiceMocks.ensureMembership).toHaveBeenCalledWith(
      "company-2",
      "user",
      "user-2",
      "owner",
      "active",
    );
    expect(accessServiceMocks.promoteInstanceAdmin).not.toHaveBeenCalled();
  });
});
