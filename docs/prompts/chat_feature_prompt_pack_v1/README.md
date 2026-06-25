# Chat Feature Prompt Pack — Incremental Product Expansion Edition

This repo-ready prompt pack is designed for **execution-mode AI agents** and principal engineers to incrementally improve a modern chat application.

It focuses on:

- advanced communication features
- production-safe architectural expansion
- Discord/Teams-grade UX and interaction patterns
- scalable data and permission models
- release-safe implementation sequencing

## What is included

- a master orchestration prompt that drives phased execution
- feature-specific deep implementation prompts
- frontend UX / media experience prompts
- database and API evolution prompts
- testing and release gate prompts
- templates for architecture decisions, migration plans, and handoff

## Recommended execution order

1. `docs/prompts/orchestration/00_master_feature_orchestrator.md`
2. `docs/prompts/reconciliation/01_feature_gap_and_architecture_inventory.md`
3. Core platform prompts in `docs/prompts/features/core/`
4. Frontend prompts in `docs/prompts/features/frontend/`
5. Media prompts in `docs/prompts/features/media/`
6. Testing prompts in `docs/prompts/testing/`
7. Release prompts in `docs/prompts/release/`

## Output expectations

Each prompt is designed to produce:

- markdown findings or implementation plans in `/docs/audits/latest/`
- file-level implementation plans
- migration recommendations
- risk / regression notes
- test requirements

## Product areas covered

### Expanded core system functionality

- threaded conversations
- notification engine and mentions system
- granular RBAC and channel-specific overrides
- incoming webhook pipeline
- global full-text search

### High-fidelity UI/UX and frontend experience

- infinite scrolling and virtualization
- optimistic UI engine
- media-rich text editor
- adaptive theme engine
- liquid responsive design
- audio/video media UI for WebRTC channels
