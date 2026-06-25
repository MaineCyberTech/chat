# Master Feature Rollout Operator Runbook

## Objective

This runbook tells operators exactly how to roll out major chat-app capabilities without destabilizing the existing product. It is written for repo operators, principal engineers, and release owners.

## Core operating rules

1. Do not implement all features at once.
2. Core data-model and permission changes must be validated before UI polish waves.
3. Every rollout wave requires explicit evidence and a stop/go checkpoint.
4. High-risk features must ship behind feature flags or controlled rollout gates first.
5. Do not promote a wave if migrations, contract changes, or permission impacts are not fully understood.

## Rollout waves

### Wave 0 — Inventory and readiness

- run architecture and feature inventory prompts
- identify the current state, gaps, and safe order of operations
- produce a consolidated implementation and risk plan

### Wave 1 — Core collaboration foundations

- threaded conversations
- notification engine and mentions
- RBAC and channel overrides

This wave touches the most sensitive backend and database areas and must be completed before broader search/integration work.

### Wave 2 — Integrations and search

- incoming webhooks
- global workspace search

### Wave 3 — Frontend interaction depth

- virtualization
- optimistic UI
- rich text editor
- adaptive theme engine
- liquid responsive layout

### Wave 4 — Media collaboration

- audio/video media UI and session UX

### Wave 5 — Verification and release

- test expansion
- release gate decision
- staged rollout and monitoring plan

## Stop conditions

Stop immediately if any of the following occur:

- unresolved P0 issues
- unresolved P1 issues in core auth, permissions, realtime sync, or data visibility
- migration risk is not clearly documented
- frontend/backend contract mismatch exists
- hidden/private channel data can leak through search, notifications, or threads
- the rollout is not feature-flagged when risk warrants containment

## Minimum evidence per wave

Each wave should produce:

- one implementation plan
- one risk summary
- one rollout checklist
- one verification record
- one operator decision
