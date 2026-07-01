"""
Generate all 15 feature prompt output JSON files and ingest them.
"""
import json, subprocess, sys
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(r"C:\temp\chat")
OUTPUTS = REPO / "tmp_prompt_outputs"
INGEST = REPO / "scripts" / "prompts" / "ingest_output.py"

now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

prompts = []

# ============================================================
# 00 - Master Feature Orchestrator
# ============================================================
prompts.append({
    "prompt_name": "master_feature_orchestrator",
    "domain": "features",
    "stage": "principal_audit",
    "decision": "NO-GO",
    "generated_at": now,
    "severity_counts": {"P0": 5, "P1": 8, "P2": 6, "P3": 4},
    "category_scores": {"feature_inventory": 40, "architecture_readiness": 35, "implementation_plan": 30, "risk_management": 25},
    "readiness": 32.0,
    "findings": [
        {"severity": "P0", "domain": "features", "category": "architecture_readiness", "file": "apps/api/src/modules/messages/service.ts",
         "issue": "Thread support exists (parent_id FK) but no thread metadata, participant tracking, reply counts, or unread count logic",
         "impact": "Threaded conversations cannot be built on current schema without significant DB and API changes",
         "fix": "Add thread_metadata table, thread_participants table, thread_last_read tracking, thread unread count infrastructure"},
        {"severity": "P0", "domain": "features", "category": "feature_inventory", "file": "apps/api/src/modules/notifications/service.ts",
         "issue": "Notification system has basic CRUD but no @mention parsing, @role/@everyone support, channel muting, or offline queues",
         "impact": "Mention-driven communication and granular notification control completely absent",
         "fix": "Implement mention parsing at message create time, mention validation, notification preference model, offline queue storage"},
        {"severity": "P0", "domain": "features", "category": "architecture_readiness", "file": "apps/api/src/modules/workspaces/routes.ts",
         "issue": "RBAC has only owner/admin/member roles with no channel-level override model or custom roles",
         "impact": "Granular channel permissions, hidden channels, and role-based channel access impossible",
         "fix": "Design role hierarchy with channel override model; add channel_role_overrides table; update middleware chain"},
        {"severity": "P0", "domain": "features", "category": "feature_inventory", "file": "apps/web/components/chat/message-list.tsx",
         "issue": "Message list renders all messages as flat DOM with no virtualization — no virtual list, no inverted scroll, no windowing",
         "impact": "Channels with thousands of messages cause OOM and browser freezes",
         "fix": "Integrate @tanstack/react-virtual with inverted scroll support; implement cursor-based pagination on scroll-to-top"},
        {"severity": "P0", "domain": "features", "category": "feature_inventory", "file": "apps/web/components/chat/message-input.tsx",
         "issue": "Message input is a plain textarea with no rich text, markdown preview, @mention autocomplete, emoji picker, or drag-drop",
         "impact": "Core message input lacks modern collaboration features; no inline media or mention support",
         "fix": "Implement enhanced textarea with mention autocomplete (#channels, @users), emoji picker, drag-drop file upload, markdown preview"},
        {"severity": "P1", "domain": "features", "category": "architecture_readiness", "file": "infra/docker/",
         "issue": "No WebRTC/STUN/TURN infrastructure for audio/video — no media server, no signaling channel, no ICE configuration",
         "impact": "Audio/video collaboration feature requires new infrastructure: TURN server, signaling service, room management",
         "fix": "Design WebRTC architecture: consider LiveKit, Daily.co, or self-hosted mediasoup for media server"},
        {"severity": "P1", "domain": "features", "category": "feature_inventory", "file": "apps/api/src/modules/messages/routes.ts",
         "issue": "Full-text search exists via search_messages RPC but has no date range filter, file metadata search, or search ranking",
         "impact": "Search is functional but limited — no advanced filtering or relevance ranking",
         "fix": "Add tsvector ranking with relevance scoring, date range filtering, file metadata search, paginated results"},
        {"severity": "P1", "domain": "features", "category": "architecture_readiness", "file": "apps/api/src/modules/channels/routes.ts",
         "issue": "No incoming webhook endpoints exist — only outgoing webhook delivery pipeline",
         "impact": "External systems cannot post messages into channels via webhook URLs",
         "fix": "Design incoming webhook registration model, payload formatting, secret generation, rate limiting"},
        {"severity": "P1", "domain": "features", "category": "implementation_plan", "file": "apps/web/components/",
         "issue": "No optimistic UI system — all mutations wait for API response before updating UI",
         "impact": "Chat feels sluggish; no zero-latency interaction pattern",
         "fix": "Create optimistic state management: temporary IDs for messages, reactions, edits; rollback on failure; deduplicate on server echo"},
        {"severity": "P1", "domain": "features", "category": "architecture_readiness", "file": "apps/api/src/app.ts",
         "issue": "No background job/worker infrastructure for async processing (notification fanout, webhook delivery queuing)",
         "impact": "Feature expansion will require worker processes; current architecture has no job queue or worker pattern",
         "fix": "Design job queue abstraction (Bull/BullMQ with Redis), worker process pattern, job retry/dead-letter handling"},
        {"severity": "P1", "domain": "features", "category": "feature_inventory", "file": "apps/web/",
         "issue": "Current theme supports only light/dark/system — no slate dark, OLED high-contrast black, or multi-theme architecture",
         "impact": "Theme engine needs expansion to support multiple named themes with SSR-safe hydration",
         "fix": "Expand CSS variable token system for multiple themes; implement SSR-safe theme hydration with cookie-based persistence"},
        {"severity": "P1", "domain": "features", "category": "implementation_plan", "file": "apps/web/",
         "issue": "No responsive breakpoint strategy for tablet — only desktop (768px+) and mobile (full-screen overlays)",
         "impact": "Tablet users get suboptimal layout; no three-column layout adaptation for medium screens",
         "fix": "Design three-column layout with proper collapse/restore behavior at 1024px, 768px, and 480px breakpoints"},
        {"severity": "P1", "domain": "features", "category": "implementation_plan", "file": "tests/",
         "issue": "No E2E or integration tests for any of the 5 core features (threads, mentions, RBAC, webhooks, search)",
         "impact": "Feature expansion without test coverage will produce regressions in production",
         "fix": "Write test matrix covering all 11 features with unit, integration, E2E, and performance tiers"},
        {"severity": "P2", "domain": "features", "category": "implementation_plan", "file": "apps/web/components/chat/thread-panel.tsx",
         "issue": "Thread panel exists but has no thread participant tracking, thread-specific unread counts, or join/leave semantics",
         "impact": "Thread feature lacks participant isolation and thread-specific UX patterns",
         "fix": "Add thread participant model, thread unread counts, thread join/leave API, thread notification preferences"},
        {"severity": "P2", "domain": "features", "category": "implementation_plan", "file": "",
         "issue": "No feature flag system wired to application code — 5 seed flags exist but control nothing",
         "impact": "Cannot use feature flags to safely roll out new features incrementally",
         "fix": "Wire feature flag evaluation into feature boundaries: threads, mentions, webhooks, search improvements, new editor"},
        {"severity": "P2", "domain": "features", "category": "implementation_plan", "file": "",
         "issue": "No release gate process for feature expansion — no checklist, no sign-off, no staged rollout plan",
         "impact": "Feature releases have no quality gate beyond existing CI checks",
         "fix": "Implement feature release gate with: P0/P1 resolution check, migration safety, E2E coverage threshold, feature flag rollout plan"},
        {"severity": "P2", "domain": "features", "category": "implementation_plan", "file": "packages/db/src/types.ts",
         "issue": "TypeScript types significantly out of sync with DB schema — must regenerate before any feature work",
         "impact": "New feature development will produce type errors or require any-casts",
         "fix": "Run supabase gen types typescript before starting feature implementation"},
        {"severity": "P2", "domain": "features", "category": "implementation_plan", "file": "",
         "issue": "No media/WebRTC support at all — no WebRTC service, no media streams, no device permission management",
         "impact": "Audio/video media is a greenfield feature requiring new infrastructure, new API service, and new frontend",
         "fix": "Phase 3: evaluate LiveKit for managed WebRTC; design signaling protocol; implement media grid UI"},
        {"severity": "P2", "domain": "features", "category": "implementation_plan", "file": "",
         "issue": "No shared @mention or autocomplete infrastructure — search-bar.tsx has its own search, no reusable mention picker",
         "impact": "Mention autocomplete in message input requires building from scratch",
         "fix": "Create shared MentionPicker component with debounced user/channel search, keyboard navigation, and position anchoring"},
        {"severity": "P3", "domain": "features", "category": "implementation_plan", "file": "",
         "issue": "No Storybook or component development environment for building new UI components",
         "impact": "New frontend features (editor, media grid, theme) require testing components in isolation",
         "fix": "Install Storybook with @chat/ui package; create stories for new feature components"},
        {"severity": "P3", "domain": "features", "category": "implementation_plan", "file": "",
         "issue": "No avatar URL validation — avatar URLs are stored as-is with no format or security check",
         "impact": "Malformed or malicious avatar URLs could cause issues in theme/display",
         "fix": "Add avatar_url validation in profile update schema"},
        {"severity": "P3", "domain": "features", "category": "implementation_plan", "file": "",
         "issue": "No emoji picker component — reactions use hardcoded emoji buttons",
         "impact": "Users cannot browse/search emojis for reactions or rich text input",
         "fix": "Integrate emoji-mart or emoji-picker-react for reaction and editor use"},
        {"severity": "P3", "domain": "features", "category": "implementation_plan", "file": "",
         "issue": "No keyboard shortcut documentation or help menu",
         "impact": "Power users cannot discover shortcuts for new features (mentions, threads, media controls)",
         "fix": "Document keyboard shortcuts in app; add Ctrl+/ shortcut help overlay"}
    ]
})

