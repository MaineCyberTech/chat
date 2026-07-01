# Principal Audit Report

- Prompt: **notification_engine_mentions**
- Domain: **features**
- Run ID: **notification_engine_mentions_20260701_073214**
- Generated: **2026-07-01T07:32:14Z**
- Decision: **NO-GO**
- P0: **2**, P1: **3**
- P2: **2**, P3: **1**
- Readiness: **27.00**

## Findings

### P0 — No @mention parsing at message creation time — no detection of @user, @role, @everyone, @here patterns

- **File:** ``
- **Category:** mention_parsing
- **Impact:** Mention-driven notifications are completely absent; users cannot @mention each other
- **Fix:** Implement mention parser that runs at message create: extract @username patterns, resolve to user IDs, validate membership, create notification records

### P0 — No offline notification queue — notifications created only for currently connected users via in-memory operations

- **File:** `apps/api/src/modules/notifications/`
- **Category:** delivery_layer
- **Impact:** Offline users miss notifications; no persistent inbox for missed @mentions or thread replies
- **Fix:** Create notification_queue table: all notifications persisted on send; delivered via push/websocket on user reconnect

### P1 — No notification_preferences table — users cannot control which notifications they receive per channel or per type

- **File:** `supabase/migrations/`
- **Category:** db_design
- **Impact:** Every notification goes to every workspace member; no mute, no channel-level suppression
- **Fix:** Create notification_preferences: user_id FK, workspace_id FK (null=global), channel_id FK (null), notification_type TEXT, enabled BOOLEAN. Set sensible defaults.

### P1 — No @role or @everyone mention support — mention system must resolve role members and workspace members

- **File:** ``
- **Category:** mention_parsing
- **Impact:** Broadcast mentions (@everyone, @channel) and role-targeted mentions (@admin, @moderator) not possible
- **Fix:** Extend mention parser: @everyone resolves to all workspace members, @role resolves to workspace_members with that role

### P1 — No mention autocomplete UI in message input — users must type @username manually with no suggestion dropdown

- **File:** `apps/web/components/`
- **Category:** frontend_integration
- **Impact:** Mention discoverability is poor; users must know exact usernames
- **Fix:** Implement @mention autocomplete popover: debounced search, keyboard-navigable list, multi-word display names

### P2 — No channel muting or notification suppression rules — channel level mute/unmute not supported

- **File:** `apps/api/src/modules/notifications/`
- **Category:** delivery_layer
- **Impact:** Users cannot mute noisy channels; notification fatigue
- **Fix:** Add channel mute flag to notification_preferences; filter notifications at delivery time based on mute rules

### P2 — Notification bell shows count but no distinction between mention types (@user vs @everyone vs thread reply)

- **File:** `apps/web/components/notifications/notification-bell.tsx`
- **Category:** frontend_integration
- **Impact:** Users cannot prioritize notifications; all notification types visually identical
- **Fix:** Add notification type icons/coloring: @mention highlight, thread reply indicator, @everyone warning style

### P3 — No abuse/edge-case tests for mentions: self-mention, mention of non-member, @everyone spam, mention flood

- **File:** ``
- **Category:** test_plan
- **Impact:** Mention system vulnerable to abuse without rate limiting or validation
- **Fix:** Add mention rate limiting (max 10 @mentions per message), self-mention check, non-member validation; write tests
