import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockLogger, MockWorker, MockQueue, mockSupabaseClient, storageRemove } = vi.hoisted(() => {
  const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
  const MockWorker = vi.fn(() => ({ on: vi.fn() }));
  const MockQueue = vi.fn();
  const storageRemove = vi.fn().mockResolvedValue({ error: null });

  const mockSupabaseClient = {
    from: vi.fn(),
    schema: vi.fn(),
    storage: {
      from: vi.fn(() => ({ remove: storageRemove })),
    },
    rpc: vi.fn().mockResolvedValue({}),
  };

  return { mockLogger, MockWorker, MockQueue, mockSupabaseClient, storageRemove };
});

vi.mock("@chat/config/logger.js", () => ({ logger: mockLogger }));

vi.mock("@chat/config/env-schema.js", () => ({
  loadEnv: () => ({
    REDIS_URL: "redis://localhost:6379",
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "test-key",
  }),
}));

vi.mock("../lib/supabase.js", () => ({
  createSupabaseClient: () => mockSupabaseClient,
  executeWithCircuitBreaker: vi.fn(),
}));

vi.mock("bullmq", () => ({
  Queue: MockQueue,
  Worker: MockWorker,
}));

type QueryResult = { data: unknown; error: unknown };

function createChain(getResult: () => QueryResult, ranges?: Map<number, QueryResult>) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of [
    "select",
    "insert",
    "delete",
    "update",
    "eq",
    "not",
    "ilike",
    "lt",
    "gte",
    "in",
    "limit",
    "range",
    "abortSignal",
  ]) {
    chain[method] = vi.fn(() => chain);
  }
  chain.range = vi.fn((start: number) => {
    if (ranges) {
      chain.then = ((resolve: (value: QueryResult) => unknown) =>
        Promise.resolve(ranges.get(start) ?? { data: [], error: null }).then(
          resolve,
        )) as unknown as ReturnType<typeof vi.fn>;
    }
    return chain;
  });
  chain.then = ((resolve: (value: QueryResult) => unknown) =>
    Promise.resolve(getResult()).then(resolve)) as unknown as ReturnType<typeof vi.fn>;
  return chain;
}

function installSupabaseMock(options: {
  objects?: QueryResult;
  avatarPages?: Map<number, QueryResult>;
  messagePages?: Map<number, QueryResult>;
}) {
  const objectsChain = createChain(() => options.objects ?? { data: [], error: null });
  const usersChain = createChain(
    () => ({ data: [], error: null }),
    options.avatarPages ?? new Map([[0, { data: [], error: null }]]),
  );
  const messagesChain = createChain(
    () => ({ data: [], error: null }),
    options.messagePages ?? new Map([[0, { data: [], error: null }]]),
  );

  mockSupabaseClient.from.mockImplementation((table: string) => {
    if (table === "users") return usersChain;
    if (table === "messages") return messagesChain;
    return createChain(() => ({ data: [], error: null }));
  });
  mockSupabaseClient.schema.mockReturnValue({
    from: vi.fn(() => objectsChain),
  });

  return { objectsChain, usersChain, messagesChain };
}

