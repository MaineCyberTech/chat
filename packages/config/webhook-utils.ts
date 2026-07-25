import { createHmac } from "node:crypto";

export const MAX_RETRIES = 5;
export const BASE_DELAY_MS = 60_000;

const PRIVATE_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/,
  /^fe80:/,
];

export function isPrivateIp(hostname: string): boolean {
  return PRIVATE_IP_RANGES.some((range) => range.test(hostname));
}

export async function resolveHostname(url: string): Promise<string[]> {
  try {
    const { hostname } = new URL(url);
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname) || /^\[.+\]$/.test(hostname)) {
      return [hostname.replace(/[[\]]/g, "")];
    }
    const dns = await import("node:dns/promises");
    const records = await dns.resolve4(hostname);
    return records;
  } catch {
    return [];
  }
}

export async function validateWebhookUrl(url: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") {
      return { valid: false, error: "Only HTTPS URLs are allowed" };
    }
    if (isPrivateIp(parsed.hostname)) {
      return { valid: false, error: "Webhook URLs cannot point to private/internal IP addresses" };
    }
    const ips = await resolveHostname(url);
    for (const ip of ips) {
      if (isPrivateIp(ip)) {
        return { valid: false, error: "Webhook URL resolves to private/internal IP address" };
      }
    }
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid webhook URL" };
  }
}

export function computeHmacSignature(
  secret: string,
  payload: Record<string, unknown>,
  event: string,
): string {
  const hmac = createHmac("sha256", secret);
  hmac.update(JSON.stringify({ event, ...payload }));
  return `sha256=${hmac.digest("hex")}`;
}

export function buildWebhookPayload(event: string, payload: Record<string, unknown>): string {
  return JSON.stringify({ event, ...payload });
}
