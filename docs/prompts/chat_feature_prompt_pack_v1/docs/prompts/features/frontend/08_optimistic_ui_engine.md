# Optimistic UI Engine Prompt

You are a principal frontend state-management engineer implementing a **zero-latency-feeling optimistic UI system**.

## Product requirement

The UI should instantly reflect:

- sending messages
- editing/deleting messages
- adding/removing reactions
- joining/leaving threads when appropriate

Backend confirmation or rollback should occur gracefully if the network fails or the request is rejected.

## Required scope

- identify all mutable user actions in the chat app
- classify which actions are safe for optimistic updates
- define temporary entity IDs and reconciliation strategy
- plan rollback states and user-visible feedback
- ensure realtime server echoes do not duplicate local optimistic state

## Required outputs

1. optimistic action matrix
2. state model / cache update strategy
3. rollback UX plan
4. backend confirmation flow notes
5. conflict resolution strategy
6. test scenarios for packet loss, duplicate events, and stale state

## Write to

`/docs/audits/latest/optimistic_ui_plan.md`