# ============================================================
# 01 - Feature Gap and Architecture Inventory
# ============================================================
prompts.append({
    "prompt_name": "feature_gap_architecture_inventory",
    "domain": "features",
    "stage": "principal_audit",
    "decision": "NO-GO",
    "generated_at": now,
    "severity_counts": {"P0": 4, "P1": 3, "P2": 2, "P3": 1},
    "category_scores": {"existing_capability": 40, "missing_primitives": 25, "implementation_order": 35, "risk_assessment": 30},
    "readiness": 32.0,
    "findings": [
        {"severity": "P0", "domain": "features", "category": "existing_capability", "file": "apps/api/src/modules/messages/service.ts",
         "issue": "Thread capability: parent_id exists in messages table (FK to self) but no thread metadata, participant tracking, reply count, or unread count",
         "impact": "Threaded conversations require schema expansion: thread_metadata table, thread_participants table, thread_last_read tracking",
         "fix": "Status: PARTIAL. Add thread_metadata (reply_count, participant_count, last_activity_at), thread_participants, thread_last_read tables"},
        {"severity": "P0", "domain": "features", "category": "existing_capability", "file": "apps/api/src/modules/notifications/",
         "issue": "Notifications: basic CRUD + push exists, but NO @mention parsing, @role/@everyone, channel muting, or notification preferences",
         "impact": "Mention system is greenfield; notification engine needs rewrite for mention routing",
         "fix": "Status: PARTIAL. Add mention parsing pipeline, mention validation against membership, notification preference model per user"},
        {"severity": "P0", "domain": "features", "category": "missing_primitives", "file": "apps/web/components/chat/message-list.tsx",
         "issue": "Virtualization: NO virtual list, NO inverted scroll, NO windowing — all messages rendered as flat DOM",
         "impact": "Channels with 1000+ messages cause OOM; no infinite scroll capability",
         "fix": "Status: ABSENT. Must implement from scratch with @tanstack/react-virtual, inverted scroll, cursor pagination"},
        {"severity": "P0", "domain": "features", "category": "missing_primitives", "file": "apps/web/components/chat/message-input.tsx",
         "issue": "Rich text editor: plain textarea with NO markdown preview, NO @mention autocomplete, NO emoji picker, NO drag-drop",
         "impact": "Message input needs complete rewrite for rich editing",
         "fix": "Status: ABSENT. Must enhance textarea with mention autocomplete, emoji picker, drag-drop upload, markdown preview"},
        {"severity": "P1", "domain": "features", "category": "existing_capability", "file": "apps/api/src/modules/workspaces/routes.ts",
         "issue": "RBAC: owner/admin/member roles exist but NO channel-level overrides, NO custom roles, NO hidden channel support",
         "impact": "Granular RBAC requires schema + middleware + RLS redesign",
         "fix": "Status: PARTIAL. Add channel_role_overrides table, update middleware for override resolution, design RLS for hidden channels"},
        {"severity": "P1", "domain": "features", "category": "existing_capability", "file": "apps/api/src/modules/messages/",
         "issue": "Search: full-text search exists with search_messages RPC but NO date range filter, NO file metadata search, NO relevance ranking",
         "impact": "Search is functional but basic — lacks enterprise search capabilities",
         "fix": "Status: PARTIAL. Add ts_rank for relevance scoring, date range filter, file metadata indexing"},
        {"severity": "P1", "domain": "features", "category": "missing_primitives", "file": "apps/api/src/",
         "issue": "Incoming webhooks: NONE exist — only outgoing webhook delivery pipeline",
         "impact": "External systems cannot post to channels; greenfield feature",
         "fix": "Status: ABSENT. Design incoming webhook model with channel ownership, secret generation, payload formatting, rate limiting"},
        {"severity": "P2", "domain": "features", "category": "missing_primitives", "file": "",
         "issue": "Optimistic UI: NO optimistic state system — all mutations wait for API response",
         "impact": "UI feels slow; no instant-feedback pattern",
         "fix": "Status: ABSENT. Create optimistic state management with temporary IDs, rollback on failure, server-echo deduplication"},
        {"severity": "P2", "domain": "features", "category": "missing_primitives", "file": "",
         "issue": "Multi-theme: light/dark only — NO slate dark, OLED high-contrast, or multi-theme architecture",
         "impact": "Theme engine needs expansion for 4 named themes with SSR-safe hydration",
         "fix": "Status: PARTIAL. Expand CSS token system; implement SSR-safe theme hydration; add Slate Dark and OLED themes"},
        {"severity": "P3", "domain": "features", "category": "missing_primitives", "file": "",
         "issue": "Audio/video media: NO WebRTC, NO media server, NO signaling channel, NO media grid — greenfield",
         "impact": "Audio/video is last priority in roadmap but requires new infrastructure",
         "fix": "Status: ABSENT. Phase 3: evaluate LiveKit; design signaling; implement media grid"}
    ]
})

