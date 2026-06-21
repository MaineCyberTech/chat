# Security, Authorization & Tenancy Audit — Chat Platform

**Date**: 2026-06-21
**Scope**: API server (`apps/api/`), Web client (`apps/web/`), DB policies & migrations (`packages/db/sql/`), Infra (`infra/terraform/`)
**Reviewer**: Automated audit tooling

---

## Severity Definitions

| Level  | Impact                                                                                            |
| ------ | ------------------------------------------------------------------------------------------------- |
| **P0** | Active exploit path, data leak across tenants, or privilege escalation with no mitigating control |
| **P1** | High-risk weakness requiring code change; exploit possible under realistic conditions             |
| **P2** | Moderate risk; defense-in-depth gap or missing control that raises risk profile                   |
| **P3** | Low risk or hardening opportunity; best-practice deviation                                        |

---

## 1. Auth Flow Correctness

### 1.1 JWT Validation — API

| File                                            | Finding                                                                                                            | Severity |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------- |
| `apps/api/src/middleware/authenticate.ts:26`    | Uses `supabase.auth.getUser(token)` on every request — correctly introspects the JWT with Supabase Auth. **Good.** | ✅       |
| `apps/api/src/middleware/authenticate.ts:16-20` | Rejects missing and malformed `Bearer` headers with 401. **Good.**                                                 | ✅       |
| `apps/api/src/middleware/authenticate.ts:36-39` | Catch-all wraps unexpected errors as 500 `AUTH_ERROR`. Acceptable.                                                 | ✅       |

### 1.2 Token Refresh — Web Client

| File                                              | Finding                                                                                                                                                                                                                                                | Severity |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| `apps/web/lib/supabase/client.ts:19`              | `autoRefreshToken: true` configured. **Good.**                                                                                                                                                                                                         | ✅       |
| `apps/web/components/auth/auth-context.tsx:37-39` | `onAuthStateChange` listener updates user state on session refresh. **Good.**                                                                                                                                                                          | ✅       |
| `apps/web/lib/api.ts:21-25`                       | On 401 response, silently signs user out. No retry with refreshed token. If the auto-refresh has not yet fired when a request is made with an expired token, a brief window exists where active users are forcefully signed out. **Minor UX concern.** | P3       |

### 1.3 Socket.io Auth

| File                               | Finding                                                                                                                                           | Severity |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `apps/api/src/lib/socket.ts:28-49` | Validates JWT via `supabase.auth.getUser(token)` in middleware. Token provided via `socket.handshake.auth.token`. **Good.**                       | ✅       |
| `apps/api/src/lib/socket.ts:44`    | Sets `userId` on socket. No further authorization on `channel:join`, `typing:*` events. Relies on clients self-declaring which channel they join. | P1       |

---

## 2. Authorization Enforcement

### 2.1 API Route-Level Authorization

**P0 Finding — No workspace/channel membership checks at route level; entire enforcement delegated to RLS.**

All routes authenticate the user but **never verify the user is a member of the referenced workspace or channel**. Protection relies entirely on PostgreSQL RLS.

| File                                               | Route                                   | Authorization Check                                   |
| -------------------------------------------------- | --------------------------------------- | ----------------------------------------------------- |
| `apps/api/src/modules/workspaces/routes.ts:10-12`  | `GET /workspaces`                       | None (relies on RLS `WHERE EXISTS workspace_members`) |
| `apps/api/src/modules/workspaces/routes.ts:55-62`  | `GET /workspaces/:id`                   | None (relies on RLS)                                  |
| `apps/api/src/modules/workspaces/routes.ts:64-86`  | `PATCH /workspaces/:id`                 | None (relies on RLS)                                  |
| `apps/api/src/modules/workspaces/routes.ts:88-101` | `DELETE /workspaces/:id`                | None (relies on RLS)                                  |
| `apps/api/src/modules/channels/routes.ts:10-13`    | `GET /workspaces/:workspaceId/channels` | None (relies on RLS)                                  |
| `apps/api/src/modules/channels/routes.ts:47-53`    | `GET /channels/:id`                     | None (relies on RLS)                                  |
| `apps/api/src/modules/messages/routes.ts:41-49`    | `GET /channels/:channelId/messages`     | None (relies on RLS)                                  |
| `apps/api/src/modules/messages/routes.ts:17-39`    | `GET /messages/search`                  | None (see P0 on search)                               |

