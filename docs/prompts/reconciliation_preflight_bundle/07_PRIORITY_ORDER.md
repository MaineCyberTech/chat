# Priority Order

Use this file to tell the final reconciler how to break ties when recommendations conflict.

## Suggested Priority Order

Customize as needed.

1. Preserve working behavior
2. Preserve auth / routing / deployment semantics
3. Preserve enterprise usability and clear workflows
4. Improve consistency where risk is low
5. Improve readability and maintainability where safe
6. Align with reference repo where beneficial
7. Defer aesthetic-only churn

## Local Overrides

If your repo/project has different priorities, list them here.

1.
2.
3.
4.
5.

## Tie-Break Guidance

- If a recommendation improves style but increases operational risk, prefer safety.
- If a recommendation increases similarity to the reference repo but weakens current usability, prefer current usability.
- If a recommendation requires major churn without clear measurable value, defer it.
