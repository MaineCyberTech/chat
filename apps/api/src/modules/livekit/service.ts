import { createHmac, randomUUID } from "node:crypto";

const API_KEY = process.env.LIVEKIT_API_KEY ?? "";
const API_SECRET = process.env.LIVEKIT_API_SECRET ?? "";
const LIVEKIT_HOST = process.env.LIVEKIT_HOST ?? "http://localhost:7880";

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
    return generateLiveKitToken(API_KEY, API_SECRET, identity, roomName, name);
  }

  getWsUrl(): string {
    const hostUrl = LIVEKIT_HOST.replace("http://", "ws://").replace("https://", "wss://");
    return hostUrl;
  }

  isConfigured(): boolean {
    return !!(API_KEY && API_SECRET);
  }
}

export const liveKitService = new LiveKitService();
