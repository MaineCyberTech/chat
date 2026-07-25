# Architecture Decision Records (ADRs)

ADRs capture significant architectural decisions made on this project, including context,
options considered, and consequences.

## Format

Each ADR follows this structure:

1. **Title** — Short noun phrase describing the decision.
2. **Status** — Proposed, Accepted, Deprecated, or Superseded.
3. **Context** — Background and problem statement.
4. **Decision** — The chosen approach and rationale.
5. **Alternatives Considered** — Options that were evaluated and rejected.
6. **Consequences** — Positive and negative outcomes of the decision.

## Index

| Number | Title | Status |
|--------|-------|--------|
| [0001](./0001-supabase-auth-rls.md) | Use Supabase Auth + RLS for authentication and tenant isolation | Accepted |

## Creating a New ADR

1. Copy `0001-supabase-auth-rls.md` as a template.
2. Increment the record number.
3. Fill in all sections.
4. Propose via PR and update the status above once accepted.
