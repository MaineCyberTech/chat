# 38_env_secret_rotation — Prompt 38 - Environment and Secret Rotation Audit

- Run: `chat-20261004-full-develop-a62e44a`
- Target: `chat` @ `a62e44a` (branch `develop`)
- Domain: `38_env_secret_rotation.md` (area SECRET, prompt)

## Verification Performed

Reviewed `docs/security/secrets-rotation.md`,
`jwks_rotation.md` and the env examples. Rotation is documented but manual;
no expiry/rotation monitoring is wired.

## Findings

| ID | Severity | Title |
|---|---|---|
| SECRET-P3-001 | P3 | Secret rotation is documented but not scheduled or monitored |
| SECRET-P3-002 | P3 | `.env` example files diverge between environments |
