# Security Policy

## Reporting a security issue

If you discover a security issue in the Chat Platform, do **not** open a public issue containing exploit details, credentials, or private data.

Instead, report the issue privately to the repository maintainers. Include:

- A clear description of the issue
- Reproduction steps if safe to share
- Potential impact and affected components

## Sensitive areas

Particular care should be taken when reviewing or changing:

- Authentication flows (magic link, JWT)
- Environment variables and secrets
- Supabase roles, keys, and RLS policies
- Storage policies for file uploads
- Real-time message delivery (Socket.io)
- Workspace and channel access controls

## Safe handling expectations

- Never commit real `.env` or secret values
- Never publish user data in issues, PRs, or screenshots
- Avoid posting raw production logs containing sensitive values
- Treat migration and RLS policy changes as security-sensitive changes
