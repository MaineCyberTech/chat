import { describe, it, expect, vi, beforeEach } from "vitest";
import { csrfProtection, csrfMiddleware, doubleSubmitCookieCsrf } from "../csrf.js";

type AnyObj = any;

vi.mock("node:crypto", () => ({
  randomBytes: vi.fn((size: number) => Buffer.alloc(size, 0x61)),
  timingSafeEqual: vi.fn((a: Buffer, b: Buffer) => {
    if (a.length !== b.length) return false;
    return a.toString("latin1") === b.toString("latin1");
  }),
}));

function mockReq(method = "GET", headers: Record<string, string> = {}, cookies: Record<string, string> = {}) {
  return {
    method,
    headers,
    cookies,
    ip: "127.0.0.1",
    path: "/test",
    csrfToken: undefined,
  } as AnyObj;
}

function mockRes() {
  const res = {
    cookie: vi.fn(() => res),
    status: vi.fn(() => res),
    json: vi.fn(() => res),
  };
  return res as AnyObj;
}

describe("csrfMiddleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates a token and sets it on req and res.locals", () => {
    const req = mockReq();
    const res = { locals: {} } as AnyObj;
    const next = vi.fn();

    csrfMiddleware(req, res, next);

    expect(req.csrfToken).toBeDefined();
    expect(typeof req.csrfToken).toBe("string");
    expect(res.locals.csrfToken).toBe(req.csrfToken);
    expect(next).toHaveBeenCalled();
  });
});

describe("csrfProtection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes through GET requests", () => {
    const middleware = csrfProtection();
    const req = mockReq("GET");
    const res = mockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("passes through HEAD requests", () => {
    const middleware = csrfProtection();
    const req = mockReq("HEAD");
    const res = mockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("passes through OPTIONS requests", () => {
    const middleware = csrfProtection();
    const req = mockReq("OPTIONS");
    const res = mockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("rejects POST without CSRF token", () => {
    const middleware = csrfProtection();
    const req = mockReq("POST");
    const res = mockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: "CSRF_INVALID" }) }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("accepts POST with matching cookie token", () => {
    const middleware = csrfProtection({ cookie: true });
    const req = mockReq("POST", { "x-csrf-token": "a".repeat(64) }, { csrf_token: "a".repeat(64) });
    const res = mockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("rejects POST with mismatched cookie token", () => {
    const middleware = csrfProtection({ cookie: true });
    const req = mockReq("POST", { "x-csrf-token": "a".repeat(64) }, { csrf_token: "b".repeat(64) });
    const res = mockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects POST with missing cookie token in cookie mode", () => {
    const middleware = csrfProtection({ cookie: true });
    const req = mockReq("POST", { "x-csrf-token": "a".repeat(64) });
    const res = mockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("accepts POST with csrfMiddleware token matching cookie token", () => {
    const middleware = csrfProtection({ cookie: true });
    const req = mockReq("POST", { "x-csrf-token": "a".repeat(64) }, { csrf_token: "a".repeat(64) });
    req.csrfToken = "a".repeat(64);
    const res = mockRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

describe("doubleSubmitCookieCsrf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets csrf_token cookie on GET requests", () => {
    const req = mockReq("GET");
    const res = mockRes();
    const next = vi.fn();

    doubleSubmitCookieCsrf(req, res, next);

    expect(res.cookie).toHaveBeenCalledWith(
      "csrf_token",
      expect.any(String),
      expect.objectContaining({
        httpOnly: false,
        sameSite: "strict",
      }),
    );
    expect(req.csrfToken).toBeDefined();
    expect(next).toHaveBeenCalled();
  });

  it("sets csrf_token cookie on HEAD requests", () => {
    const req = mockReq("HEAD");
    const res = mockRes();
    const next = vi.fn();

    doubleSubmitCookieCsrf(req, res, next);

    expect(res.cookie).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("sets csrf_token cookie on OPTIONS requests", () => {
    const req = mockReq("OPTIONS");
    const res = mockRes();
    const next = vi.fn();

    doubleSubmitCookieCsrf(req, res, next);

    expect(res.cookie).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("rejects POST without x-csrf-token header when cookie is set", () => {
    const req = mockReq("POST", {}, { csrf_token: "a".repeat(64) });
    const res = mockRes();
    const next = vi.fn();

    doubleSubmitCookieCsrf(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: "CSRF_INVALID" }) }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects POST without csrf_token cookie", () => {
    const req = mockReq("POST", { "x-csrf-token": "a".repeat(64) });
    const res = mockRes();
    const next = vi.fn();

    doubleSubmitCookieCsrf(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("accepts POST with matching cookie and header tokens", () => {
    const req = mockReq("POST", { "x-csrf-token": "a".repeat(64) }, { csrf_token: "a".repeat(64) });
    const res = mockRes();
    const next = vi.fn();

    doubleSubmitCookieCsrf(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("rejects POST with mismatched cookie and header tokens", () => {
    const req = mockReq("POST", { "x-csrf-token": "a".repeat(64) }, { csrf_token: "b".repeat(64) });
    const res = mockRes();
    const next = vi.fn();

    doubleSubmitCookieCsrf(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects PATCH without valid token", () => {
    const req = mockReq("PATCH", {}, { csrf_token: "a".repeat(64) });
    const res = mockRes();
    const next = vi.fn();

    doubleSubmitCookieCsrf(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects DELETE without valid token", () => {
    const req = mockReq("DELETE", {}, { csrf_token: "a".repeat(64) });
    const res = mockRes();
    const next = vi.fn();

    doubleSubmitCookieCsrf(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects cross-origin requests", () => {
    const req = mockReq("POST", { origin: "https://evil.com" }, { csrf_token: "a".repeat(64) });
    req.headers["x-csrf-token"] = "a".repeat(64);
    const res = mockRes();
    const next = vi.fn();

    doubleSubmitCookieCsrf(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: "CSRF_INVALID" }) }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("passes through first GET request when no cookie is set", () => {
    const req = mockReq("GET");
    const res = mockRes();
    const next = vi.fn();

    doubleSubmitCookieCsrf(req, res, next);

    expect(res.cookie).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
