# Principal Audit Report

- Prompt: **failure_injection_chaos_pack**
- Domain: **testing**
- Run ID: **failure_injection_chaos_pack_20260703_054833**
- Generated: **2026-07-03T14:00:00Z**
- Decision: **NO-GO**
- P0: **1**, P1: **2**
- P2: **1**, P3: **0**
- Readiness: **20.00**

## Findings

### P0 — Stale socket tokens persist indefinitely with no token refresh mechanism — socket disconnects only on manual page refresh
- **File:** `apps/api/src/lib/socket.ts`
- **Category:** socket_resilience
- **Impact:** When a user's Supabase session token expires (e.g., after 1 hour), the Socket.io connection remains open with the stale token. No token refresh reconnection logic exists. The server cannot proactively disconnect expired sessions. Users appear 'connected' after token expiry but get auth errors on next message send.
- **Fix:** Add socket token refresh middleware that checks auth token expiry on each channel:join. Implement client-side 403 handling: on 'connect_error' or 403 event, refresh the Supabase session and reconnect with new token. Emit 'session:expired' from server on expired token detection.

### P1 — Query timeout wrapper exists (createQueryTimeout) but is never imported or used in any route or service
- **File:** `apps/api/src/lib/db-timeout.ts`
- **Category:** api_timeout
- **Impact:** The entire query timeout infrastructure is dead code. Any slow query (unindexed search, full table scan, deadlock) will hang the API process indefinitely, consuming a connection pool slot and eventually exhausting available connections.
- **Fix:** Apply createQueryTimeout to all Supabase query chains: `.rpc('search_messages', ...)`, message listing, user search, notification queries. Set timeouts of 5-10s for user-facing queries and 30s for background operations.

### P1 — Message send failure catches error but provides no retry mechanism — user input is lost on failure
- **File:** `apps/web/components/chat/message-input.tsx`
- **Category:** degraded_ux
- **Impact:** If the WebSocket or REST message send fails (network blip, server error, auth timeout), the error is caught but the message text is cleared from the input field. User's composed message is lost with no retry button, undo, or draft recovery mechanism.
- **Fix:** Keep the message text in the input on failure and show an inline error banner with 'Retry' button. Add optimistic message with 'failed' status that allows tap-to-retry. Store draft in localStorage as fallback.

### P2 — Feature flags exist for notifications and media but no kill switch exists for core message send or WebSocket functionality
- **File:** `apps/api/src/lib/feature-flags.ts`
- **Category:** kill_switch_coverage
- **Impact:** If a deployment causes a message persistence failure or socket storm, operators cannot disable message sending or WebSocket connections via feature flags. The only mitigation is full rollback or manual container restart.
- **Fix:** Add feature flags: 'messages.disable_send' (returns 503 on POST /messages), 'socket.disable_new_connections' (returns 503 on upgrade request), 'reactions.disable' (returns 503 on reaction mutations). Document the kill switch procedure in the incident response runbook.
