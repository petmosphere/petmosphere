# Petmosphere

Petmosphere is an Australian pet health and management platform. This repository currently contains the mobile-first Hello World PWA and the modular-monolith foundations for future product work.

## Prerequisites

- Git
- Node.js LTS (Node 24 recommended)
- [pnpm](https://pnpm.io/)
- Docker Desktop
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)

Docker and the Supabase CLI are only required when using the optional local Supabase stack.

## Local setup

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful checks:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

## Optional local Supabase

Supabase is prepared for future database, authentication, and storage work. It is not needed by the Hello World app.

```bash
supabase start
supabase stop
```

No application tables or migrations exist yet.

Before creating or promoting database changes, follow the
[database development and release runbook](docs/architecture/DATABASE_RUNBOOK.md).

## Repository structure

- `apps/web` — the Next.js App Router PWA and its browser-facing tests.
- `packages/domain` — framework-independent domain models and business rules.
- `packages/api-contracts` — future shared runtime API schemas and transport contracts.
- `packages/services` — application use cases that coordinate domain and ports.
- `packages/database` — future Supabase/PostgreSQL adapters.
- `packages/integrations` — future external-provider adapters.
- `packages/config` — shared, non-secret configuration helpers.
- `packages/test-utils` — shared test helpers.
- `supabase` — local Supabase configuration, migrations, and seed entry point.
- `docs` — architecture, ADR, product, and security records.

See [the architecture overview](docs/architecture/ARCHITECTURE.md) for dependency boundaries.

## Environment variables

The Hello World app has no required environment variables. When later work needs them, copy the example file and populate only the values required for local development:

```bash
cp .env.example apps/web/.env.local
```

Next.js loads local application variables from `apps/web/.env.local`. Never commit secrets. Public variables prefixed with `NEXT_PUBLIC_` are exposed to the browser and must not contain secrets.

## Error monitoring

Sentry error monitoring is integrated but remains disabled when no DSN is configured, so it is not required for local development. The default configuration captures unexpected errors only; tracing, replay, automatic console capture, and sensitive request or application payload collection are disabled.

To test Sentry locally, use the project's **Copy DSN** value for both `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_DSN` in `apps/web/.env.local`. A Sentry DSN identifies the destination project and is intentionally available to browser code. Do not put private credentials in a `NEXT_PUBLIC_` variable.

For staging and production, configure those DSN variables in Vercel for the appropriate environment. Add `SENTRY_AUTH_TOKEN` as a secret Vercel build variable if readable production source maps are required; it is used only to upload source maps and must never be committed or exposed to the browser. The Sentry organisation and project slugs are the non-secret values `petmosphere` and `petmosphere-pwa`.

Inspect application exceptions in Sentry Issues and deployment/runtime output in Vercel Logs. Do not log health conversations, credentials, access tokens, or unnecessary personal information. See [the observability policy](docs/security/OBSERVABILITY.md) for the repository defaults.

## Vercel

Deploy the monorepo with the Vercel project root set to `apps/web`. Vercel can detect Next.js and use the workspace lockfile from the repository root.
