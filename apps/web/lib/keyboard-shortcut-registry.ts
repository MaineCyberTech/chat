type Callback = () => void;

const registry: Record<string, Callback | null> = {
  searchOpen: null,
  channelUp: null,
  channelDown: null,
};

export function register(name: string, cb: Callback | null) {
  registry[name] = cb;
}

export function getCallback(name: string): Callback | null {
  return registry[name] ?? null;
}