# ============================================================
# 02 - Threaded Conversations
# ============================================================
prompts.append({
    "prompt_name": "threaded_conversations",
    "domain": "features",
    "stage": "principal_audit",
    "decision": "NO-GO",
    "generated_at": now,
    "severity_counts": {"P0": 2, "P1": 2, "P2": 2, "P3": 1},
    "category_scores": {"schema_design": 30, "api_contract": 35, "frontend_ux": 25, "realtime": 40, "test_plan": 20},
    "readiness": 30.0,
    "findings": [
        {"severity": "P0", "domain": "features", "category": "schema_design", "file": "supabase/migrations/",
         "issue": "No thread_metadata table — reply_count, participant_count, last_activity_at, view_count not tracked",
         "impact": "Thread list cannot show reply counts, sort by activity, or track participant engagement",
         "fix": "Create thread_metadata table: id (PK = message_id), reply_count INT DEFAULT 0, participant_count INT DEFAULT 0, last_activity_at TIMESTAMPTZ, view_count INT DEFAULT 0"},
        {"severity": "P0", "domain": "features", "category": "frontend_ux", "file": "apps/web/components/chat/thread-panel.tsx",
         "issue": "Thread panel has no thread participant tracking, no join/leave semantics, no thread unread counts, no participant list",
         "impact": "Thread UX is basic — users cannot see who is in a thread or control thread participation",
         "fix": "Add thread participants sidebar, join/leave buttons, thread unread badge, participant count display"},
        {"severity": "P1", "domain": "features", "category": "schema_design", "file": "supabase/migrations/",
         "issue": "No thread_participants table — cannot track who has joined/left a thread for notification routing",
         "impact": "Thread notifications must go to all workspace members instead of thread participants only",
         "fix": "Create thread_participants table: thread_id FK, user_id FK, joined_at, last_read_at TIMESTAMPTZ. Unique (thread_id, user_id)"},
        {"severity": "P1", "domain": "features", "category": "api_contract", "file": "apps/api/src/modules/messages/routes.ts",
         "issue": "No thread-specific API endpoints — no get thread participants, join thread, leave thread, get thread unread count",
         "impact": "Frontend cannot manage thread participation or display thread-specific state",
         "fix": "Add API endpoints: GET /threads/:id, POST /threads/:id/join, POST /threads/:id/leave, GET /threads/:id/unread"},
        {"severity": "P2", "domain": "features", "category": "realtime", "file": "apps/api/src/lib/socket.ts",
         "issue": "No thread-specific realtime events — thread:reply, thread:participant_joined, thread:participant_left",
         "impact": "Thread updates not pushed in real-time; clients must poll",
         "fix": "Add socket events: thread:reply (with parent context), thread:participant_joined, thread:participant_left"},
        {"severity": "P2", "domain": "features", "category": "frontend_ux", "file": "apps/web/components/chat/message-list.tsx",
         "issue": "No thread indicator on messages that have threads — no reply count badge, no thread preview",
         "impact": "Users cannot see which messages have active threads without clicking each one",
         "fix": "Add thread reply count badge, last reply preview text, and click-to-open-thread on message"},
        {"severity": "P3", "domain": "features", "category": "test_plan", "file": "",
         "issue": "No thread-specific tests — no E2E for thread creation, reply, join/leave, unread counts, realtime sync",
         "impact": "Thread feature will ship without automated regression coverage",
         "fix": "Write tests: create thread via reply API, fetch thread participants, join/leave, verify unread counts, verify realtime events"}
    ]
})

# ============================================================
# 03 - Notification Engine and Mentions
# ============================================================
prompts.append({
    "prompt_name": "notification_engine_mentions",
    "domain": "features",
    "stage": "principal_audit",
    "decision": "NO-GO",
    "generated_at": now,
    "severity_counts": {"P0": 2, "P1": 3, "P2": 2, "P3": 1},
    "category_scores": {"mention_parsing": 20, "delivery_layer": 30, "db_design": 35, "frontend_integration": 25},
    "readiness": 27.0,
    "findings": [
        {"severity": "P0", "domain": "features", "category": "mention_parsing", "file": "",
         "issue": "No @mention parsing at message creation time — no detection of @user, @role, @everyone, @here patterns",
         "impact": "Mention-driven notifications are completely absent; users cannot @mention each other",
         "fix": "Implement mention parser that runs at message create: extract @username patterns, resolve to user IDs, validate membership, create notification records"},
        {"severity": "P0", "domain": "features", "category": "delivery_layer", "file": "apps/api/src/modules/notifications/",
         "issue": "No offline notification queue — notifications created only for currently connected users via in-memory operations",
         "impact": "Offline users miss notifications; no persistent inbox for missed @mentions or thread replies",
         "fix": "Create notification_queue table: all notifications persisted on send; delivered via push/websocket on user reconnect"},
        {"severity": "P1", "domain": "features", "category": "db_design", "file": "supabase/migrations/",
         "issue": "No notification_preferences table — users cannot control which notifications they receive per channel or per type",
         "impact": "Every notification goes to every workspace member; no mute, no channel-level suppression",
         "fix": "Create notification_preferences: user_id FK, workspace_id FK (null=global), channel_id FK (null), notification_type TEXT, enabled BOOLEAN. Set sensible defaults."},
        {"severity": "P1", "domain": "features", "category": "mention_parsing", "file": "",
         "issue": "No @role or @everyone mention support — mention system must resolve role members and workspace members",
         "impact": "Broadcast mentions (@everyone, @channel) and role-targeted mentions (@admin, @moderator) not possible",
         "fix": "Extend mention parser: @everyone resolves to all workspace members, @role resolves to workspace_members with that role"},
        {"severity": "P1", "domain": "features", "category": "frontend_integration", "file": "apps/web/components/",
         "issue": "No mention autocomplete UI in message input — users must type @username manually with no suggestion dropdown",
         "impact": "Mention discoverability is poor; users must know exact usernames",
         "fix": "Implement @mention autocomplete popover: debounced search, keyboard-navigable list, multi-word display names"},
        {"severity": "P2", "domain": "features", "category": "delivery_layer", "file": "apps/api/src/modules/notifications/",
         "issue": "No channel muting or notification suppression rules — channel level mute/unmute not supported",
         "impact": "Users cannot mute noisy channels; notification fatigue",
         "fix": "Add channel mute flag to notification_preferences; filter notifications at delivery time based on mute rules"},
        {"severity": "P2", "domain": "features", "category": "frontend_integration", "file": "apps/web/components/notifications/notification-bell.tsx",
         "issue": "Notification bell shows count but no distinction between mention types (@user vs @everyone vs thread reply)",
         "impact": "Users cannot prioritize notifications; all notification types visually identical",
         "fix": "Add notification type icons/coloring: @mention highlight, thread reply indicator, @everyone warning style"},
        {"severity": "P3", "domain": "features", "category": "test_plan", "file": "",
         "issue": "No abuse/edge-case tests for mentions: self-mention, mention of non-member, @everyone spam, mention flood",
         "impact": "Mention system vulnerable to abuse without rate limiting or validation",
         "fix": "Add mention rate limiting (max 10 @mentions per message), self-mention check, non-member validation; write tests"}
    ]
})

