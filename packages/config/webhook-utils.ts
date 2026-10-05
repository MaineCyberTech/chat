import { createDecipheriv, createHash, createHmac } from "node:crypto";

export const MAX_RETRIES = 5;
export const BASE_DELAY_MS = 60_000;

const WEBHOOK_ENCRYPTION_ALGORITHM = "aes-256-gcm";

function deriveWebhookEncryptionKey(encryptionKey: string): Buffer {
  return createHash("sha256").update(encryptionKey).digest();
}

/**
 * Decrypt a webhook signing secret produced by the API's `encryptSecret`
 * (`iv:authTag:ciphertext`, all hex, AES-256-GCM). Shared so the worker can
 * sign deliveries/retries with the real secret rather than the ciphertext.
 */
export function decryptWebhookSecret(encrypted: string, encryptionKey: string): string {
  const key = deriveWebhookEncryptionKey(encryptionKey);
  const parts = encrypted.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted secret format");
  }
  const [ivHex, authTagHex, encryptedData] = parts;
  const decipher = createDecipheriv(WEBHOOK_ENCRYPTION_ALGORITHM, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  let plaintext = decipher.update(encryptedData, "hex", "utf8");
  plaintext += decipher.final("utf8");
  return plaintext;
}

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
    if (parsed.username || parsed.password) {
      return { valid: false, error: "Webhook URLs cannot contain credentials" };
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

/**
 * Redirect policy for webhook dispatch. SEC-P2-002 / WH-P2-002: a validated
 * public URL must never be silently redirected to an unvalidated destination
 * (e.g. an internal/metadata address), because `validateWebhookUrl` only checks
 * the URL that is dispatched, not the hop a redirect points at. With
 * `redirect: "manual"` the runtime returns the 3xx response instead of
 * following it, and callers treat any non-2xx as a delivery failure.
 */
export const WEBHOOK_REDIRECT_MODE = "manual" as const;

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
