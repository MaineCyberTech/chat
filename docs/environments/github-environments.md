# GitHub Environments

The repository uses GitHub Environments for deployment gating.

## Defined Environments

### `development`

- **Trigger**: Push to `develop` branch or manual dispatch
- **Domain**: `chat.mainecybertech.us`
- **Workflow**: `deploy-development.yml`

### `production`

- **Trigger**: Push to `main` branch or manual dispatch
- **Domain**: `chat.mainecybertech.com`
- **Workflow**: `deploy-production.yml`

## Setup

1. In GitHub repo Settings → Environments, create both `development` and `production`
2. Add required reviewers for `production` (recommended)
3. Configure environment secrets (DO token, SSH keys, etc.) per environment

## Branch Strategy

```
main      → production deploy
develop   → development deploy
feature/* → CI only (no deploy)
```