# ============================================================
# 04 - RBAC and Channel Overrides
# ============================================================
prompts.append({
    "prompt_name": "rbac_channel_overrides",
    "domain": "features",
    "stage": "principal_audit",
    "decision": "NO-GO",
    "generated_at": now,
    "severity_counts": {"P0": 1, "P1": 2, "P2": 2, "P3": 1},
    "category_scores": {"permission_matrix": 35, "schema_migration": 30, "rls_enforcement": 35, "frontend_settings": 40},
    "readiness": 35.0,
    "findings": [
        {"severity": "P0", "domain": "features", "category": "permission_matrix", "file": "",
         "issue": "No channel-level permission override model — all channel access is binary (member of workspace = can see all public channels)",
         "impact": "Cannot restrict specific channels to specific roles; hidden/staff-only channels impossible",
         "fix": "Design permission matrix: workspace roles (Admin, Moderator, Member, Guest) + channel overrides (allow/deny per role or per user). Precedence: explicit deny > explicit allow > workspace role default."},
        {"severity": "P1", "domain": "features", "category": "schema_migration", "file": "supabase/migrations/",
         "issue": "No channel_role_overrides table — cannot define per-role or per-user channel access exceptions",
         "impact": "Channel-level access control requires new database table plus RLS changes",
         "fix": "Create channel_role_overrides: channel_id FK, role TEXT (or user_id UUID nullable), permission TEXT (allow/deny), scope TEXT (read/write/admin). Unique (channel_id, role) or (channel_id, user_id)"},
        {"severity": "P1", "domain": "features", "category": "rls_enforcement", "file": "supabase/policies/",
         "issue": "Current RLS policies for channels and messages are binary — workspace member sees all public channels. No override resolution logic.",
         "impact": "RLS must be updated to consider channel_role_overrides for hidden channels and restricted content",
         "fix": "Update channel SELECT RLS: if channel has override restricting role=user_role, exclude from results. Add admin-bypass policy for workspace admins."},
        {"severity": "P2", "domain": "features", "category": "frontend_settings", "file": "",
         "issue": "No channel settings UI for managing role overrides — cannot configure channel permissions from frontend",
         "impact": "Channel permission management requires direct DB access or API calls",
         "fix": "Add channel settings page with members tab showing current role assignments and override controls (channel admin only)"},
        {"severity": "P2", "domain": "features", "category": "rls_enforcement", "file": "apps/api/src/middleware/require-membership.ts",
         "issue": "Channel access middleware checks workspace membership but not channel-level role overrides",
         "impact": "Middleware bypasses channel-level permissions; overrides only enforced at RLS level (bypassable if service_role client used)",
         "fix": "Add channel_role_override check to requireChannelAccess middleware: if user has explicit deny on channel, return 403"},
        {"severity": "P3", "domain": "features", "category": "test_plan", "file": "",
         "issue": "No privilege escalation or hidden-channel leakage tests",
         "impact": "RBAC changes risk introducing authorization bypasses without detection",
         "fix": "Write test cases: user without channel override cannot access channel, user with explicit deny gets 403, admin bypasses overrides, hidden channel not in list"}
    ]
})

# ============================================================
# 05 - Incoming Webhook Pipeline
# ============================================================
prompts.append({
    "prompt_name": "incoming_webhook_pipeline",
    "domain": "features",
    "stage": "principal_audit",
    "decision": "NO-GO",
    "generated_at": now,
    "severity_counts": {"P0": 1, "P1": 2, "P2": 2, "P3": 1},
    "category_scores": {"schema_design": 30, "api_design": 35, "security_abuse": 30, "frontend_ui": 35},
    "readiness": 32.0,
    "findings": [
        {"severity": "P0", "domain": "features", "category": "api_design", "file": "",
         "issue": "No incoming webhook endpoint exists — cannot POST to channels from external systems",
         "impact": "Core webhook feature completely absent; greenfield implementation required",
         "fix": "Design POST /v1/webhooks/incoming/:webhookId/:secret endpoint that authenticates via URL token, validates signature (if present), transforms payload into message, and inserts into target channel"},
        {"severity": "P1", "domain": "features", "category": "schema_design", "file": "supabase/migrations/",
         "issue": "No incoming_webhooks table — no webhook registration, secret generation, or channel ownership model",
         "impact": "Cannot create, manage, or revoke incoming webhook URLs per channel",
         "fix": "Create incoming_webhooks table: id UUID PK, channel_id FK, name TEXT, secret TEXT (hashed), created_by FK, is_active BOOLEAN, last_used_at TIMESTAMPTZ, created_at"},
        {"severity": "P1", "domain": "features", "category": "security_abuse", "file": "",
         "issue": "No incoming webhook rate limiting or payload size limits — external systems could flood channels with messages",
         "impact": "Without abuse controls, a misconfigured or compromised webhook could DoS a channel",
         "fix": "Add per-webhook rate limiting (max 30 req/min), max payload size (1MB), payload validation with Zod schema, optional HMAC signature verification"},
        {"severity": "P2", "domain": "features", "category": "api_design", "file": "",
         "issue": "No payload formatting/templating strategy — incoming JSON payload needs transformation into rich chat message",
         "impact": "Raw JSON payloads are not user-friendly; need structured message formatting (title, description, color, fields, footer)",
         "fix": "Design payload formatter: support common webhook formats (Slack-compatible, GitHub, GitLab, Datadog) with fallback to raw JSON embed"},
        {"severity": "P2", "domain": "features", "category": "frontend_ui", "file": "",
         "issue": "No webhook management UI in frontend — cannot create, view, or revoke incoming webhooks from app",
         "impact": "Users must use API directly to manage webhooks — poor UX",
         "fix": "Add webhook management page under channel settings: create webhook, copy URL, regenerate secret, view delivery logs, revoke"},
        {"severity": "P3", "domain": "features", "category": "test_plan", "file": "",
         "issue": "No incoming webhook test coverage — invalid payloads, expired secrets, flood conditions, rate limiting",
         "impact": "Webhook delivery reliability untested; abuse controls may not work as designed",
         "fix": "Write tests: valid webhook POST creates message, invalid signature returns 401, rate limit exceeded returns 429, oversized payload returns 413"}
    ]
})

# ============================================================
# 06 - Global Full-Text Search
# ============================================================
prompts.append({
    "prompt_name": "global_full_text_search",
    "domain": "features",
    "stage": "principal_audit",
    "decision": "GO WITH RISKS",
    "generated_at": now,
    "severity_counts": {"P0": 0, "P1": 2, "P2": 3, "P3": 1},
    "category_scores": {"index_schema": 50, "query_performance": 45, "api_design": 50, "permissions": 40},
    "readiness": 46.0,
    "findings": [
        {"severity": "P1", "domain": "features", "category": "query_performance", "file": "supabase/migrations/20260625000005_create_search.sql",
         "issue": "search_messages RPC has no ts_rank relevance scoring — results not ordered by relevance",
         "impact": "Search results are ordered by created_at rather than relevance; users see older/less relevant matches first",
         "fix": "Update search_messages RPC to use ts_rank(tsvector, tsquery) for relevance scoring, order by rank DESC, created_at DESC as tiebreaker"},
        {"severity": "P1", "domain": "features", "category": "api_design", "file": "apps/api/src/modules/messages/routes.ts",
         "issue": "Search API has no date range filter, author filter, channel filter, or pagination cursor",
         "impact": "Users cannot narrow search by date, author, or channel; no pagination for large result sets",
         "fix": "Extend search endpoint: add query params for date_from, date_to, author_id, channel_id (array), workspace_id; add cursor-based pagination"},
        {"severity": "P2", "domain": "features", "category": "index_schema", "file": "",
         "issue": "No file/attachment metadata indexed in search — file names and descriptions not searchable",
         "impact": "File search requires separate indexing or storage-level search; users cannot find files by name",
         "fix": "Add file_metadata table with searchable name/description columns; include in tsvector index or create separate search index"},
        {"severity": "P2", "domain": "features", "category": "permissions", "file": "",
         "issue": "Search RPC uses SECURITY INVOKER but still has potential to leak channel visibility if auth.uid() is NULL (anon client)",
         "impact": "Cross-channel search visibility relies on correct client; using anon client bypasses membership filter",
         "fix": "Fix search route to use req.supabase (JWT client) instead of getSupabase() — addresses existing P0 finding"},
        {"severity": "P2", "domain": "features", "category": "api_design", "file": "apps/web/components/search/",
         "issue": "Search UI shows flat results with no date range or channel filter controls",
         "impact": "Search UX is limited — users cannot filter results by date, channel, or author from the UI",
         "fix": "Add search filter bar: date range picker, channel multi-select dropdown, author autocomplete; add result type indicators (message vs file)"},
        {"severity": "P3", "domain": "features", "category": "test_plan", "file": "",
         "issue": "No search performance benchmarks — no baseline for tsvector query latency under load",
         "impact": "Search performance regressions go undetected as content grows",
         "fix": "Create search performance test: measure p50/p95/p99 latency for common search patterns with varying result sizes"}
    ]
})

