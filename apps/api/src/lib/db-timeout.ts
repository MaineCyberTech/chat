const DEFAULT_TIMEOUT = 10000;

type Thenable<T> = Promise<T> | { then: (resolve: (value: T) => void, reject: (reason: unknown) => void) => void };

export async function queryWithTimeout<T>(
  thenable: Thenable<{ data: T | null; error: unknown }>,
  timeoutMs = DEFAULT_TIMEOUT,
): Promise<{ data: T | null; error: unknown }> {
  const promise = Promise.resolve(thenable);
  const result = await Promise.race([
    promise,
    new Promise<{ data: null; error: Error }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error("Query timeout") }), timeoutMs),
    ),
  ]);
  return result;
}
