const DEFAULT_TIMEOUT = 10000;

export async function queryWithTimeout<T>(
  promise: Promise<{ data: T | null; error: unknown }>,
  timeoutMs = DEFAULT_TIMEOUT,
): Promise<{ data: T | null; error: unknown }> {
  const result = await Promise.race([
    promise,
    new Promise<{ data: null; error: Error }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error("Query timeout") }), timeoutMs),
    ),
  ]);
  return result;
}