# ============================================================
# 07 - Infinite Scrolling and Virtualization
# ============================================================
prompts.append({
    "prompt_name": "infinite_scrolling_virtualization",
    "domain": "features",
    "stage": "frontend_release_gate",
    "decision": "NO-GO",
    "generated_at": now,
    "severity_counts": {"P0": 1, "P1": 2, "P2": 2, "P3": 1},
    "category_scores": {"current_bottleneck": 20, "component_refactor": 30, "pagination_strategy": 35, "accessibility": 45},
    "readiness": 32.0,
    "findings": [
        {"severity": "P0", "domain": "features", "category": "current_bottleneck", "file": "apps/web/components/chat/message-list.tsx",
         "issue": "Message list renders ALL visible messages as DOM nodes — no virtualization, no windowing, no inverted scroll",
         "impact": "Channels with 1000+ messages cause 10000+ DOM nodes; browser freezes on large channels; OOM on long sessions",
         "fix": "Integrate @tanstack/react-virtual with estimatedItemSize for variable-height messages; implement inverted scroll (load older on scroll up, anchor at bottom for new messages)"},
        {"severity": "P1", "domain": "features", "category": "pagination_strategy", "file": "apps/web/components/chat/chat-view.tsx",
         "issue": "No cursor-based pagination for loading older messages — chat-view fetches once without pagination",
         "impact": "Cannot load channel history beyond initial fetch; no infinite scroll up",
         "fix": "Implement cursor-based pagination: fetch initial 50 messages, detect scroll-to-top, pass cursor for next page, insert older messages at top while maintaining scroll position"},
        {"severity": "P1", "domain": "features", "category": "component_refactor", "file": "apps/web/components/chat/message-list.tsx",
         "issue": "No scroll anchoring for new messages — new messages push existing content down, losing user scroll position",
         "impact": "When user scrolls up to read history, new incoming messages shift the viewport; user loses their place",
         "fix": "Implement scroll anchoring: detect if user is near bottom (within 200px), auto-scroll on new messages; if scrolled up, maintain position with offset adjustment"},
        {"severity": "P2", "domain": "features", "category": "accessibility", "file": "",
         "issue": "Virtual list could break keyboard navigation — screen readers need aria-setsize and aria-posinset on virtualized items",
         "impact": "Keyboard users may lose focus tracking or experience non-sequential navigation in virtualized list",
         "fix": "Add aria-setsize and aria-posinset to each virtualized message; ensure focus management with virtual focus tracking; test with NVDA/VoiceOver"},
        {"severity": "P2", "domain": "features", "category": "component_refactor", "file": "apps/web/components/chat/",
         "issue": "Unread indicators and jump-to-present behavior not supported with current flat message rendering",
         "impact": "Users cannot mark position and jump to latest messages after reviewing history",
         "fix": "Add unread marker (visual separator), 'Jump to present' button (appears when scrolled up), and 'New messages' indicator"},
        {"severity": "P3", "domain": "features", "category": "test_plan", "file": "",
         "issue": "No virtualization performance benchmarks — no baseline for DOM nodes, memory usage, or scroll FPS",
         "impact": "Performance improvement from virtualization cannot be measured or validated",
         "fix": "Create performance benchmark: measure DOM node count, memory usage, scroll frame rate at 100, 1000, and 10000 messages"}
    ]
})

# ============================================================
# 08 - Optimistic UI Engine
# ============================================================
prompts.append({
    "prompt_name": "optimistic_ui_engine",
    "domain": "features",
    "stage": "frontend_release_gate",
    "decision": "GO WITH RISKS",
    "generated_at": now,
    "severity_counts": {"P0": 0, "P1": 2, "P2": 2, "P3": 1},
    "category_scores": {"action_matrix": 35, "state_model": 30, "rollback_ux": 30, "server_echo_dedup": 35},
    "readiness": 32.0,
    "findings": [
        {"severity": "P1", "domain": "features", "category": "action_matrix", "file": "apps/web/components/chat/message-input.tsx",
         "issue": "Message sending is synchronous — waits for API response before showing message in list",
         "impact": "Noticeable delay between pressing Send and message appearing; chat feels sluggish",
         "fix": "Implement optimistic send: generate temporary UUID, add message to state immediately with 'sending' flag, replace ID on server confirmation, show retry on failure"},
        {"severity": "P1", "domain": "features", "category": "state_model", "file": "apps/web/components/chat/",
         "issue": "No temporary entity ID strategy — message, reaction, and edit operations all use real IDs from server",
         "impact": "Cannot perform optimistic updates without knowing the final ID; delays all mutation feedback",
         "fix": "Create temporary ID generation strategy (crypto.randomUUID()); map temp IDs to server IDs on confirmation; reconcile state"},
        {"severity": "P2", "domain": "features", "category": "rollback_ux", "file": "",
         "issue": "No rollback visual feedback — when optimistic update fails, user sees no error indication or retry mechanism",
         "impact": "Failed sends silently disappear; users must retype messages",
         "fix": "Show failed message inline with 'Failed to send — tap to retry' banner; preserve message content in local draft on failure"},
        {"severity": "P2", "domain": "features", "category": "server_echo_dedup", "file": "",
         "issue": "No deduplication strategy for server echoes — when server confirms via WebSocket, optimistic message may duplicate",
         "impact": "Duplicate messages appear when server echoes back the same message that was optimistically inserted",
         "fix": "Use temporary UUID as dedup key: on receiving socket message:new, check if temp ID exists in state; if yes, replace with server data; if no, insert as new"},
        {"severity": "P3", "domain": "features", "category": "action_matrix", "file": "",
         "issue": "Reactions, edits, and deletes are not in optimistic UI scope — only message sends considered",
         "impact": "Partial optimistic coverage; reaction and edit feedback still delayed",
         "fix": "Extend optimistic engine: optimistic reaction toggle (immediate visual change, revert on failure), optimistic edit (immediate update, revert on server reject)"}
    ]
})

# ============================================================
# 09 - Media Rich-Text Editor
# ============================================================
prompts.append({
    "prompt_name": "media_rich_text_editor",
    "domain": "features",
    "stage": "frontend_release_gate",
    "decision": "NO-GO",
    "generated_at": now,
    "severity_counts": {"P0": 1, "P1": 2, "P2": 2, "P3": 1},
    "category_scores": {"editor_architecture": 20, "mention_autocomplete": 20, "attachment_pipeline": 25, "accessibility": 30},
    "readiness": 23.0,
    "findings": [
        {"severity": "P0", "domain": "features", "category": "editor_architecture", "file": "apps/web/components/chat/message-input.tsx",
         "issue": "Message input is a simple <textarea> with no rich editing capabilities — no markdown, no mentions, no emoji, no drag-drop",
         "impact": "Core message input must be completely re-architected for rich editing — cannot incrementally enhance a plain textarea",
         "fix": "Choose enhanced-textarea architecture (TipTap/ProseMirror for rich editing, or textarea with overlay components for simpler approach); implement markdown preview, slash commands, and keyboard shortcuts"},
        {"severity": "P1", "domain": "features", "category": "mention_autocomplete", "file": "",
         "issue": "No mention/channel autocomplete popover — @ and # triggers have no suggestion UI",
         "impact": "Users must type exact @usernames and #channel-slugs from memory; no discoverability",
         "fix": "Implement @mention popover: trigger on @keypress, debounced user search across workspace members, keyboard navigation (arrow keys + Enter), multi-word display names with avatar. Same pattern for #channel autocomplete."},
        {"severity": "P1", "domain": "features", "category": "attachment_pipeline", "file": "",
         "issue": "File upload is a separate API call with no inline drag-drop or paste support in message input",
         "impact": "Users must use separate upload UI; no inline image pasting or drag-drop from desktop",
         "fix": "Implement drag-drop zone on message input area, paste event handler for images, upload progress indicator in compose bar, attachment preview pills before send"},
        {"severity": "P2", "domain": "features", "category": "editor_architecture", "file": "",
         "issue": "No emoji picker in message input — users cannot add emoji to messages from compose UI",
         "impact": "Emoji usage requires typing :emoji_name: manually or using separate emoji picker for reactions only",
         "fix": "Integrate emoji-mart or custom emoji picker: trigger on :keypress or toolbar button, frequently used/recent emoji section, search/filter"},
        {"severity": "P2", "domain": "features", "category": "accessibility", "file": "",
         "issue": "Rich editor risks breaking keyboard accessibility — arrow keys, Enter, and Escape in autocomplete must not interfere with normal text editing",
         "impact": "Keyboard users may be unable to type @ or # characters normally, or autocomplete may trap focus",
         "fix": "Ensure keyboard navigation: Escape closes autocomplete without selecting, Backspace on empty mention removes mention chip, Enter selects without submitting form"},
        {"severity": "P3", "domain": "features", "category": "test_plan", "file": "",
         "issue": "No tests for paste, drag-drop, emoji, or mention interaction flows",
         "impact": "Rich editor UX changes will ship without regression coverage",
         "fix": "Write Playwright tests: paste image creates upload, drag-drop file shows preview, @mention selects user, emoji picker inserts emoji"}
    ]
})