**Recommendation**: Add middleware that fetches workspace/channel and asserts membership before proceeding. This provides defense-in-depth should RLS be misconfigured or bypassed.

### 2.2 Service-Layer Client Selection

**P1 Finding — `getAdminOrAnon()` bypasses RLS on create operations.**

`apps/api/src/lib/supabase.ts:43-45`:

```ts
export function getAdminOrAnon(): SupabaseClient {
  return adminClient ?? getSupabase();
}
```

This function returns the **service_role client** if `SUPABASE_SERVICE_ROLE_KEY` is configured (which it is in production). Service-role bypasses all RLS.

It is used in:

- `apps/api/src/modules/workspaces/service.ts:42` — `workspace.create`
- `apps/api/src/modules/channels/service.ts:43` — `channel.create`
- `apps/api/src/modules/messages/service.ts:44` — `message.create`

While the service layer passes `req.userId` as `owner_id` / `created_by` / `user_id`, **any code path that calls `getAdminOrAnon()` eliminates RLS as a safety net**. A future refactor that forgets to scope `user_id = req.userId` would allow cross-tenant writes.

| File                                            | Finding                                       | Severity |
| ----------------------------------------------- | --------------------------------------------- | -------- |
| `apps/api/src/modules/workspaces/service.ts:42` | Create uses `getAdminOrAnon()`, bypassing RLS | P1       |
| `apps/api/src/modules/channels/service.ts:43`   | Create uses `getAdminOrAnon()`, bypassing RLS | P1       |
| `apps/api/src/modules/messages/service.ts:44`   | Create uses `getAdminOrAnon()`, bypassing RLS | P1       |

**Recommendation**: Use the anon (user-scoped) client for all user-initiated operations. Reserve admin client exclusively for internal/background jobs that genuinely need RLS bypass.

### 2.3 DB-Level RLS Policies

Well-constructed overall. Policies enforce tenant isolation through the `workspace_members` join chain.

| Policy File                                   | Assessment                                                                                                                                                             | Severity |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `packages/db/sql/policies/workspaces_rls.sql` | Select checks `workspace_members`; Update requires `owner`/`admin`; Delete requires `owner`; Insert checks `owner_id = auth.uid()`. **Correct.**                       | ✅       |
| `packages/db/sql/policies/channels_rls.sql`   | Select checks public/private visibility; Insert checks workspace membership + `created_by = auth.uid()`; Update/Delete require `created_by = auth.uid()`. **Correct.** | ✅       |
| `packages/db/sql/policies/messages_rls.sql`   | Select checks channel→workspace membership; Insert checks `user_id = auth.uid()` + workspace membership; Update/Delete require `user_id = auth.uid()`. **Correct.**    | ✅       |
| `packages/db/sql/policies/users_rls.sql`      | Select allows all authenticated users; Update/Insert require `id = auth.uid()`. **Correct for chat UX.**                                                               | ✅       |
| `packages/db/sql/policies/storage_rls.sql`    | Insert/Select only check `bucket_id = 'chat-uploads'` and `authenticated` role. **No user scoping.**                                                                   | P1       |

---

## 3. Tenant Isolation

### 3.1 Cross-Tenant Data Leak — Search Function

**P0 Finding — `search_messages` is `SECURITY DEFINER` with no user-access check.**

`packages/db/sql/migrations/005_search.sql:10-39`:

