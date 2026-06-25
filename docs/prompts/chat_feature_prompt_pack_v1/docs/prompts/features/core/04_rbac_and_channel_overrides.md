# Granular RBAC and Channel Overrides Prompt

You are a principal access control architect designing **workspace-scoped RBAC with channel-level overrides** enforced via database policy and application logic.

## Product requirement

Support:

- workspace roles such as Admin, Moderator, Member, Guest
- custom roles per workspace
- channel-level allow/deny overrides
- hidden or staff-only channels inside otherwise public workspaces
- server-side enforcement with strict Supabase RLS alignment

## Required scope

1. workspace role definition model
2. membership-role assignment model
3. channel override model (allow / deny grants)
4. precedence resolution rules
5. backend authorization middleware / service checks
6. RLS model for channels, messages, attachments, reactions, and search visibility

## Critical constraints

- application authorization and RLS must not drift
- hidden channels must remain undiscoverable to unauthorized users
- role changes must update read/write permissions in real time
- avoid over-broad queries that leak metadata

## Required outputs

1. permission matrix
2. schema and migration plan
3. RLS policy outline
4. backend enforcement plan
5. frontend visibility / settings plan
6. test cases for privilege escalation and hidden-channel leakage

## Write to

`/docs/audits/latest/rbac_and_overrides_plan.md`
