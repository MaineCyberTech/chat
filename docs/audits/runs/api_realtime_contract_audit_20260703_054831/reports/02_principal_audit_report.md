# Principal Audit Report

- Prompt: **api_realtime_contract_audit**
- Domain: **api**
- Run ID: **api_realtime_contract_audit_20260703_054831**
- Generated: **2026-07-03T18:00:00.000Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **3**
- P2: **2**, P3: **0**
- Readiness: **61.25**

## Findings

### P1 — Reaction add/remove operations emit zero Socket.io events, while every other message mutation broadcasts realtime updates
- **File:** `apps/api/src/modules/reactions/service.ts`
- **Category:** realtime_events
- **Impact:** Users in a channel never see reactions appear or disappear in realtime. Frontend relies on REST polling (GET /reactions/batch) which only fires on new message batches, leaving reaction state stale for up to seconds/minutes.
- **Fix:** Add io.to(`channel:${channelId}`).emit('reaction:added', { messageId, reaction }) in reactionService.add() and io.to(`channel:${channelId}`).emit('reaction:removed', { messageId, userId, emoji }) in remove().

### P1 — presence:update event is never emitted to connected clients despite frontend listening for it
- **File:** `apps/api/src/lib/socket.ts`
- **Category:** realtime_events
- **Impact:** chat-view.tsx registers a listener for presence:update on line 187 but the backend never emits this event. The online count badge remains stuck at 0.
- **Fix:** Emit io.emit('presence:update', { total: getOnlineUsers().length }) in socket 'connection' and 'disconnect' handlers. Consider periodic broadcasts every 30s.

### P1 — Socket reconnect only re-joins channel rooms with no message catch-up mechanism, causing permanent message loss
- **File:** `apps/web/components/chat/chat-view.tsx`
- **Category:** state_reconciliation
- **Impact:** When a client disconnects (e.g., network blip), on reconnect it emits channel:join but sends no cursor or timestamp for missed messages. Messages sent during the disconnect window are permanently lost.
- **Fix:** Track lastKnownMessageId in chat-view state. On reconnect, emit channel:join with a last_seen_message_id parameter. Add server endpoint GET /channels/:id/messages/since?after=<id> to return missed messages.

### P2 — Channel membership removal has no realtime enforcement — removed users remain in Socket.io rooms until reconnect
- **File:** `apps/api/src/modules/channels/service.ts`
- **Category:** auth_scoping
- **Impact:** When an admin removes a user from a channel, the removed user's active socket connections remain in the channel room, continuing to receive realtime messages for up to 5 minutes.
- **Fix:** After removing a member, emit io.to('channel:' + channelId).emit('channel:kick', { userId }) and disconnect that specific user's sockets from the room.

### P2 — Six instances of .catch(() => {}) silently swallow errors from async side-effects (webhooks, mentions, notifications)
- **File:** `apps/api/src/modules/messages/service.ts`
- **Category:** observability
- **Impact:** Failures in webhook delivery, @mention resolution, thread reply notifications produce zero log output. Operators cannot detect silent failures.
- **Fix:** Replace every .catch(() => {}) with .catch((err) => logger.error('{context} failed', { error: String(err), ...metadata })).