```sql
CREATE OR REPLACE FUNCTION public.search_messages(...)
RETURNS TABLE(...) AS $$
BEGIN
  RETURN QUERY
  SELECT ...
  FROM public.messages m
  JOIN public.channels ch ON ch.id = m.channel_id
  WHERE ch.workspace_id = workspace_id
    AND to_tsvector('english', m.content) @@ plainto_tsquery('english', query_text)
  ORDER BY rank DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

- `SECURITY DEFINER` runs with the function owner's privileges (typically `supabase_admin`), **bypassing all RLS**.
- The function accepts a `workspace_id` parameter from the caller and does **not verify the calling user is a member of that workspace**.
- **Any authenticated user can search messages in any workspace** by calling `supabase.rpc("search_messages", { workspace_id: "<any-workspace-id>", query_text: "..." })`.

**Call site**: `apps/api/src/modules/messages/routes.ts:27-30` — uses the anon client, so Supabase Auth identity is available, but the function ignores it.

**Exploit scenario**: Attacker enumerates workspace UUIDs (which are predictable `uuid_generate_v4()` values, leakable through other means) and searches all messages across the platform.

| File                                            | Finding                                                                       | Severity |
| ----------------------------------------------- | ----------------------------------------------------------------------------- | -------- |
| `packages/db/sql/migrations/005_search.sql:39`  | `SECURITY DEFINER` + no `auth.uid()` check = full cross-tenant message search | **P0**   |
| `apps/api/src/modules/messages/routes.ts:17-39` | Route exposes RPC with no additional workspace membership check               | **P0**   |

**Recommendation**: Change to `SECURITY INVOKER` (runs with caller's privileges, respects RLS) and add a `WHERE EXISTS (SELECT 1 FROM workspace_members WHERE user_id = auth.uid() AND workspace_id = <param>)` clause.

### 3.2 Storage Isolation

**P1 Finding — Storage bucket RLS has no user/workspace scoping.**

`packages/db/sql/policies/storage_rls.sql`:

```sql
CREATE POLICY "Users can upload files" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'chat-uploads');

CREATE POLICY "Users can read uploaded files" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'chat-uploads');
```

- **Any authenticated user can read any file** in the `chat-uploads` bucket.
- **Any authenticated user can overwrite any path** in the bucket.
- The path convention `{userId}/{timestamp}-{fileName}` is convention-only, not enforced.

**Exploit scenario**: User A can read User B's uploaded files if they know or guess the path.

| File                                             | Finding                                          | Severity |
| ------------------------------------------------ | ------------------------------------------------ | -------- |
| `packages/db/sql/policies/storage_rls.sql:10-20` | No user-level access controls on storage objects | P1       |

---

## 4. Secret Handling & Environment Separation

### 4.1 Validation

| File                               | Finding                                                                                                                                                                          | Severity |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `apps/api/src/config/env.ts:3-18`  | Zod schema validates all env vars, exits on failure. **Good.**                                                                                                                   | ✅       |
| `apps/api/src/config/env.ts:7-9`   | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are `optional()` — could silently default to undefined, causing runtime failures rather than boot-time crashes. | P3       |
| `apps/api/src/config/env.ts:23-27` | Uses `safeParse` with `process.exit(1)`. Acceptable.                                                                                                                             | ✅       |

### 4.2 Key Exposure

| File                                  | Finding                                                                    | Severity |
| ------------------------------------- | -------------------------------------------------------------------------- | -------- |
| `apps/web/lib/supabase/client.ts:8-9` | Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` — correctly public, expected.         | ✅       |
| `apps/api/src/lib/supabase.ts:16-18`  | Service role key kept server-side only, never exposed to client. **Good.** | ✅       |

### 4.3 CORS Hardening

| File                        | Finding                                                                | Severity |
| --------------------------- | ---------------------------------------------------------------------- | -------- |
| `apps/api/src/app.ts:17-24` | CORS `origin` set from `FRONTEND_URL` env var, not wildcard. **Good.** | ✅       |

---

## 5. Exploit Paths

### 5.1 IDOR (Insecure Direct Object Reference)

| Path                                | Risk                         | Mitigating Control              | Severity |
| ----------------------------------- | ---------------------------- | ------------------------------- | -------- |
| `GET /workspaces/:id`               | Access any workspace by ID   | RLS (workspace_members check)   | P2       |
| `PATCH /workspaces/:id`             | Modify any workspace         | RLS (requires owner/admin)      | P2       |
| `DELETE /workspaces/:id`            | Delete any workspace         | RLS (requires owner)            | P2       |
| `GET /channels/:id`                 | Access any channel by ID     | RLS (public/private visibility) | P2       |
| `PATCH /channels/:id`               | Modify any channel           | RLS (requires creator)          | P2       |
| `DELETE /channels/:id`              | Delete any channel           | RLS (requires creator)          | P2       |
| `GET /channels/:channelId/messages` | List messages in any channel | RLS (workspace membership)      | P2       |
| `PATCH /messages/:id`               | Edit any message             | RLS (requires author)           | P2       |
| `DELETE /messages/:id`              | Delete any message           | RLS (requires author)           | P2       |

