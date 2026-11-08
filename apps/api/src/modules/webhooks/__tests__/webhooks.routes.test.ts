import { describe, it, expect, vi, beforeEach } from "vitest";
import webhooksRouter from "../routes.js";
import { errorHandler } from "../../../middleware/error-handler.js";

const { mockWebhookService, mockValidateUrl } = vi.hoisted(() => ({
  mockWebhookService: {
    listByWorkspace: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    listDeliveries: vi.fn(),
  },
  mockValidateUrl: vi.fn(async () => ({ valid: true })),
}));

vi.mock("../service.js", () => ({
  webhookService: mockWebhookService,
  validateWebhookUrl: mockValidateUrl,
}));

vi.mock("../../../services/audit.js", () => ({ logAuditEvent: vi.fn() }));

type MockChain = { [key: string]: any; then: (fn: (v: unknown) => unknown) => Promise<unknown> };

function createChain(result: unknown): MockChain {
  const chain: any = {};
  for (const method of [
    "select",
    "eq",
    "in",
    "order",
    "limit",
    "single",
    "insert",
    "update",
    "delete",
    "is",
    "or",
    "gt",
    "lt",
    "contains",
    "lte",
    "range",
  ]) {
    chain[method] = vi.fn(() => chain);
  }
  chain.then = (onfulfilled: (v: unknown) => unknown) => Promise.resolve(result).then(onfulfilled);
  return chain;
}

function mockReq(overrides: Record<string, unknown> = {}) {
  return {
    userId: "user-1",
    supabase: {
      from: vi.fn(() => createChain({ data: { role: "member" }, error: null })),
    },
    query: {},
    body: {},
    params: {},
    headers: {},
    path: "/webhooks",
    ...overrides,
  } as any;
}

function mockRes() {
  const res: Record<string, ReturnType<typeof vi.fn>> = {};
  res.status = vi.fn(() => res) as any;
  res.json = vi.fn(() => res) as any;
  res.send = vi.fn(() => res) as any;
  return res as any;
}

function findHandler(method: string, path: string) {
  const m = method.toLowerCase();
  for (const layer of (webhooksRouter as any).stack) {
    if (layer.route && layer.route.path === path && layer.route.methods?.[m]) {
      return layer.route.stack[layer.route.stack.length - 1].handle;
    }
  }
  return null;
}

async function callHandler(handler: any, req: any, res: any) {
  const next = vi.fn();
  await handler(req, res, next);
  if (next.mock.calls.length > 0) {
    const err = next.mock.calls[0][0];
    errorHandler(err, req, res, vi.fn());
  }
}

const workspaceId = "00000000-0000-4000-8000-000000000001";
const webhook = {
  id: "00000000-0000-4000-8000-000000000002",
  workspace_id: workspaceId,
  name: "Ops",
  url: "https://example.com/hook",
  secret: "secret-value-123456",
  events: ["message.created"],
  is_active: true,
};
const createBody = {
  workspace_id: workspaceId,
  name: "Ops",
  url: "https://example.com/hook",
  secret: "a".repeat(16),
  events: ["message.created"],
};

describe("webhook CRUD authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateUrl.mockResolvedValue({ valid: true });
  });

  it("denies a regular member creating a webhook", async () => {
    const handler = findHandler("post", "/webhooks");
    const req = mockReq({ body: createBody });
    const res = mockRes();

    await callHandler(handler, req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockWebhookService.create).not.toHaveBeenCalled();
  });

  it("allows a workspace admin to create a webhook", async () => {
    const membership = createChain({ data: { role: "admin" }, error: null });
    mockWebhookService.create.mockResolvedValue(webhook);
    const handler = findHandler("post", "/webhooks");
    const req = mockReq({
      body: createBody,
      supabase: { from: vi.fn(() => membership) },
    });
    const res = mockRes();

    await callHandler(handler, req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockWebhookService.create).toHaveBeenCalledWith({
      ...createBody,
      created_by: "user-1",
    });
  });

  it("denies a regular member updating a webhook", async () => {
    mockWebhookService.getById.mockResolvedValue(webhook);
    const handler = findHandler("patch", "/webhooks/:id");
    const req = mockReq({ params: { id: webhook.id }, body: { name: "Renamed" } });
    const res = mockRes();

    await callHandler(handler, req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockWebhookService.update).not.toHaveBeenCalled();
  });

  it("allows a workspace owner to update a webhook", async () => {
    mockWebhookService.getById.mockResolvedValue(webhook);
    mockWebhookService.update.mockResolvedValue({ ...webhook, name: "Renamed" });
    const membership = createChain({ data: { role: "owner" }, error: null });
    const handler = findHandler("patch", "/webhooks/:id");
    const req = mockReq({
      params: { id: webhook.id },
      body: { name: "Renamed" },
      supabase: { from: vi.fn(() => membership) },
    });
    const res = mockRes();

    await callHandler(handler, req, res);

    expect(mockWebhookService.update).toHaveBeenCalledWith(webhook.id, { name: "Renamed" });
    expect(res.json).toHaveBeenCalled();
  });

  it("denies a regular member deleting a webhook", async () => {
    mockWebhookService.getById.mockResolvedValue(webhook);
    const handler = findHandler("delete", "/webhooks/:id");
    const req = mockReq({ params: { id: webhook.id } });
    const res = mockRes();

    await callHandler(handler, req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockWebhookService.remove).not.toHaveBeenCalled();
  });

  it("rejects a non-member even for read routes via the query guard", async () => {
    const membership = createChain({ data: null, error: { message: "no rows" } });
    const route = (webhooksRouter as any).stack.find(
      (layer: any) => layer.route?.path === "/webhooks" && layer.route.methods?.get,
    );
    const guard = route.route.stack[0].handle;
    const req = mockReq({
      query: { workspace_id: workspaceId },
      supabase: { from: vi.fn(() => membership) },
    });
    const res = mockRes();

    await guard(req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockWebhookService.listByWorkspace).not.toHaveBeenCalled();
  });
});
