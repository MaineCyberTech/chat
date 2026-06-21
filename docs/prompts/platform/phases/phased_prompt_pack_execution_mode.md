# phased prompt pack — execution mode

this is the core platform implementation pack for an autonomous ai with full repository filesystem access.

## environment model

development

- https://chat.mainecybertech.us
- https://chat-api.mainecybertech.us

production

- https://chat.mainecybertech.com
- https://chat-api.mainecybertech.com

github environments

- development
- production

## core rules

- inspect the repo first
- create/modify files directly
- run build/lint/typecheck/test/validation commands
- repair actionable failures
- preserve working code where practical
- keep local/dev/prod assumptions consistent
- do not hand-wave auth, rls, websocket correctness, or environment handling

## phase order

1. database schema, sql, and rls
2. express api and socket.io lifecycle
3. next.js client chat engine
4. docker / traefik runtime orchestration
5. terraform + cloud-init provisioning
6. github actions / ci-cd / environment promotion
7. testing / validation / operational runbooks

## required execution report format

- phase header
- objective
- repo inspection summary
- implementation plan
- files created
- files modified
- commands run
- validation results
- blockers
- next recommended step
