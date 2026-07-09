import en from "./en.json";
import es from "./es.json";
import fr from "./fr.json";
import de from "./de.json";
import ptBR from "./pt-BR.json";
import ja from "./ja.json";

export interface LocaleInfo {
  code: string;
  name: string;
  nativeName: string;
  direction: "ltr" | "rtl";
}

const localeMap: Record<string, LocaleInfo> = {
  en: { code: "en", name: "English", nativeName: "English", direction: "ltr" },
  es: { code: "es", name: "Spanish", nativeName: "Español", direction: "ltr" },
  fr: { code: "fr", name: "French", nativeName: "Français", direction: "ltr" },
  de: { code: "de", name: "German", nativeName: "Deutsch", direction: "ltr" },
  "pt-BR": { code: "pt-BR", name: "Portuguese (Brazil)", nativeName: "Português (Brasil)", direction: "ltr" },
  ja: { code: "ja", name: "Japanese", nativeName: "日本語", direction: "ltr" },
};

const locales = { en, es, fr, de, "pt-BR": ptBR, ja } as const;
type Locale = keyof typeof locales;
type Messages = typeof en;

let currentMessages: Messages = en;
let currentLocale: Locale = "en";

export function t(key: string, defaultValue?: string | Record<string, string | number>): string {
  const keys = key.split(".");
  let value: unknown = currentMessages;
  for (const k of keys) {
    value = (value as Record<string, unknown>)?.[k];
  }
  if (typeof value !== "string") {
    return (defaultValue ?? key) as string;
  }
  if (!defaultValue || typeof defaultValue === "string") return value;
  return value.replace(/\{(\w+)\}/g, (_, p) => String((defaultValue as Record<string, string | number>)[p] ?? `{${p}}`));
}

export function tn(key: string, count: number, params?: Record<string, string | number>): string {
  const pluralKey = count === 1 ? `${key}.one` : `${key}.other`;
  const result = t(pluralKey, { count: String(count), ...params });
  if (result === pluralKey) return t(key, { count: String(count), ...params });
  return result;
}

export function setLocale(locale: Locale) {
  if (!locales[locale]) {
    console.warn(`Locale "${locale}" not available, falling back to en`);
    currentLocale = "en";
    currentMessages = locales.en;
    return;
  }
  currentLocale = locale;
  currentMessages = locales[locale];
}

export function getLocale(): string {
  return currentLocale;
}

export function getLocaleInfo(locale: string): LocaleInfo {
  return (localeMap[locale] ?? localeMap.en) as LocaleInfo;
}

export function getAvailableLocales(): LocaleInfo[] {
  return Object.keys(locales).map((code) => getLocaleInfo(code));
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  try {
    return d.toLocaleDateString(currentLocale, options);
  } catch {
    return d.toLocaleDateString("en", options);
  }
}

export function formatNumber(n: number, options?: Intl.NumberFormatOptions): string {
  try {
    return new Intl.NumberFormat(currentLocale, options).format(n);
  } catch {
    return new Intl.NumberFormat("en", options).format(n);
  }
}
