import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { BadRequestError, UnauthorizedError } from "../../lib/app-error.js";
import { authLimiter } from "../../middleware/rate-limit.js";
import { logger } from "../../lib/logger.js";
import {
  isLocalAuthEnabled,
  signInWithPassword,
  createUser,
  startSession,
  rotateRefreshToken,
  revokeRefreshToken,
  consumeMagicLink,
  issueAccessToken,
  getAuthUser,
} from "../../lib/local-auth.js";

/**
 * Self-hosted auth endpoints — the GoTrue replacements.
 *
 * Mounted alongside the existing /v1/auth router. Every route returns 501 unless
 * AUTH_PROVIDER=local, so deploying this file changes nothing until the switch
 * is flipped.
 *
 * See docs/adr/0002-postgres-postgrest-custom-auth.md.
 */
const router = Router();
router.use(authLimiter);

const MIN_PASSWORD_LENGTH = 8;

function requireLocalAuth(res: Response): boolean {
  if (!isLocalAuthEnabled()) {
    res.status(501).json({
      error: {
        code: "NOT_IMPLEMENTED",
        message: "Local auth is not enabled (set AUTH_PROVIDER=local)",
      },
    });
    return false;
  }
  return true;
}

function readCredentials(body: unknown): { email: string; password: string } {
  const { email, password } = (body ?? {}) as { email?: unknown; password?: unknown };
  if (typeof email !== "string" || !email.includes("@")) {
    throw new BadRequestError("A valid email is required");
  }
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    throw new BadRequestError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  return { email: email.trim().toLowerCase(), password };
}

async function sessionResponse(userId: string, email: string) {
  const tokens = await startSession(userId, email);
  if (!tokens) {
    throw new UnauthorizedError("Could not start a session");
  }

  const user = await getAuthUser(userId);
  return {
    user: user
      ? {
          id: user.id,
          email: user.email,
          display_name: user.displayName,
          avatar_url: user.avatarUrl,
          email_confirmed_at: user.emailConfirmedAt,
        }
      : { id: userId, email },
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    tokenType: "bearer",
    expiresIn: tokens.expiresIn,
  };
}

// Sign in with email + password. Mirrors GoTrue's grant_type=password.
router.post(
  "/password",
  asyncHandler(async (req: Request, res: Response) => {
    if (!requireLocalAuth(res)) return;

    const { email, password } = readCredentials(req.body);
    const result = await signInWithPassword(email, password);

    if (!result) {
      // Same message for unknown user and wrong password — no enumeration.
      logger.info("Local password sign-in rejected");
      throw new UnauthorizedError("Invalid email or password");
    }

    res.json(await sessionResponse(result.userId, email));
  }),
);

// Create an account.
router.post(
  "/signup",
  asyncHandler(async (req: Request, res: Response) => {
    if (!requireLocalAuth(res)) return;

    const { email, password } = readCredentials(req.body);
    const { displayName } = (req.body ?? {}) as { displayName?: unknown };

    const userId = await createUser(
      email,
      password,
      typeof displayName === "string" ? displayName : null,
    );

    if (!userId) {
      // createUser returns null both for a duplicate email and a malformed one.
      throw new BadRequestError("That email address cannot be registered");
    }

    res.status(201).json(await sessionResponse(userId, email));
  }),
);

// Exchange a refresh token for a new pair (rotating).
router.post(
  "/token",
  asyncHandler(async (req: Request, res: Response) => {
    if (!requireLocalAuth(res)) return;

    const { refreshToken } = (req.body ?? {}) as { refreshToken?: unknown };
    if (typeof refreshToken !== "string" || refreshToken.length === 0) {
      throw new BadRequestError("refreshToken is required");
    }

    const rotated = await rotateRefreshToken(refreshToken);
    if (!rotated) {
      // Unknown, expired, or replayed token; the family has been revoked.
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    const user = await getAuthUser(rotated.userId);
    res.json({
      user: user
        ? {
            id: user.id,
            email: user.email,
            display_name: user.displayName,
            avatar_url: user.avatarUrl,
          }
        : { id: rotated.userId },
      accessToken: issueAccessToken(rotated.userId, user?.email),
      refreshToken: rotated.refreshToken,
      tokenType: "bearer",
    });
  }),
);

// Revoke the presented refresh token. Idempotent.
router.post(
  "/signout",
  asyncHandler(async (req: Request, res: Response) => {
    if (!requireLocalAuth(res)) return;

    const { refreshToken } = (req.body ?? {}) as { refreshToken?: unknown };
    if (typeof refreshToken === "string" && refreshToken.length > 0) {
      await revokeRefreshToken(refreshToken);
    }
    res.status(204).send();
  }),
);

// Landing point for a magic link. Single-use; exchanges the token for a session.
// The web client posts the token here and stores the returned session, which
// replaces GoTrue's PKCE exchangeCodeForSession.
router.post(
  "/magic-link/verify",
  asyncHandler(async (req: Request, res: Response) => {
    if (!requireLocalAuth(res)) return;

    const { token } = (req.body ?? {}) as { token?: unknown };
    if (typeof token !== "string" || token.length === 0) {
      throw new BadRequestError("token is required");
    }

    const userId = await consumeMagicLink(token);
    if (!userId) {
      throw new UnauthorizedError("Invalid or expired magic link");
    }

    const user = await getAuthUser(userId);
    res.json(await sessionResponse(userId, user?.email ?? ""));
  }),
);

// Explicit, greppable marker for the not-yet-implemented pieces of the local
// auth surface, so a client cannot silently fall back to GoTrue.
router.all("/oauth/:provider", (_req: Request, res: Response) => {
  res.status(501).json({
    error: {
      code: "NOT_IMPLEMENTED",
      message: "OAuth sign-in is not implemented for the local auth provider yet",
    },
  });
});

export default router;
