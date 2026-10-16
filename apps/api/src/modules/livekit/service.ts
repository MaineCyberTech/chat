import { createHmac, randomUUID } from "node:crypto";

// Expected env vars: LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_HOST (optional, default localhost:7880)
//
// Configuration is read lazily instead of at import time. This module is
// reachable from the route registry, so throwing here would stop the entire API
// from booting when LiveKit is not configured. Callers use `isConfigured()` and
// degrade instead.

function getApiKey(): string | undefined {
  return process.env.LIVEKIT_API_KEY;
}

function getApiSecret(): string | undefined {
  return process.env.LIVEKIT_API_SECRET;
}

function getHost(): string {
  return process.env.LIVEKIT_HOST ?? "http://localhost:7880";
}

function base64UrlEncode(data: string): string {
  return Buffer.from(data).toString("base64url").replace(/=+$/, "");
}

/**
 * Generate a LiveKit access token (JWT) for a user to join a room.
 * LiveKit tokens are standard JWTs with specific claims:
 *   - iss: API Key
 *   - sub: identity
 *   - name: display name
 *   - video: { room, roomJoin }
 *   - exp, nbf, jti
 */
function generateLiveKitToken(
  apiKey: string,
  apiSecret: string,
  identity: string,
  roomName: string,
  displayName?: string,
): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: apiKey,
    sub: identity,
    name: displayName ?? identity,
    video: { room: roomName, roomJoin: true },
    exp: now + 3600,
    nbf: now,
    jti: randomUUID(),
  };

  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const signature = createHmac("sha256", apiSecret)
    .update(`${headerEncoded}.${payloadEncoded}`)
    .digest("base64url");

  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

export class LiveKitService {
  generateToken(roomName: string, identity: string, name?: string): string {
    const apiKey = getApiKey();
    const apiSecret = getApiSecret();
    if (!apiKey || !apiSecret) {
      throw new Error(
        "LIVEKIT_API_KEY and LIVEKIT_API_SECRET are required for LiveKit token generation",
      );
    }
    return generateLiveKitToken(apiKey, apiSecret, identity, roomName, name);
  }

  getWsUrl(): string {
    const hostUrl = getHost().replace("http://", "ws://").replace("https://", "wss://");
    return hostUrl;
  }

  isConfigured(): boolean {
    return !!(getApiKey() && getApiSecret());
  }
}

export const liveKitService = new LiveKitService();