**Risk**: While RLS provides a backstop, relying exclusively on DB-level controls means a single RLS misconfiguration (or a `getAdminOrAnon()` call that slipped into a read/update path) creates an exploitable IDOR. **Defense-in-depth is absent.**

### 5.2 Privilege Escalation — Webhook Management

| File                                     | Finding                                                                                                                                                                        | Severity |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| `supabase/migrations/webhooks.sql:34-50` | `webhook_endpoints_manage_workspace_member` policy grants **ALL** operations to **any workspace member**, not just admins. A regular member can create/update/delete webhooks. | P2       |

**Recommendation**: Restrict webhook management to `owner`/`admin` roles only.

### 5.3 SSRF — Webhook URLs

| File                                                                 | Finding                                                                                                                                       | Severity |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `supabase/migrations/webhooks.sql:6`                                 | `url text not null` — no validation of URL. A webhook can point to `http://169.254.169.254/` (metadata endpoint) or internal Docker services. | P1       |
| N/A — No webhook delivery service visible in `apps/api/src/modules/` | Webhook delivery code may exist elsewhere or be unimplemented. If unimplemented, SSRF risk is latent.                                         | P2       |

**Recommendation**: Validate webhook URLs at creation time (block private IPs, loopback, metadata endpoints). Sign payloads with `secret` for outbound delivery verification.

### 5.4 Webhook Secret Storage

| File                                 | Finding                                                                                                | Severity |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------ | -------- |
| `supabase/migrations/webhooks.sql:7` | `secret text` — stored in plaintext. No mention of encryption at rest or application-level encryption. | P2       |

### 5.5 Injection Vectors

| Vector                   | File                     | Mitigation                                                                                                                   | Severity |
| ------------------------ | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | -------- |
| SQL (message content)    | —                        | Parameterized queries via Supabase client; no raw SQL in API code. **Good.**                                                 | ✅       |
| SQL (search)             | `005_search.sql:35`      | `plainto_tsquery` sanitizes user input. **Good.**                                                                            | ✅       |
| Zod validation           | `validators.ts`          | All route inputs validated. **Good.**                                                                                        | ✅       |
| XSS (message rendering)  | —                        | Helmet + CSP headers present. No evidence of DOMPurify or similar sanitization at render time in the web app scope reviewed. | P2       |
| Path traversal (uploads) | `messages/routes.ts:134` | Path is `req.userId/Date.now()-fileName` — `fileName` not sanitized for `../` sequences.                                     | P1       |

### 5.6 Cloudflare Proxy + Terraform

| Issue                                       | File                            | Severity                                                                                                        |
| ------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------- | --- |
| SSH inbound from `0.0.0.0/0`                | `infra/terraform/main.tf:37`    | SSH exposed to entire internet. While mitigated by key-based auth, no Cloudflare Tunnel or IP whitelist.        | P2  |
| Firewall doesn't restrict to Cloudflare IPs | `infra/terraform/main.tf:40-50` | Ports 80/443 open to all sources, not just Cloudflare proxy IPs. Origin can be directly reached if IP is known. | P2  |

---

## 6. Audit Logging Completeness

### 6.1 Events Covered

| Action           | Audit Logged        | File                          |
| ---------------- | ------------------- | ----------------------------- |
| Workspace create | ✅                  | `workspaces/routes.ts:42-48`  |
| Workspace update | ✅                  | `workspaces/routes.ts:79-85`  |
| Workspace delete | ✅ (after response) | `workspaces/routes.ts:95-101` |
| Channel create   | ✅                  | `channels/routes.ts:38-44`    |
| Channel update   | ✅                  | `channels/routes.ts:70-76`    |
| Channel delete   | ✅ (after response) | `channels/routes.ts:86-92`    |
| Message create   | ✅                  | `messages/routes.ts:73-79`    |
| Message update   | ✅                  | `messages/routes.ts:98-104`   |
| Message delete   | ✅ (after response) | `messages/routes.ts:115-120`  |

