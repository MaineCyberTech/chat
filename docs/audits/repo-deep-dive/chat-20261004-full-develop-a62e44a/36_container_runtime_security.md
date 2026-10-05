# 36_container_runtime_security — Prompt 36 - Container Runtime Security Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `36_container_runtime_security.md` (area CTR, prompt)

## Verification Performed

Dockerfile/compose runtime review. Images run
non-root; third-party images are digest-pinned. Residual: no seccomp/cap-drop/
read-only/no-new-privileges runtime profile.

## Findings

| ID | Severity | Title |
|---|---|---|
| CTR-P3-001 | P3 | Containers lack runtime hardening beyond non-root and digest pinning |
| CTR-P3-002 | P3 | First-party images are referenced by mutable tag (`:latest`/`:dev`) |
