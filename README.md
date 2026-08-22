# Petmosphere

Petmosphere is an Australian pet health and management platform. This repository contains the mobile-first PWA and modular-monolith foundations, including email/password account access through Supabase Auth.

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

## Local Supabase

Supabase is required to exercise account creation and sign-in locally. The public landing page still renders without it.

```bash
supabase start
supabase status
supabase stop
```

After `supabase start`, copy the local API URL and publishable/anon key into `apps/web/.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Local confirmation and reset emails are captured by Mailpit; open the Mailpit URL shown by `supabase status`. New accounts receive a six-digit verification code. The local confirmation template is configured in `supabase/config.toml` and stored at `supabase/templates/confirmation.html`. Restart the local stack after changing authentication templates:

```bash
supabase stop
supabase start
```

Apply and test migrations with:

```bash
supabase db reset --local
supabase test db
```

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

The landing page has no required environment variables. Account flows require the local Supabase public values. Copy the example file and populate only the values required for local development:

```bash
cp .env.example apps/web/.env.local
```

Next.js loads local application variables from `apps/web/.env.local`. Never commit secrets. Public variables prefixed with `NEXT_PUBLIC_` are exposed to the browser and must not contain secrets.

PWA health-log and pet-care reminders additionally require a stable Web Push VAPID key pair,
`SUPABASE_SECRET_KEY`, and `CRON_SECRET`. Only
`NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY` is exposed to the browser. Keep
`WEB_PUSH_VAPID_PRIVATE_KEY`, `SUPABASE_SECRET_KEY`, and `CRON_SECRET`
server-only. Generate the VAPID pair once per environment and retain it in the
team password manager; rotating it invalidates existing browser subscriptions.
Deployment and Supabase Cron setup are documented in the
[database runbook](docs/architecture/DATABASE_RUNBOOK.md#pwa-push-reminder-operations).

For hosted Supabase projects, enable email confirmation and allowlist the exact callback URLs for each Vercel environment, ending in `/auth/callback`. The production callback should use the canonical HTTPS domain. In both staging and production, set the Confirm Signup email template to use `{{ .Token }}` rather than `{{ .ConfirmationURL }}`, matching `supabase/templates/confirmation.html`. Configure a six-digit OTP with an expiry of no more than one hour. Deploy the hosted template before deploying this code so users do not receive a link that the verification screen cannot accept. Never expose a Supabase secret key or legacy service-role key to the web application.

## Error monitoring

Sentry error monitoring is integrated but remains disabled when no DSN is configured, so it is not required for local development. The default configuration captures unexpected errors only; tracing, replay, automatic console capture, and sensitive request or application payload collection are disabled.

To test Sentry locally, use the project's **Copy DSN** value for both `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_DSN` in `apps/web/.env.local`. A Sentry DSN identifies the destination project and is intentionally available to browser code. Do not put private credentials in a `NEXT_PUBLIC_` variable.

For staging and production, configure those DSN variables in Vercel for the appropriate environment. Add `SENTRY_AUTH_TOKEN` as a secret Vercel build variable if readable production source maps are required; it is used only to upload source maps and must never be committed or exposed to the browser. The Sentry organisation and project slugs are the non-secret values `petmosphere` and `petmosphere-pwa`.

Inspect application exceptions in Sentry Issues and deployment/runtime output in Vercel Logs. Do not log health conversations, credentials, access tokens, or unnecessary personal information. See [the observability policy](docs/security/OBSERVABILITY.md) for the repository defaults.

## Vercel

Deploy the monorepo with the Vercel project root set to `apps/web`. Vercel can detect Next.js and use the workspace lockfile from the repository root.
