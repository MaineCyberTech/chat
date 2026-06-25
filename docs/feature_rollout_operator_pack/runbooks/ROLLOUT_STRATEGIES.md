# Rollout Strategies

## Strategy 1 — Dark launch

Implement backend capability and hidden UI plumbing without exposing user controls broadly. Use this when you need to validate migrations, APIs, delivery logs, or background behavior before user exposure.

Best for:

- webhooks
- search indexing
- thread metadata infrastructure
- notification queues

## Strategy 2 — Feature-flag partial rollout

Expose functionality only behind flags, ideally scoped to environment, workspace, or allowlist cohort.

Best for:

- optimistic UI changes
- rich editor
- responsive layout changes
- notification UX changes

## Strategy 3 — Workspace allowlist rollout

Enable for a small set of internal or pilot workspaces first. Good when behavior depends on real collaboration patterns.

Best for:

- threads
- mentions and unread semantics
- search UX
- media collaboration UI

## Strategy 4 — Staged GA

Roll out progressively once metrics, usability, and regressions are acceptable.

## Required operator decision per strategy

- why this strategy was chosen
- what metrics define safety
- what rollback or disable control exists
- who approves expansion to the next cohort
