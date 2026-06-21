# execution runbook

## general operating model

assume the downstream ai has:

- full repo filesystem access
- ability to create/modify/delete files when appropriate
- ability to install dependencies
- ability to run validation commands
- ability to repair actionable issues

## expected ai behavior

1. inspect the repo first
2. modify files directly
3. run validation commands
4. fix issues it introduces
5. return a concise execution report

## suggested human review checkpoints

review manually after:

- strict bootstrap
- phase 3 platform (frontend chat engine)
- final reconciliation
- ux/ui phase 1 design-system pass
- chat specialization pass
- frontend release gate
