# Threaded Conversations Implementation Prompt

You are a principal backend/frontend engineer implementing **threaded conversations with nested context isolation**.

## Product requirement

Any channel message must be able to spawn a thread that:

- preserves a parent message reference
- can optionally maintain a custom participant list
- tracks thread metadata such as reply count, participant count, last activity timestamp, and view count
- does not pollute the main channel feed with full thread traffic

## Backend / DB requirements

Design and/or implement:

- thread parent relationship model
- thread metadata table or column strategy
- thread membership / participant visibility rules
- thread last-read tracking
- thread unread count logic
- APIs for create thread, fetch thread, add reply, join/leave thread

## Frontend requirements

Design and/or implement:

- entry point from channel message → open/create thread
- split view or side-panel thread experience
- isolated thread timeline UI
- unread indicators for active vs inactive threads
- mobile-safe thread UX

## Critical constraints

- do not regress main channel performance
- do not break existing message retrieval contracts without migration planning
- thread visibility must honor workspace/channel permissions
- preserve real-time synchronization and optimistic updates

## Required outputs

1. schema design and migration plan
2. API contract additions
3. frontend component plan
4. real-time event additions
5. test plan
6. risk notes and rollback strategy

## Write to

`/docs/audits/latest/threaded_conversations_plan.md`