### 6.2 Events NOT Logged — Gaps

| Missing Event                           | Impact                                                        | Severity |
| --------------------------------------- | ------------------------------------------------------------- | -------- |
| Auth (login, failed login, logout)      | No ability to detect account takeover or brute-force patterns | P1       |
| Profile update                          | No trail of identity changes                                  | P2       |
| Workspace member add/remove/role change | No accountability for membership changes                      | P1       |
| Webhook create/update/delete            | No audit of webhook lifecycle                                 | P1       |
| Webhook delivery (success/failure)      | No operational visibility                                     | P2       |
| File upload                             | No trail of upload events                                     | P2       |
| Search queries                          | No ability to detect enumeration attacks                      | P2       |

### 6.3 Audit Log Structural Issues

| Issue                                                                                                                                                                                                                                                                                                                           | File                                                                                    | Severity |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | -------- |
| **Fire-and-forget logging** — audit failures are silently swallowed (logged but not returned or re-thrown). Operations proceed without guaranteed audit trails.                                                                                                                                                                 | `apps/api/src/services/audit.ts:27-29`                                                  | P2       |
| **Post-response logging** — delete audit events are logged after `res.status(204).send()`. If DB insert fails, the operation was already committed with no record.                                                                                                                                                              | `workspaces/routes.ts:94-101`, `channels/routes.ts:85-92`, `messages/routes.ts:114-120` | P2       |
| **Uses service_role client** — audit writes depend on `SUPABASE_SERVICE_ROLE_KEY` being set. Production has it, but dev/test environments may silently fail.                                                                                                                                                                    | `apps/api/src/services/audit.ts:16`                                                     | P3       |
| **`organization_id` always null** — The audit schema has an `organization_id` foreign concept (`audit_logs.sql:4`), but no entity in the schema uses organizations. The RLS `SELECT` policy references `workspaces.organization_id` which doesn't exist in the workspace migration. The SELECT policy would error on execution. | `audit_logs.sql:27-34`                                                                  | P1       |
| **Actor type defaults to "user"** — No system actions currently use `actor_type = 'system'`.                                                                                                                                                                                                                                    | `audit_logs.sql:5`                                                                      | P3       |

### 6.4 RLS Policy Error on Audit Logs

**P1 Finding — `audit_logs` SELECT policy references a non-existent column.**

`supabase/migrations/audit_logs.sql:27-34`:

```sql
create policy "audit_logs_select_authenticated" ... using (
  organization_id is null
  or exists (
    select 1 from workspace_members wm
    join workspaces w on w.id = wm.workspace_id
    where wm.user_id = auth.uid()
    and w.organization_id = audit_logs.organization_id  -- ← NO SUCH COLUMN
  )
);
```

The `workspaces` table schema (`002_workspaces.sql`) has no `organization_id` column. This policy would **error on execution** for any row where `audit_logs.organization_id` is not null. Since the application always inserts null, the first branch `organization_id is null` succeeds, masking the error — but if organization_id is ever set, the policy breaks entirely.

---

## 7. Prioritized Implementation Roadmap

### P0 — Immediate (< 24 hours)

| #   | Task                             | Files                                       | Fix                                                                                                                                                                                |
| --- | -------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Fix cross-tenant search leak** | `packages/db/sql/migrations/005_search.sql` | Change `SECURITY DEFINER` → `SECURITY INVOKER` and add `WHERE EXISTS (SELECT 1 FROM workspace_members WHERE user_id = auth.uid() AND workspace_id = search_messages.workspace_id)` |

### P1 — This Sprint (1–3 days)

