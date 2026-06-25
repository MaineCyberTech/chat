# Infinite Scrolling and List Virtualization Prompt

You are a senior frontend performance engineer implementing a **virtualized, high-scale chat viewport**.

## Product requirement

The channel viewport must support thousands of messages and load older history when the user scrolls upward, while rendering only visible items.

## Required scope

- evaluate current message list implementation
- integrate virtualization (for example via `@tanstack/react-virtual` or similar)
- support inverted list behavior
- support variable-height messages and media attachments
- preserve scroll anchoring when older messages load
- maintain unread markers and jump-to-present behavior

## Constraints

- no obvious scroll jitter
- no broken message grouping / date separators
- no regressions for keyboard navigation or screen readers
- thread view and main channel view should share the same performance model when possible

## Required outputs

1. current bottleneck analysis
2. component refactor plan
3. data fetching / pagination strategy
4. virtualization integration details
5. performance test plan
6. regression risks and mitigations

## Write to

`/docs/audits/latest/virtualization_and_scrolling_plan.md`
