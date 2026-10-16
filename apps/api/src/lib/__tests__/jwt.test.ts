import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import {
  signJwt,
  verifyJwt,
  decodeJwtUnsafe,
  ACCESS_TOKEN_TTL_SECONDS,
  type JwtClaims,
} from "../jwt.js";

const SECRET = "test-secret-value-that-is-at-least-32-characters";

function b64(input: unknown): string {
  return Buffer.from(JSON.stringify(input)).toString("base64url");
}

describe("jwt", () => {
  describe("signJwt / verifyJwt", () => {
    it("round-trips claims", () => {
      const token = signJwt({ sub: "user-1", role: "authenticated", email: "a@b.test" }, SECRET);

      const claims = verifyJwt(token, SECRET);

      expect(claims).not.toBeNull();
      expect(claims!.sub).toBe("user-1");
      expect(claims!.role).toBe("authenticated");
      expect(claims!.email).toBe("a@b.test");
    });

    it("sets iat and exp from the ttl", () => {
      const before = Math.floor(Date.now() / 1000);
      const token = signJwt({ role: "anon" }, SECRET, 120);
      const claims = verifyJwt(token, SECRET);

      expect(claims!.exp! - claims!.iat!).toBe(120);
      expect(claims!.iat).toBeGreaterThanOrEqual(before);
    });

    it("defaults to the access-token ttl", () => {
      const token = signJwt({ role: "anon" }, SECRET);
      const claims = verifyJwt(token, SECRET);
      expect(claims!.exp! - claims!.iat!).toBe(ACCESS_TOKEN_TTL_SECONDS);
    });

    it("produces a three-part token", () => {
      expect(signJwt({ role: "anon" }, SECRET).split(".")).toHaveLength(3);
    });

    it("refuses to sign with a short secret", () => {
      expect(() => signJwt({ role: "anon" }, "too-short")).toThrow(/at least 32/);
    });
  });

  describe("rejects", () => {
    it("a token signed with a different secret", () => {
      const token = signJwt({ role: "anon" }, SECRET);
      expect(verifyJwt(token, "another-secret-that-is-also-32-chars-long")).toBeNull();
    });

    it("a tampered payload", () => {
      const token = signJwt({ sub: "user-1", role: "anon" }, SECRET);
      const [header, , signature] = token.split(".");
      const forged = `${header}.${b64({ sub: "admin", role: "service_role", exp: 9999999999 })}.${signature}`;

      expect(verifyJwt(forged, SECRET)).toBeNull();
    });

    it("an alg:none token", () => {
      const forged = `${b64({ alg: "none", typ: "JWT" })}.${b64({
        sub: "attacker",
        role: "service_role",
        exp: 9999999999,
      })}.`;

      expect(verifyJwt(forged, SECRET)).toBeNull();
    });

    it("an expired token", () => {
      const token = signJwt({ role: "anon" }, SECRET, -10);
      expect(verifyJwt(token, SECRET)).toBeNull();
    });

    it("a token with no exp claim", () => {
      const header = b64({ alg: "HS256", typ: "JWT" });
      const body = b64({ sub: "user-1", role: "authenticated" });
      const signingInput = `${header}.${body}`;
      const signature = createHmac("sha256", SECRET).update(signingInput).digest("base64url");

      expect(verifyJwt(`${signingInput}.${signature}`, SECRET)).toBeNull();
    });

    it.each([
      ["empty string", ""],
      ["not a jwt", "not-a-jwt"],
      ["two parts", "aaa.bbb"],
      ["four parts", "aaa.bbb.ccc.ddd"],
      ["non-object payload", `${b64({ alg: "HS256" })}.${b64([1, 2, 3])}.sig`],
      ["undecodable payload", `${b64({ alg: "HS256" })}.!!!not-base64json!!!.sig`],
    ])("%s", (_label, token) => {
      expect(verifyJwt(token, SECRET)).toBeNull();
    });

    it("an empty secret", () => {
      const token = signJwt({ role: "anon" }, SECRET);
      expect(verifyJwt(token, "")).toBeNull();
    });
  });

  describe("role allow-list", () => {
    it("accepts a permitted role", () => {
      const token = signJwt({ role: "authenticated" }, SECRET);
      const claims = verifyJwt(token, SECRET, { allowedRoles: ["authenticated", "service_role"] });
      expect(claims).not.toBeNull();
    });

    it("rejects a role outside the allow-list", () => {
      const token = signJwt({ role: "anon" }, SECRET);
      expect(verifyJwt(token, SECRET, { allowedRoles: ["authenticated"] })).toBeNull();
    });

    it("rejects a token with no role when roles are required", () => {
      const token = signJwt({ sub: "user-1" }, SECRET);
      expect(verifyJwt(token, SECRET, { allowedRoles: ["authenticated"] })).toBeNull();
    });

    it("ignores the allow-list when it is empty", () => {
      const token = signJwt({ role: "anon" }, SECRET);
      expect(verifyJwt(token, SECRET, { allowedRoles: [] })).not.toBeNull();
    });
  });

  describe("clock tolerance", () => {
    it("accepts a just-expired token within tolerance", () => {
      const token = signJwt({ role: "anon" }, SECRET, -5);
      expect(verifyJwt(token, SECRET)).toBeNull();
      expect(verifyJwt(token, SECRET, { clockToleranceSeconds: 30 })).not.toBeNull();
    });
  });

  describe("decodeJwtUnsafe", () => {
    it("reads claims without verifying", () => {
      const token = signJwt({ sub: "user-9", role: "anon" }, SECRET);
      const claims: JwtClaims | null = decodeJwtUnsafe(token);
      expect(claims?.sub).toBe("user-9");
    });

    it("still returns claims for a token with a bad signature", () => {
      const forged = `${b64({ alg: "HS256" })}.${b64({ sub: "who", exp: 1 })}.bogus`;
      expect(decodeJwtUnsafe(forged)?.sub).toBe("who");
    });

    it("returns null for malformed input", () => {
      expect(decodeJwtUnsafe("nope")).toBeNull();
    });
  });
});
