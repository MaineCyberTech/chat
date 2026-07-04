# Principal Audit Report

- Prompt: **notification_engine_and_mentions**
- Domain: **features**
- Run ID: **notification_engine_and_mentions_20260703_055338**
- Generated: **2026-07-03T12:00:00Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **2**
- P2: **2**, P3: **0**
- Readiness: **61.30**

## Findings

### P1 — notificationService.list() and unreadCount() use getSupabase() (anon client) instead of per-user authenticated Supabase client

- **File:** `apps/api/src/modules/notifications/service.ts:19`
- **Category:** notification_security
- **Impact:** All notification read operations use the anonymous client with RLS enforcing user_id filter — defense-in-depth weakness if RLS is misconfigured.
- **Fix:** Refactor list() and unreadCount() to accept an optional SupabaseClient parameter. Pass req.supabase from the route handlers.

### P1 — @here mention resolves identically to @everyone by selecting all workspace members without filtering for currently online/active users

- **File:** `apps/api/src/lib/mentions/parser.ts:81`
- **Category:** mention_here_filtering
- **Impact:** @here is intended to notify only currently online workspace members, but the implementation notifies all members regardless of presence status.
- **Fix:** Integrate with Socket.io presence tracking: query currently active user IDs from the Redis presence store or socket rooms when resolving @here.

### P2 — Mention notification titles use truncated UUID (input.user_id.slice(0,8)) instead of resolved display name

- **File:** `apps/api/src/modules/messages/service.ts:136`
- **Category:** notification_ux
- **Impact:** Notification reads like 'a1b2c3d4 mentioned you' instead of 'Alice mentioned you'. Raw UUIDs are user-hostile.
- **Fix:** Look up the sender's display_name from the users/profiles table before constructing the notification title.

### P2 — Notification unread count polls every 30 seconds instead of using real-time WebSocket push

- **File:** `apps/web/components/notifications/notification-bell.tsx:51`
- **Category:** notification_delivery
- **Impact:** Users experience up to 30 seconds of delay between a mention being created and the notification bell badge updating.
- **Fix:** Emit a 'notification:new' or 'notifications:unread_update' Socket.io event when notificationService.create() succeeds.
