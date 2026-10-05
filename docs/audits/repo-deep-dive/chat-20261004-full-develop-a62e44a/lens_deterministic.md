# Deterministic checks — deterministic

Machine checks (no LLM). Findings use the `DET` area.

## Findings

| ID | Title | Severity |
|---|---|---|
| DET-P3-001 | [DEP] trivy not installed (dependency vuln scan skipped) | P3 |
| DET-P3-002 | [SUPPLY] 9 container image(s) without a digest pin | P3 |
| DET-P3-003 | [SUPPLY] hadolint not installed (Dockerfile lint skipped) | P3 |

## Detail

### Finding ID: DET-P3-001 - [DEP] trivy not installed (dependency vuln scan skipped)

Install trivy to enable the --deep dependency vulnerability scan.


### Finding ID: DET-P3-002 - [SUPPLY] 9 container image(s) without a digest pin

Pin images by digest (`image@sha256:...`) for reproducible, tamper-evident deploys.

- `infra/docker/docker-compose.prod.yml:29 ${WEB_IMAGE:-ghcr.io/mainecybertech/chat/web:latest}`
- `infra/docker/docker-compose.prod.yml:49 ${WORKER_IMAGE:-ghcr.io/mainecybertech/chat/worker:latest}`
- `infra/docker/docker-compose.prod.yml:116 ${API_IMAGE:-ghcr.io/mainecybertech/chat/api:latest}`
- `infra/docker/docker-compose.devremote.yml:26 ${WEB_IMAGE:-ghcr.io/mainecybertech/chat/web:dev}`
- `infra/docker/docker-compose.devremote.yml:69 ${WORKER_IMAGE:-ghcr.io/mainecybertech/chat/worker:dev}`
- `infra/docker/docker-compose.devremote.yml:106 ${API_IMAGE:-ghcr.io/mainecybertech/chat/api:dev}`
- `infra/docker/docker-compose.dev.yml:29 chat-web:dev`
- `infra/docker/docker-compose.dev.yml:61 chat-api:dev`
- `infra/docker/docker-compose.dev.yml:99 chat-worker:dev`

### Finding ID: DET-P3-003 - [SUPPLY] hadolint not installed (Dockerfile lint skipped)

Install hadolint to lint Dockerfiles in --deep mode.

