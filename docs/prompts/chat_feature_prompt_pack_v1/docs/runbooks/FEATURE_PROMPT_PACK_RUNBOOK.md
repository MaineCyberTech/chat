# Feature Prompt Pack Runbook

## Fast start

1. Run the master orchestrator prompt.
2. Run the feature gap inventory prompt.
3. Run the core feature prompts in order.
4. Run frontend/media prompts after core architecture is mapped.
5. Run the test expansion prompt.
6. Run the feature release gate prompt.

## Suggested feature implementation order

### Wave 1 — foundation

- threads
- notification engine / mentions
- RBAC / channel overrides

### Wave 2 — integration and discovery

- incoming webhooks
- global search

### Wave 3 — interaction depth

- virtualization
- optimistic UI
- rich text editor
- theme engine
- responsive layout

### Wave 4 — real-time media depth

- audio/video media UI

## Recommended outputs to preserve

- `feature_gap_inventory.md`
- `threaded_conversations_plan.md`
- `notification_mentions_plan.md`
- `rbac_and_overrides_plan.md`
- `incoming_webhooks_plan.md`
- `full_text_search_plan.md`
- `feature_test_expansion_plan.md`
- `feature_release_gate.md`
