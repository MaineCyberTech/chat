# Incoming Webhook Pipeline Prompt

You are a principal integrations engineer implementing **incoming webhooks** for channels.

## Product requirement

Users should be able to generate a unique webhook URL per channel. External systems (for example source control, commerce, uptime monitors) can POST JSON payloads that are transformed into rich embedded messages in the target channel.

## Required scope

- webhook registration and secret/URL generation model
- channel-level ownership and permissions to create/revoke webhooks
- Express API endpoint design for inbound payloads
- signature validation strategy when appropriate
- payload formatter / templating strategy
- rate limiting and abuse controls
- retry/observability/error handling
- embed rendering model in the chat feed

## Frontend requirements

- manage webhooks UI
- copy/regenerate secret URL UX
- webhook delivery logs / recent failures UX

## Required outputs

1. schema design for webhook endpoints and delivery logs
2. API route design
3. formatter architecture
4. security / abuse model
5. frontend management UI plan
6. test plan (invalid payloads, signature issues, flood conditions)

## Write to

`/docs/audits/latest/incoming_webhooks_plan.md`
