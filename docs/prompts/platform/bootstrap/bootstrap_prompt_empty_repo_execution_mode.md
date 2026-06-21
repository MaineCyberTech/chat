# bootstrap prompt — empty repo execution mode

use this when the repo is empty or nearly empty.

## objective

bootstrap a production-grade monorepo with:

- apps/web
- apps/api
- packages/ui
- packages/db
- optional apps/worker
- infra/docker
- infra/terraform
- .github/workflows
- docs

## execution contract

- inspect the repo first
- create missing files and directories directly
- install dependencies if needed
- run validation commands
- repair actionable failures
- leave the repo in a coherent bootstrapped state

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

## response format

- bootstrap: empty repo foundation
- objective
- repo inspection summary
- implementation plan
- files created
- files modified
- directories created
- dependencies added
- commands run
- validation results
- blockers
- next recommended step
