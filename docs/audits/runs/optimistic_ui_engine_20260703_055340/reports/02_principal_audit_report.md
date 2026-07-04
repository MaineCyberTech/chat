# Principal Audit Report

- Prompt: **optimistic_ui_engine**
- Domain: **features**
- Run ID: **optimistic_ui_engine_20260703_055340**
- Generated: **2026-07-03T12:00:00.000Z**
- Decision: **GO WITH RISKS**
- P0: **0**, P1: **0**
- P2: **2**, P3: **1**
- Readiness: **46.70**

## Findings

### P2 — Optimistic updates are only applied to message send; edit, delete, and reactions call the API synchronously with no optimistic placeholder

- **File:** `apps/web/components/chat/chat-view.tsx:264`
- **Category:** optimistic_coverage
- **Impact:** Edit/delete/reaction interactions feel slower because the UI waits for the server round-trip before updating.
- **Fix:** Wrap handleEdit and handleDelete in useOptimistic with temp-ID rollback; apply optimistic reaction toggles locally before the API call.

### P2 — deduplicateEcho uses a synchronous boolean read from inside a setItems callback to check for duplicates, which may produce stale reads under React concurrent rendering

- **File:** `apps/web/lib/optimistic/use-optimistic.ts:59`
- **Category:** reconciliation
- **Impact:** Under React concurrent mode or batched state updates, the synchronous exists check may incorrectly return false, causing duplicate messages.
- **Fix:** Use useRef<Set<string>> to track seen IDs outside the state update cycle for server-echo deduplication.

### P3 — Failed optimistic sends are silently removed with no inline retry UI — the rollback simply filters out the temp message

- **File:** `apps/web/components/chat/chat-view.tsx:245`
- **Category:** error_recovery
- **Impact:** Users see their message disappear after a send failure with no way to retry, causing confusion and data loss.
- **Fix:** Display inline retry button on failed messages using the errors map from useOptimistic; implement resubmit callback.
