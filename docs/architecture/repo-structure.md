# Repository Structure

```
chat/
├── apps/
│   ├── api/                          # Express.js API server
│   │   ├── src/
│   │   │   ├── config/env.ts         # Zod-validated env config
│   │   │   ├── lib/
│   │   │   │   ├── logger.ts         # Structured logger
│   │   │   │   └── supabase.ts       # Supabase client init
│   │   │   ├── middleware/
│   │   │   │   ├── error-handler.ts  # Centralized error handler
│   │   │   │   └── request-id.ts     # Request ID injection
│   │   │   ├── modules/
│   │   │   │   └── health/           # Health check module
│   │   │   ├── app.ts                # Express app factory
│   │   │   └── server.ts             # Entry point
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                          # Next.js App Router
│       ├── app/
│       │   ├── globals.css           # Tailwind + base styles
│       │   ├── layout.tsx            # Root layout
│       │   └── page.tsx              # Home page
│       ├── components/
│       │   └── home/                 # Home page components
│       ├── lib/
│       │   └── env.ts                # Client env validation
│       ├── next.config.ts
│       ├── package.json
│       ├── postcss.config.js
│       └── tsconfig.json
│
├── packages/
│   ├── ui/                           # Shared UI components
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   └── button.tsx
│   │   │   ├── index.ts
│   │   │   └── styles.css
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── db/                           # Database package
│       ├── sql/
│       │   ├── migrations/           # SQL migrations
│       │   ├── functions/            # PG functions
│       │   ├── policies/             # RLS policies
│       │   └── seeds/                # Seed data
│       ├── src/
│       │   ├── config.ts             # Supabase client factory
│       │   └── index.ts
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
│
├── infra/
│   ├── docker/                       # Docker + Caddy
│   │   ├── Caddyfile
│   │   ├── Caddyfile.prod
│   │   ├── docker-compose.devremote.yml
│   │   ├── docker-compose.prod.yml
│   │   └── .env.*.example
│   │
│   └── terraform/                     # Terraform provisioning
│       ├── templates/
│       │   └── cloud-init.yaml.tftpl
│       ├── main.tf / variables.tf / outputs.tf
│       └── terraform.tfvars.example
│
├── tests/
│   ├── e2e/                           # Playwright tests
│   ├── integration/                   # Integration tests
│   └── setup/                         # Vitest setup
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── validate.yml
│   │   ├── build-push.yml
│   │   ├── deploy-development.yml
│   │   ├── deploy-production.yml
│   │   └── infra-development.yml
│   ├── pull_request_template.md
│   └── dependabot.yml
│
├── docs/                              # Documentation
│   ├── architecture/
│   ├── environments/
│   ├── runbooks/
│   └── contributing/
│
├── root config files
│   ├── package.json
│   ├── pnpm-workspace.yaml
│   ├── turbo.json
│   ├── tsconfig.base.json
│   ├── eslint.config.mjs
│   ├── .prettierrc.json
│   ├── vitest.config.ts
│   ├── playwright.config.ts
│   └── .gitignore / .editorconfig / .npmrc
│
└── README.md
```
