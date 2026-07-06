import en from "./en.json";

const locales = { en } as const;
type Locale = keyof typeof locales;
type Messages = typeof en;

let currentLocale: Locale = "en";
let currentMessages: Messages = en;

export function t(key: string, params?: Record<string, string | number>): string {
  const keys = key.split(".");
  let value: unknown = currentMessages;
  for (const k of keys) {
    value = (value as Record<string, unknown>)?.[k];
  }
  if (typeof value !== "string") return key;
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (_, p) => String(params[p] ?? `{${p}}`));
}

export function setLocale(locale: Locale) {
  currentLocale = locale;
  currentMessages = locales[locale];
}