| #   | Task                                                                      | Files                                                                                                 | Fix                                                                                                                                                           |
| --- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | -------------------------------------------------- |
| 2   | **Replace `getAdminOrAnon()` with anon client on user-initiated creates** | `apps/api/src/lib/supabase.ts`, `workspaces/service.ts`, `channels/service.ts`, `messages/service.ts` | Use `getSupabase()` (anon) instead; add a dedicated admin method only if RLS bypass is absolutely required for that operation                                 |
| 3   | **Add route-level membership middleware**                                 | `apps/api/src/middleware/`, all route files                                                           | Create `requireWorkspaceMembership(workspaceIdParam)` and `requireChannelAccess(channelIdParam)` middleware that checks `workspace_members` before proceeding |
| 4   | **Fix audit_logs SELECT policy**                                          | `supabase/migrations/audit_logs.sql`                                                                  | Remove the `workspaces.organization_id` reference. Either add `organization_id` to workspaces or simplify the policy to check workspace_id directly           |
| 5   | **Scope storage RLS by user**                                             | `packages/db/sql/policies/storage_rls.sql`                                                            | Add `(storage.objects.name LIKE auth.uid()                                                                                                                    |     | '/%')` condition to prevent cross-user file access |
| 6   | **Audit auth events**                                                     | `apps/api/src/modules/auth/routes.ts`, `services/audit.ts`                                            | Log sign-in attempts (success + failure), sign-outs, and profile updates                                                                                      |
| 7   | **Sanitize upload fileName**                                              | `apps/api/src/modules/messages/routes.ts:134`                                                         | Strip path separators and disallowed characters from `fileName`                                                                                               |
| 8   | **Audit workspace member changes**                                        | Workspace membership routes (if they exist) or DB triggers                                            | Log add/remove/role-change events for workspace members                                                                                                       |

### P2 — Next Sprint (1 week)

| #   | Task                                                     | Files                                     | Fix                                                                                         |
| --- | -------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------- |
| 9   | **Restrict webhook management to admins/owners**         | `supabase/migrations/webhooks.sql`        | Add role check to webhook RLS policies                                                      |
| 10  | **Add webhook URL validation against internal IPs**      | Webhook service code                      | Block private IPs (`10.x`, `172.16-31.x`, `192.168.x`, `169.254.x`, `127.x`) in webhook URL |
| 11  | **Move audit events before response**                    | Workspace/channel/message routes          | Await `logAuditEvent()` before sending the response                                         |
| 12  | **Firewall: restrict SSH + HTTP/S to Cloudflare IPs**    | `infra/terraform/main.tf`                 | Use Cloudflare IP list for inbound rules on ports 80/443; add SSH source restriction        |
| 13  | **Add content-type and file-size validation on uploads** | `apps/api/src/modules/messages/routes.ts` | Validate `contentType` against an allowlist before generating signed URL                    |
| 14  | **Add XSS sanitization for message rendering**           | `apps/web/` components                    | Integrate DOMPurify or equivalent; ensure message content is rendered as text, not HTML     |
| 15  | **Add audit events for webhook lifecycle**               | Webhook routes                            | Log webhook create/update/delete/delivery                                                   |

### P3 — Backlog

| #   | Task                                                                     | Files                                   | Fix                                                                    |
| --- | ------------------------------------------------------------------------ | --------------------------------------- | ---------------------------------------------------------------------- |
| 16  | **Make SUPABASE\_\* env vars required (not optional)**                   | `apps/api/src/config/env.ts`            | Change `.optional()` to `.min(1)` to fail-fast at boot                 |
| 17  | **Add user-level socket authorization**                                  | `apps/api/src/lib/socket.ts`            | Verify workspace membership on `channel:join` with a DB lookup         |
| 18  | **Encrypt webhook secrets at rest**                                      | `supabase/migrations/webhooks.sql`      | Use `pgcrypto` or application-level encryption for the `secret` column |
| 19  | **Add `organization_id` column to workspaces or remove from audit_logs** | `002_workspaces.sql` / `audit_logs.sql` | Align schema semantics                                                 |

---

## Summary Count

| Severity  | Count |
| --------- | ----- |
| **P0**    | 1     |
| **P1**    | 8     |
| **P2**    | 10    |
| **P3**    | 4     |
| **Total** | 23    |