# ============================================================
# 10 - Adaptive Theme Engine
# ============================================================
prompts.append({
    "prompt_name": "adaptive_theme_engine",
    "domain": "features",
    "stage": "frontend_release_gate",
    "decision": "GO WITH RISKS",
    "generated_at": now,
    "severity_counts": {"P0": 0, "P1": 1, "P2": 2, "P3": 1},
    "category_scores": {"current_theme_audit": 50, "token_strategy": 40, "ssr_hydration": 35, "contrast_accessibility": 45},
    "readiness": 42.0,
    "findings": [
        {"severity": "P1", "domain": "features", "category": "ssr_hydration", "file": "apps/web/",
         "issue": "Theme system has no SSR-safe hydration — theme class is set client-side after hydration, causing flash-of-unstyled-theme (FOUT)",
         "impact": "Users see light theme briefly before dark theme applies on page load; poor perceived performance",
         "fix": "Implement SSR-safe theme hydration: read theme preference from cookie on server, inject theme class into <html> before React hydration, suppress hydration warning"},
        {"severity": "P2", "domain": "features", "category": "token_strategy", "file": "packages/ui/src/styles.css",
         "issue": "Only 2 themes (light/dark) defined via CSS class — no slate dark, OLED high-contrast, or multi-theme token system",
         "impact": "Cannot support 4+ named themes without expanding token system to multi-variable per theme pattern",
         "fix": "Redesign CSS variable system: define all color tokens per theme (--color-bg-primary, --color-text-primary, etc.), create theme classes (.theme-light, .theme-slate-dark, .theme-oled-black), migrate existing light/dark tokens"},
        {"severity": "P2", "domain": "features", "category": "current_theme_audit", "file": "",
         "issue": "Theme toggle only supports system/light/dark — no named theme selection UI",
         "impact": "Users cannot choose Slate Dark or OLED High-Contrast themes from preferences",
         "fix": "Update theme preferences: add theme selection UI in settings (Light, Slate Dark, OLED Black, System), persist as theme_name in user_preferences table"},
        {"severity": "P3", "domain": "features", "category": "contrast_accessibility", "file": "",
         "issue": "No automated contrast validation for theme tokens — dark mode and OLED mode contrast not verified",
         "impact": "New themes may fail WCAG AA contrast requirements; accessibility regressions",
         "fix": "Add automated contrast check in CI: compare all theme token combinations against WCAG AA ratios; fail build on contrast violations"}
    ]
})

# ============================================================
# 11 - Liquid Responsive Design
# ============================================================
prompts.append({
    "prompt_name": "liquid_responsive_design",
    "domain": "features",
    "stage": "frontend_release_gate",
    "decision": "GO WITH RISKS",
    "generated_at": now,
    "severity_counts": {"P0": 0, "P1": 2, "P2": 2, "P3": 1},
    "category_scores": {"layout_audit": 40, "breakpoint_strategy": 30, "mobile_navigation": 35, "sidebar_behavior": 40},
    "readiness": 36.0,
    "findings": [
        {"severity": "P1", "domain": "features", "category": "breakpoint_strategy", "file": "apps/web/",
         "issue": "No tablet-specific breakpoint — layout jumps from desktop 3-column to mobile single-column at 768px, no intermediate state",
         "impact": "Tablet users on 768-1024px devices get either cramped desktop or overly expanded mobile layout",
         "fix": "Add tablet breakpoint (1024px): collapsed channel sidebar with slide-out drawer, always-visible workspace list icons, compact message area"},
        {"severity": "P1", "domain": "features", "category": "sidebar_behavior", "file": "apps/web/components/shared/app-sidebar.tsx",
         "issue": "Mobile sidebar overlay lacks smooth animations and swipe-to-close gesture",
         "impact": "Mobile navigation feels abrupt; users cannot swipe-close sidebar, must tap small overlay area",
         "fix": "Add CSS transition for sidebar slide-in/out, implement swipe-to-close gesture detection on mobile, add backdrop blur for visual depth"},
        {"severity": "P2", "domain": "features", "category": "mobile_navigation", "file": "apps/web/app/(workspace)/[workspaceSlug]/[channelId]/page.tsx",
         "issue": "No bottom navigation tab bar on mobile — users cannot switch between channels or workspaces without sidebar",
         "impact": "Mobile navigation requires opening sidebar for every context switch; inefficient UX",
         "fix": "Add mobile bottom tab bar: workspace switcher, channel list access, notifications bell, search shortcut, user menu"},
        {"severity": "P2", "domain": "features", "category": "layout_audit", "file": "apps/web/components/chat/",
         "issue": "Thread panel on mobile overlaps full screen with no back-navigation — users cannot see channel context while in thread",
         "impact": "Mobile thread UX traps users; no split-view or side-panel pattern for smaller screens",
         "fix": "Mobile thread: full-screen thread view with back arrow returning to channel, preserved scroll position on return, swipe-right to go back"},
        {"severity": "P3", "domain": "features", "category": "test_plan", "file": "",
         "issue": "No responsive layout tests in Playwright — mobile and tablet viewports not tested",
         "impact": "Layout changes for responsive design have zero automated regression coverage",
         "fix": "Add Playwright viewport tests: 375px (mobile), 768px (tablet), 1440px (desktop); verify all 3 columns visible on desktop, collapsed sidebar on tablet, single column on mobile"}
    ]
})

