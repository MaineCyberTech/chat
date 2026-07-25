# 0001 — Use Supabase Auth + RLS for Authentication and Tenant Isolation

- **Status**: Accepted
- **Date**: 2026-06-20

## Context

We need a secure, scalable authentication system and a tenant isolation strategy for a
multi-workspace chat platform. Key requirements:

- Per-tenant data isolation (workspace A must never see workspace B data).
- Magic link, password, and OAuth (Google, GitHub) sign-in flows.
- Row-level security that works at the database layer, not just the application layer.
- Minimal custom auth code to reduce maintenance burden and security surface.

## Decision

**Use Supabase Auth (GoTrue) for user authentication and Supabase RLS (PostgreSQL Row-Level
Security) for tenant isolation.**

- Auth tokens issued by Supabase are JWTs with embedded `sub` (user ID) and app metadata.
- PostgreSQL RLS policies enforce workspace membership checks on every query using
  `auth.uid()` and workspace member tables.
- All database access from the API goes through a service role client that sets the
  `request.jwt.claims` context, enabling RLS to act on the authenticated user's identity.

## Alternatives Considered

| Option | Rejected Because |
|--------|-----------------|
| **Custom JWT auth with Passport.js** | High maintenance burden; must implement password reset, email verification, OAuth flows, token refresh, session revocation, and brute-force protection from scratch. |
| **Keycloak / Auth0 (external IdP)** | Adds operational complexity (self-hosted Keycloak) or vendor lock-in and cost (Auth0). Supabase Auth is bundled with our database and included in the Supabase pricing tier. |
| **Application-layer tenant filters only** | Vulnerable to bugs — a single missed `WHERE workspace_id = ?` leaks data across tenants. RLS guarantees isolation at the database level regardless of application code quality. |

## Consequences

### Positive

- **Zero-config tenant isolation**: RLS policies are declarative and enforced by PostgreSQL.
  No tenant column can be forgotten in a query.
- **Reduced auth code**: Email verification, password reset, magic links, and OAuth
  providers are handled by Supabase. Our API only validates JWTs.
- **Batteries included**: Row-level policies, real-time subscriptions, and storage access
  all respect the same RLS model.

### Negative

- **Vendor coupling**: Migrating away from Supabase requires replacing both auth and RLS.
  Mitigated by the fact that RLS is standard PostgreSQL — only the JWT claims format is
  Supabase-specific.
- **RLS debugging complexity**: RLS policy errors manifest as silent row omissions rather
  than explicit errors, making debugging harder.
- **GoTrue quirks**: SaaS GoTrue instances have had bugs with NULL token columns and
  `handle_user_deletion()` triggers (documented in AGENTS.md seed workflow).
