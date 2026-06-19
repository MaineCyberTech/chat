# Environment Model

## Environments

| Environment | Frontend Domain           | API Domain                    | GitHub Environment |
| ----------- | ------------------------- | ----------------------------- | ------------------ |
| Development | `chat.mainecybertech.us`  | `chat-api.mainecybertech.us`  | `development`      |
| Production  | `chat.mainecybertech.com` | `chat-api.mainecybertech.com` | `production`       |

## Local Development

Local development uses `localhost`:

| Service       | URL                     |
| ------------- | ----------------------- |
| Web (Next.js) | `http://localhost:3000` |
| API (Express) | `http://localhost:4000` |

## Environment Variables

### Web (`NEXT_PUBLIC_*`)

| Variable                        | Dev Local               | Dev Remote                           | Production                            |
| ------------------------------- | ----------------------- | ------------------------------------ | ------------------------------------- |
| `NEXT_PUBLIC_API_URL`           | `http://localhost:4000` | `https://chat-api.mainecybertech.us` | `https://chat-api.mainecybertech.com` |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL    | Same                                 | Same                                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key       | Same                                 | Same                                  |
| `NEXT_PUBLIC_APP_URL`           | `http://localhost:3000` | `https://chat.mainecybertech.us`     | `https://chat.mainecybertech.com`     |

### API

| Variable            | Dev Local               | Dev Remote                       | Production                        |
| ------------------- | ----------------------- | -------------------------------- | --------------------------------- |
| `PORT`              | `4000`                  | `4000`                           | `4000`                            |
| `NODE_ENV`          | `development`           | `development`                    | `production`                      |
| `SUPABASE_URL`      | Supabase project URL    | Same                             | Same                              |
| `SUPABASE_ANON_KEY` | Supabase anon key       | Same                             | Same                              |
| `FRONTEND_URL`      | `http://localhost:3000` | `https://chat.mainecybertech.us` | `https://chat.mainecybertech.com` |

## Supabase

Both environments connect to the same Supabase project. Schema changes are applied via migration files in `packages/db/sql/migrations/`.

See `infra/docker/.env.devremote.example` and `infra/docker/.env.prod.example` for env file templates.