# ============================================================
# 12 - Audio/Video Media UI
# ============================================================
prompts.append({
    "prompt_name": "audio_video_media_ui",
    "domain": "features",
    "stage": "frontend_release_gate",
    "decision": "NO-GO",
    "generated_at": now,
    "severity_counts": {"P0": 2, "P1": 2, "P2": 1, "P3": 1},
    "category_scores": {"infrastructure": 10, "media_grid": 15, "control_surface": 20, "degraded_state": 15},
    "readiness": 15.0,
    "findings": [
        {"severity": "P0", "domain": "features", "category": "infrastructure", "file": "",
         "issue": "No WebRTC infrastructure at all — no STUN/TURN server configured, no signaling service, no media server choice",
         "impact": "Audio/video is a complete greenfield feature requiring new infrastructure and significant architecture decisions",
         "fix": "Evaluate media server options: LiveKit (managed/hosted, native WebRTC, SFU architecture), Daily.co (managed, simple API), or mediasoup (self-hosted, flexible). Deploy STUN/TURN server (coturn) for NAT traversal."},
        {"severity": "P0", "domain": "features", "category": "media_grid", "file": "",
         "issue": "No participant media grid component — no video tiles, active speaker detection, or layout management",
         "impact": "Core video UI must be built from scratch; no existing patterns in codebase",
         "fix": "Design media grid: responsive grid layout (1:1 speaker view, 2x2 for 4 participants, 3x3 for 9+), active speaker highlight with CSS transition, screen share as primary tile when active"},
        {"severity": "P1", "domain": "features", "category": "control_surface", "file": "",
         "issue": "No device permission UX — no camera/microphone selector, no permission request flow, no mute/deafen UI",
         "impact": "Users cannot control their media devices; no way to mute/unmute or switch cameras",
         "fix": "Implement device control bar: mute/unmute mic, camera on/off, screen share, end call; device selector dropdown; browser permission request flow with denied-state handling"},
        {"severity": "P1", "domain": "features", "category": "degraded_state", "file": "",
         "issue": "No degraded network handling — no bandwidth estimation, no resolution downscaling, no reconnection strategy",
         "impact": "Poor network conditions will cause frozen video, missing audio, or dropped calls with no user feedback",
         "fix": "Implement bandwidth estimation and adaptive resolution (simulcast/SVC); add reconnection logic with visual indicator; display 'poor connection' warning"},
        {"severity": "P2", "domain": "features", "category": "accessibility", "file": "",
         "issue": "No keyboard shortcuts or accessibility for media controls — mute/deafen hotkeys, screen reader announcements for participant activity",
         "impact": "Media controls inaccessible to keyboard-only users; participant changes not announced to screen readers",
         "fix": "Add keyboard shortcuts (M=mic mute, D=deafen, Ctrl+E=end call); add aria-live region for participant joined/left announcements; ensure focus management in media grid"},
        {"severity": "P3", "domain": "features", "category": "test_plan", "file": "",
         "issue": "No WebRTC test strategy — media testing requires special infrastructure",
         "impact": "Audio/video reliability cannot be validated in standard CI",
         "fix": "Write Playwright tests using fake media devices (chrome --use-fake-device-for-media-stream); test UI state transitions, device selection, mute/unmute; use LiveKit's built-in E2E test framework if using LiveKit"}
    ]
})

# ============================================================
# 13 - Platform Readiness for Expansion
# ============================================================
prompts.append({
    "prompt_name": "platform_readiness_expansion",
    "domain": "features",
    "stage": "principal_audit",
    "decision": "NO-GO",
    "generated_at": now,
    "severity_counts": {"P0": 2, "P1": 3, "P2": 2, "P3": 1},
    "category_scores": {"shared_types": 30, "package_boundaries": 35, "migration_discipline": 25, "api_versioning": 30, "observability": 30, "worker_needs": 15},
    "readiness": 27.0,
    "findings": [
        {"severity": "P0", "domain": "features", "category": "shared_types", "file": "packages/db/src/types.ts",
         "issue": "TypeScript types are severely out of sync with DB schema — 6 types defined vs 16 tables exist; soft-delete fields missing",
         "impact": "Feature expansion will produce type errors across all packages; developers forced to use 'any'",
         "fix": "Run supabase gen types typescript --local > packages/db/src/types.ts before starting feature implementation; add CI check for type-schema drift"},
        {"severity": "P0", "domain": "features", "category": "worker_needs", "file": "",
         "issue": "No background job infrastructure — no job queue (Bull/BullMQ), no worker process, no scheduled task framework",
         "impact": "Notification fanout, webhook delivery retry, search indexing, and media processing all require async workers; current architecture handles these synchronously or not at all",
         "fix": "Design job queue abstraction: Redis-backed BullMQ for Node.js, worker process pattern (apps/worker/), job retry/DLQ handling, scheduled job support for retention/pruning"},
        {"severity": "P1", "domain": "features", "category": "api_versioning", "file": "apps/api/src/",
         "issue": "API versioning uses /v1/ prefix but no version negotiation headers (Accept-version, Sunset, Deprecation)",
         "impact": "Expanding API for new features cannot gracefully deprecate old endpoints; breaking changes affect all clients",
         "fix": "Implement version negotiation: Accept-Version header support, Deprecation/Sunset headers on old versions, version migration guide in docs"},
        {"severity": "P1", "domain": "features", "category": "migration_discipline", "file": "supabase/migrations/",
         "issue": "No down/rollback scripts for any existing 26 migrations — feature expansion adds more migrations without rollback capability",
         "impact": "Schema changes for 11 new features will compound the rollback problem; forward-fix becomes only option",
         "fix": "Write down scripts for existing ALTER TABLE migrations (#14-16); mandate down scripts for all future migrations"},
        {"severity": "P1", "domain": "features", "category": "observability", "file": "",
         "issue": "No business analytics or feature usage tracking — cannot measure adoption of new features",
         "impact": "Cannot determine whether feature investments (threads, mentions, search) are being used or are having impact",
         "fix": "Add feature usage tracking: create feature_events table (event_type TEXT, user_id, metadata JSONB); instrument feature entry points; create adoption dashboard"},
        {"severity": "P2", "domain": "features", "category": "package_boundaries", "file": "",
         "issue": "No realtime event naming convention or registry — socket events are ad-hoc in service files",
         "impact": "New feature realtime events will have inconsistent naming; clients must reverse-engineer event payloads",
         "fix": "Create realtime event registry (TypeScript enum or const object) in packages/realtime/ with typed payloads for all events"},
        {"severity": "P2", "domain": "features", "category": "shared_types", "file": "",
         "issue": "No API contract validation between frontend and backend — types are duplicated or manually maintained",
         "impact": "Frontend/backend contract drift for new features will cause silent production failures",
         "fix": "Create packages/contract/ with shared API request/response types shared between apps/api and apps/web; add JSON Schema validation or use tRPC"},
        {"severity": "P3", "domain": "features", "category": "feature_flag_infrastructure", "file": "",
         "issue": "Feature flags exist in DB but are not wired to code — cannot dark-launch new features",
         "impact": "New features must be deployed all-at-once; no gradual rollout or kill-switch capability",
         "fix": "Wire featureFlagService.evaluateFlag() into feature boundaries before implementing new features; set up flag evaluation in frontend via API"}
    ]
})

