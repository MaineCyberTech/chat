# Chat Repo Intake Placeholder

Use this file only when the `chat` repository contents become available.

## Intake checklist

- [ ] Snapshot or clone of chat repo available
- [ ] Branch and commit identified
- [ ] Stack identified
- [ ] Environment model identified
- [ ] Auth/session model identified
- [ ] Build/test commands identified
- [ ] Deployment workflow identified
- [ ] Integration points with Maine CyberTech portal identified

## Minimal intake questions for the reviewer/AI

1. Is `chat` a standalone product, a shared service, or a portal subdomain app?
2. Does it share auth/session state with the portal?
3. Does it have its own CI/CD or reuse platform infra?
4. Are there shared packages or duplicated implementations?
5. Does it introduce new environment/secrets/infra requirements?

## Output expectation once repo is available

- Structural inventory
- Dependency and deployment model
- Shared surface area with portal
- Safe integration/reconciliation recommendations
- Explicit no-fabrication note if any required evidence is still missing
