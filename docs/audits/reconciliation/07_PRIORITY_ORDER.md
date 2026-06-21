# Priority Order

## Suggested Priority Order

1. **Preserve working behavior** — auth, real-time messaging, deployment pipeline
2. **Preserve auth / routing / deployment semantics** — do not change contracts
3. **Fix accessibility issues** — aria-labels, focus trap, focus-within, aria-live
4. **Improve developer experience** — Supabase seeds, shared config, env docs
5. **Improve test coverage** — E2E tests for primary user flows
6. **Improve visual consistency** — icons, loading states, feedback patterns
7. **Add resilience** — error boundaries, toast notifications
8. **Add operational tooling** — local stack scripts
9. **Defer strategic improvements** — worker, notifications, responsive layout

## Tie-Break Guidance

- If a recommendation improves style but increases operational risk → prefer safety
- If a recommendation increases similarity to the reference repo but weakens current usability → prefer current usability
- If a recommendation requires major churn without clear measurable value → defer it
- If two improvements have equal value → prioritize the one with lower risk
