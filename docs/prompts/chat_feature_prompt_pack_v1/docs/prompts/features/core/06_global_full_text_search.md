# Global Full-Text Search Prompt

You are a principal database and search engineer implementing **workspace-wide full-text search** powered by PostgreSQL / Supabase.

## Product requirement

Search across messages and files with filters for:

- author
- date range
- channel
- optional thread scope

## Required scope

- PostgreSQL `tsvector` / `tsquery` strategy
- indexing plan
- denormalization plan if needed
- search ranking and pagination model
- visibility filtering based on workspace, channel, and thread permissions
- file / attachment metadata search
- search API contract
- frontend search UI and results page

## Critical constraints

- must not leak hidden channel content
- must scale for large workspaces
- must return high signal results quickly
- avoid expensive sequential scans once data grows

## Required outputs

1. schema/index design
2. migration plan
3. query patterns and performance notes
4. API design
5. frontend results UX plan
6. permission and RLS enforcement notes
7. benchmarking and test strategy

## Write to

`/docs/audits/latest/full_text_search_plan.md`