describe("cleanup processor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    storageRemove.mockResolvedValue({ error: null });
    mockSupabaseClient.from.mockImplementation(() =>
      createChain(() => ({ data: [], error: null })),
    );
    mockSupabaseClient.schema.mockReturnValue({
      from: vi.fn(() => createChain(() => ({ data: [], error: null }))),
    });
  });

  it("creates cleanup queue with correct name", async () => {
    await import("../processors/cleanup.js");
    expect(MockQueue).toHaveBeenCalledWith(
      "cleanup",
      expect.objectContaining({ defaultJobOptions: expect.any(Object) }),
    );
  });

  it("registers worker for cleanup queue", async () => {
    const { registerCleanupProcessor } = await import("../processors/cleanup.js");
    const worker = registerCleanupProcessor();
    expect(worker).toBeDefined();
    expect(MockWorker).toHaveBeenCalledWith(
      "cleanup",
      expect.any(Function),
      expect.objectContaining({ concurrency: 1 }),
    );
  });

  it("handles old_deliveries job type", async () => {
    const { registerCleanupProcessor } = await import("../processors/cleanup.js");
    registerCleanupProcessor();
    const handler = (
      MockWorker.mock.calls[0] as unknown as [unknown, (job: unknown) => Promise<unknown>]
    )?.[1];
    const result = await handler!({
      data: { type: "old_deliveries", olderThanDays: 30 },
      id: "job-1",
    });
    expect(result).toBeDefined();
  });

  it("deletes only unreferenced uploads and keeps avatars and attachments", async () => {
    installSupabaseMock({
      objects: {
        data: [
          { name: "avatars/a0000001.png" },
          { name: "attachments/a b.pdf" },
          { name: "orphans/orphan.png" },
        ],
        error: null,
      },
      avatarPages: new Map([
        [
          0,
          {
            data: [
              {
                avatar_url:
                  "https://project.supabase.co/storage/v1/object/sign/chat-uploads/avatars/a0000001.png?token=abc",
              },
            ],
            error: null,
          },
        ],
      ]),
      messagePages: new Map([
        [
          0,
          {
            data: [
              {
                content:
                  "See [the file](https://project.supabase.co/storage/v1/object/public/chat-uploads/attachments/a%20b.pdf?download=1).",
              },
            ],
            error: null,
          },
        ],
      ]),
    });

    const { cleanupStaleUploads } = await import("../processors/cleanup.js");
    const cleaned = await cleanupStaleUploads(mockSupabaseClient as never, 7);

    expect(cleaned).toBe(1);
    expect(storageRemove).toHaveBeenCalledTimes(1);
    expect(storageRemove).toHaveBeenCalledWith(["orphans/orphan.png"]);
  });

  it("deletes all candidates when no profile or message references them", async () => {
    installSupabaseMock({
      objects: {
        data: [{ name: "orphans/one.png" }, { name: "orphans/two.png" }],
        error: null,
      },
    });

    const { cleanupStaleUploads } = await import("../processors/cleanup.js");
    const cleaned = await cleanupStaleUploads(mockSupabaseClient as never, 7);

    expect(cleaned).toBe(2);
    expect(storageRemove).toHaveBeenCalledWith(["orphans/one.png", "orphans/two.png"]);
  });

  it("keeps the 200 candidate limit and paginates reference lookups", async () => {
    const candidates = [
      { name: "avatars/late.png" },
      ...Array.from({ length: 199 }, (_, index) => ({ name: `orphans/${index}.png` })),
    ];
    const firstAvatarPage = {
      data: Array.from({ length: 1000 }, () => ({ avatar_url: "https://example.com/avatar" })),
      error: null,
    };
    const secondAvatarPage = {
      data: [
        {
          avatar_url:
            "https://project.supabase.co/storage/v1/object/sign/chat-uploads/avatars/late.png?token=xyz",
        },
      ],
      error: null,
    };

    const { objectsChain, usersChain, messagesChain } = installSupabaseMock({
      objects: { data: candidates, error: null },
      avatarPages: new Map([
        [0, firstAvatarPage],
        [1000, secondAvatarPage],
      ]),
    });

    const { cleanupStaleUploads } = await import("../processors/cleanup.js");
    const cleaned = await cleanupStaleUploads(mockSupabaseClient as never, 7);

    expect(objectsChain.limit).toHaveBeenCalledWith(200);
    expect(usersChain.range).toHaveBeenCalledWith(0, 999);
    expect(usersChain.range).toHaveBeenCalledWith(1000, 1999);
    expect(messagesChain.range).toHaveBeenCalledWith(0, 999);
    expect(cleaned).toBe(199);
    expect(storageRemove).toHaveBeenCalledTimes(1);
    expect(storageRemove.mock.calls[0]?.[0]).not.toContain("avatars/late.png");
  });

  it("fails closed and deletes nothing when references cannot be read", async () => {
    installSupabaseMock({
      objects: { data: [{ name: "orphans/one.png" }], error: null },
      avatarPages: new Map([[0, { data: null, error: new Error("db unavailable") }]]),
    });

    const { cleanupStaleUploads } = await import("../processors/cleanup.js");
    const cleaned = await cleanupStaleUploads(mockSupabaseClient as never, 7);

    expect(cleaned).toBe(0);
    expect(storageRemove).not.toHaveBeenCalled();
  });
});

describe("extractChatUploadPaths", () => {
  it("handles public, signed, encoded and query-string URLs", async () => {
    const { extractChatUploadPaths } = await import("../processors/cleanup.js");

    const paths = extractChatUploadPaths(
      [
        "https://x.test/storage/v1/object/public/chat-uploads/attachments/report.pdf",
        "https://x.test/storage/v1/object/sign/chat-uploads/avatars/a%201.png?token=abc",
        "inline /chat-uploads/folder/with%20space.txt#fragment",
      ].join(" "),
    );

    expect(paths).toEqual(
      expect.arrayContaining([
        "attachments/report.pdf",
        "avatars/a 1.png",
        "folder/with space.txt",
      ]),
    );
  });
});