# ============================================================
# 14 - Feature Test Expansion
# ============================================================
prompts.append({
    "prompt_name": "feature_test_expansion",
    "domain": "testing",
    "stage": "principal_audit",
    "decision": "NO-GO",
    "generated_at": now,
    "severity_counts": {"P0": 2, "P1": 2, "P2": 2, "P3": 1},
    "category_scores": {"test_matrix": 15, "tooling": 30, "ci_tiers": 25, "fixtures": 20},
    "readiness": 22.0,
    "findings": [
        {"severity": "P0", "domain": "testing", "category": "test_matrix", "file": "",
         "issue": "Zero test coverage for all 11 planned features — threads, mentions, RBAC, webhooks, search, virtualization, optimistic UI, editor, themes, responsive layout, media UI all untested",
         "impact": "Feature expansion will ship 11 new feature areas with zero automated regression coverage",
         "fix": "Write test matrix per feature: unit tests (service logic), integration tests (API contracts), E2E tests (user journeys), and performance tests. Prioritize threads, mentions, RBAC, and webhooks first."},
        {"severity": "P0", "domain": "testing", "category": "fixtures", "file": "",
         "issue": "No test data factories or seeding infrastructure — tests must set up workspace, channels, messages, and members from scratch",
         "impact": "E2E tests for feature scenarios require complex multi-step setup; tests are skipped because setup is too hard",
         "fix": "Create test data factory functions (buildWorkspace(), buildChannel(), buildMessage(), buildUser()) with sensible defaults; add Playwright fixtures for auth context"},
        {"severity": "P1", "domain": "testing", "category": "test_matrix", "file": "",
         "issue": "No performance or load tests for any feature area — search, virtualization, and realtime fanout untested under load",
         "impact": "Feature performance regressions go undetected; search latency and virtual list scroll FPS degrade silently",
         "fix": "Add k6 scenarios for search throughput, message send latency, and WebSocket connect rate; add browser performance benchmarks for virtual list scroll FPS and DOM node count"},
        {"severity": "P1", "domain": "testing", "category": "ci_tiers", "file": "",
         "issue": "No CI execution tiers for feature tests — all E2E tests run in single pipeline, no smoke/full/regression separation",
         "impact": "E2E test suite will become slow as feature tests are added, blocking CI",
         "fix": "Implement 3-tier CI strategy: Tier 0 (smoke, <2min, on every push), Tier 1 (critical path, <10min, on PR), Tier 2 (full suite, on nightly/release)"},
        {"severity": "P2", "domain": "testing", "category": "tooling", "file": "",
         "issue": "No visual regression tooling for new frontend features — themes, responsive layout, rich editor cannot be visually diffed",
         "impact": "UI regressions in 5 new frontend feature areas will reach production undetected",
         "fix": "Install Playwright visual comparison snapshots; add screenshot baselines for theme variations, responsive breakpoints, and editor states"},
        {"severity": "P2", "domain": "features", "category": "test_matrix", "file": "",
         "issue": "No flaky test prevention strategy — no retry logic, no test isolation, no cleanup hooks",
         "impact": "Flaky tests from complex async feature interactions will undermine CI reliability",
         "fix": "Implement Playwright test retries (retries: 2), beforeEach cleanup for DB state, test isolation for WebSocket connections, dedicated test Supabase project"},
        {"severity": "P3", "domain": "testing", "category": "tooling", "file": "",
         "issue": "No Storybook for isolated component testing of new UI features",
         "impact": "Editor, media grid, and theme components cannot be developed and tested in isolation",
         "fix": "Install Storybook with @chat/ui package; create stories for all new feature components with theme and responsive viewport variants"}
    ]
})

# ============================================================
# 15 - Feature Release Gate
# ============================================================
prompts.append({
    "prompt_name": "feature_release_gate",
    "domain": "features",
    "stage": "quality_confirmation",
    "decision": "NO-GO",
    "generated_at": now,
    "severity_counts": {"P0": 3, "P1": 2, "P2": 2, "P3": 1},
    "category_scores": {"p0_resolution": 10, "migration_safety": 25, "contract_match": 30, "e2e_coverage": 15, "rollout_strategy": 20},
    "readiness": 20.0,
    "findings": [
        {"severity": "P0", "domain": "features", "category": "p0_resolution", "file": "",
         "issue": "11 unresolved P0 issues across feature domains prevent release — threads (2), mentions (2), virtualization (1), editor (1), RBAC (1), webhooks (1), media (2), platform (1)",
         "impact": "Feature expansion cannot ship with active P0 issues — each represents a blocking security, data loss, or functionality risk",
         "fix": "Resolve all P0 issues before release. Priority order: RBAC (permission bypass), mentions (notification loss), threads (data model), virtualization (OOM), editor (broken input), webhooks (missing endpoint), media (infrastructure)"},
        {"severity": "P0", "domain": "features", "category": "migration_safety", "file": "supabase/migrations/",
         "issue": "Feature expansion requires 8+ new database tables with no rollback scripts — compounds existing migration risk",
         "impact": "Schema rollout for new features is irreversible without PITR; production migration failure means data loss",
         "fix": "Write down scripts for all new migrations before deployment; test rollback in CI; implement forward-fix migration pattern for hotfix scenarios"},
        {"severity": "P0", "domain": "features", "category": "rollout_strategy", "file": "",
         "issue": "No feature flag wiring exists — every new feature would be globally on or off with no gradual rollout capability",
         "impact": "Cannot dark-launch, canary-test, or phased-rollout any feature; bugs affect all users simultaneously",
         "fix": "Wire feature flag evaluation before shipping features: threads_flag, mentions_flag, rbac_flag, webhooks_flag, search_v2_flag, editor_flag. Set all to false by default, enable per-workspace for testing."},
        {"severity": "P1", "domain": "features", "category": "contract_match", "file": "",
         "issue": "Frontend/backend contract mismatch risk is high — no shared types package, no API contract validation, realtime event names ad-hoc",
         "impact": "Contract drift between frontend and backend will cause silent production errors for new features",
         "fix": "Create shared API contract definitions (packages/contract/) before implementing features; validate with tRPC or Zod-to-JSON-Schema"},
        {"severity": "P1", "domain": "features", "category": "e2e_coverage", "file": "",
         "issue": "Zero E2E coverage for all 11 features — no automated flow testing for any new capability",
         "impact": "Feature regressions will reach production without detection; release confidence is extremely low",
         "fix": "Set E2E coverage requirement: each feature must have at least 1 happy-path E2E test before release (minimum 11 new E2E tests)"},
        {"severity": "P2", "domain": "features", "category": "rollout_strategy", "file": "",
         "issue": "No post-release monitoring checklist — no KPIs defined for feature health (adoption, error rate, latency)",
         "impact": "Cannot detect if feature rollout causes issues without proactive monitoring",
         "fix": "Define feature-level monitoring for each feature: adoption rate, error rate, latency p95. Add dashboard panels. Configure Sentry alerts for error spikes."},
        {"severity": "P2", "domain": "features", "category": "rollout_strategy", "file": "",
         "issue": "No phased release plan — all features would ship simultaneously in a single deployment",
         "impact": "Coordination risk; if one feature has issues, all features must rollback together",
         "fix": "Plan phased release: Phase 1 (feature flags, test infra, RBAC), Phase 2 (threads, mentions, search), Phase 3 (editor, virtualization, optimistic UI), Phase 4 (webhooks, themes, responsive), Phase 5 (media)"},
        {"severity": "P3", "domain": "features", "category": "post_release", "file": "",
         "issue": "No rollback runbook for feature-specific rollback — feature flag disable is only option; if schema change is involved, feature cannot be rolled back independently",
         "impact": "Feature rollback requires full deployment rollback if schema migration was applied",
         "fix": "Design feature-level rollback: feature flag kill-switch as first line, forward-fix migration as second line, PITR as last resort. Document for each feature."}
    ]
})

# ============================================================
# WRITE ALL FILES AND INGEST
# ============================================================
for p in prompts:
    name = p["prompt_name"]
    path = OUTPUTS / f"{name}.json"
    path.write_text(json.dumps(p, indent=2, default=str), encoding="utf-8")
    print(f"Written: {path.name} ({len(p['findings'])} findings, P0={p['severity_counts']['P0']})")

print(f"\nTotal: {len(prompts)} prompts")

# Ingest each
print("\n--- Ingesting ---")
for p in prompts:
    name = p["prompt_name"]
    path = OUTPUTS / f"{name}.json"
    result = subprocess.run(
        [sys.executable, str(INGEST), "--prompt-name", name, "--output-file", str(path)],
        capture_output=True, text=True, cwd=str(REPO)
    )
    if result.returncode == 0:
        parsed = json.loads(result.stdout)
        print(f"  {name}: OK (run_id={parsed['run_id']}, findings={parsed['finding_count']})")
    else:
        print(f"  {name}: FAILED - {result.stderr.strip()}")
