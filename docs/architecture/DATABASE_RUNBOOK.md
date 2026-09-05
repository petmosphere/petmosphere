# Database development and release runbook

This runbook is the source of truth for evolving Petmosphere's Supabase
database across three environments:

| Environment | Purpose                                        | Data                                  | Change policy                                        |
| ----------- | ---------------------------------------------- | ------------------------------------- | ---------------------------------------------------- |
| Local       | Daily development and automated database tests | Disposable synthetic data             | Reset freely                                         |
| Staging     | Rehearsal against hosted Supabase              | Synthetic or sanitised test data only | Apply reviewed migrations before production          |
| Production  | Live customer workloads                        | Real private data                     | Protected, reviewed, and promoted only after staging |

The committed files in `supabase/migrations/` are the schema source of truth.
The Supabase dashboard is an inspection and operations tool, not the normal
place to design schema changes.

## Non-negotiable safety rules

- Create every schema, policy, function, trigger, and storage-policy change in
  a migration. Do not manually change staging or production in the dashboard.
- Never edit or reorder a migration after it has been applied to a shared
  environment. Correct it with a new migration.
- Never place database passwords, secret or legacy service-role keys, access
  tokens, or
  production data in Git, prompts, screenshots, logs, seed files, or PRs.
- Browser code may use only the Supabase URL and publishable key. Privileged
  keys are server-only and must never use a `NEXT_PUBLIC_` name.
- Enable RLS on every user-owned table and test positive and negative access.
  A service-role test does not prove that RLS works.
- Do not use production as a development or debugging environment.
- Do not copy production data to local or staging unless a separately approved,
  documented sanitisation process exists.
- Before any remote database command, state the target environment and verify
  the project reference. Stop if the target is ambiguous.
- AI agents must not run a remote push, reset, restore, destructive SQL, or
  production link without explicit human approval in the current task.

## One-time setup

Authenticate the CLI without committing its token:

```bash
supabase login
```

Keep the staging and production project references in a password manager or
team operations system. Project references are identifiers, not credentials,
but clear labels prevent targeting mistakes. The CLI stores the currently
linked project in ignored local state under `supabase/.temp/`; linking does not
configure the web app.

Use staging as the normal remote link:

```bash
supabase link --project-ref voznszbrzjewutugewkt
supabase migration list
```

Confirm the displayed remote project before continuing. Vercel Preview must
use staging's URL and publishable key; Vercel Production must use production's.

## Environment configuration matrix

The application configuration is environment-specific. Set the values below
in Vercel for the hosted environments and in `apps/web/.env.local` for local
development. Never commit a populated environment file.

| Variable                                | Local development                                | Vercel Preview / staging             | Vercel Production                                                             | Source or owner                                                        |
| --------------------------------------- | ------------------------------------------------ | ------------------------------------ | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`                   | `http://localhost:3000`                          | `https://staging.petmosphere.com.au` | `https://petmosphere.com.au` (or the deliberately chosen canonical `www` URL) | Vercel/domain configuration                                            |
| `NEXT_PUBLIC_APP_ENV`                   | `development`                                    | `staging`                            | `production`                                                                  | Application configuration                                              |
| `APP_ENV`                               | `development`                                    | `staging`                            | `production`                                                                  | Application configuration                                              |
| `NEXT_PUBLIC_SUPABASE_URL`              | Local URL from `supabase status`                 | Staging project API URL              | Production project API URL                                                    | Supabase **Project Settings → API**                                    |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`  | Local publishable key                            | Staging publishable key              | Production publishable key                                                    | Supabase **Project Settings → API**                                    |
| `SUPABASE_SECRET_KEY`                   | Usually omitted; use only for local server tests | Staging secret key                   | Production secret key                                                         | Supabase **Project Settings → API Keys**; server-only                  |
| `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY` | Local/test VAPID public key                      | Staging VAPID public key             | Production VAPID public key                                                   | Generated once per environment                                         |
| `WEB_PUSH_VAPID_PRIVATE_KEY`            | Local/test private key, if push is tested        | Staging private key                  | Production private key                                                        | Generated once per environment; server-only                            |
| `WEB_PUSH_SUBJECT`                      | `mailto:info.petmosphere@gmail.com`              | Same sender identity                 | Same sender identity                                                          | Application configuration                                              |
| `CRON_SECRET`                           | Optional for local manual dispatch               | A unique random secret               | A different unique random secret                                              | Generated and stored in Vercel; also stored in matching Supabase Vault |
| `NEXT_PUBLIC_SENTRY_DSN`                | Optional local DSN                               | Sentry DSN                           | Sentry DSN                                                                    | Sentry project settings; public project identifier                     |
| `SENTRY_DSN`                            | Optional local DSN                               | Sentry DSN                           | Sentry DSN                                                                    | Sentry project settings; server-side configuration                     |
| `SENTRY_AUTH_TOKEN`                     | Omit unless uploading local source maps          | Optional build secret                | Optional build secret                                                         | Sentry token; Vercel secret only                                       |

The Supabase URL, publishable key, and secret key are obtained from each
Supabase project but are entered into Vercel as deployment variables. The
secret key must be named `SUPABASE_SECRET_KEY`; do not use the legacy
`SUPABASE_SERVICE_ROLE_KEY` name and never prefix it with `NEXT_PUBLIC_`.

The VAPID pair must be different between staging and production and must remain
stable within an environment. Rotating a pair requires users to subscribe
again. `CRON_SECRET` must match the `health_log_cron_secret` Vault value in the
same Supabase project; staging and production values must not be reused across
environments.

These variables are present for future features and are not required by the
current Hello World or core application deployment:

```env
AI_PROVIDER=
AI_API_KEY=
AI_MODEL=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

`AI_API_KEY`, `STRIPE_SECRET_KEY`, and `STRIPE_WEBHOOK_SECRET` are server-only
when those integrations are introduced. SMTP is configured in Supabase Auth,
not through an application environment variable in this repository.

### Platform settings that are not environment variables

Repeat these settings for every hosted Supabase project after creating or
restoring it:

- **Authentication → URL Configuration:** set the project Site URL and the
  exact environment callback URL ending in `/auth/callback`.
- **Authentication → Providers / Email:** enable the intended signup and email
  confirmation settings.
- **Authentication → SMTP:** configure the production SMTP host, port,
  sender, username, and password. These settings are not copied by a schema
  migration.
- **Authentication → Email Templates:** deploy and verify the confirmation
  template using `{{ .Token }}`.
- **Database → Extensions:** enable `pg_cron` and `pg_net` where reminder
  dispatch is used.
- **Vault:** set `petmosphere_app_url` and the matching
  `health_log_cron_secret`.
- **Storage:** recreate private buckets and policies, then migrate objects
  separately.
- **Realtime, webhooks, OAuth providers, Edge Functions, and custom domains:**
  inventory and recreate them when applicable.

Vercel environment variables are scoped independently to **Preview** and
**Production**. Changing a Vercel variable requires a new deployment before
the running application uses it. Keep the old project configuration available
until cutover verification is complete.

### Configuration-file ownership

- `.env.example` is the committed, names-only template. Add new variable names
  here without adding values.
- `apps/web/.env.local` is the ignored local Next.js configuration. Use the
  local Supabase URL and publishable key from `supabase status`.
- Any ignored convenience file such as `.env.staging` is not the deployment
  source of truth. Keep its names aligned with `.env.example`, and never use
  legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `SUPABASE_SERVICE_ROLE_KEY` names.
- `supabase/config.toml` and `supabase/templates/confirmation.html` control
  local Supabase behavior and email-template source. They do not hold hosted
  project secrets.
- `NODE_ENV`, `CI`, and `NEXT_RUNTIME` are managed by the runtime or CI. They
  are not deployment variables to copy between environments.
- `E2E_LOCAL_AUTH` is test-only and belongs in the local/CI test environment,
  not in production Vercel configuration.

The temporary migration variables `SOURCE_DB_URL`, `TARGET_DB_URL`, and
`BACKUP_DIR` in the examples below are shell variables only. They must not be
added to `.env.example`, Vercel, or application configuration.

## Hosted project or region migration

Supabase project regions cannot be changed in place. A migration creates a new
target project, transfers the required data and configuration, verifies the
target, and only then switches application traffic. Do not delete the source
project during the migration. Supabase's official guides distinguish database
backups from Storage objects and project-level Auth/configuration, so a schema
push alone is not a complete project migration:

- [Migrate within Supabase](https://supabase.com/docs/guides/platform/migrating-within-supabase)
- [CLI backup and restore](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
- [Database backups and PITR](https://supabase.com/docs/guides/platform/backups)

### Choose the migration path

Use one of these paths deliberately:

1. **Schema-only replacement:** acceptable only when the target does not need
   existing users, application rows, or files. Create the target project,
   apply the committed migrations, and reconfigure all project settings.
2. **Supabase Restore to a New Project:** preferred when the plan supports
   physical backups and the feature is available. It can copy database data,
   database roles, and Auth user records, but Storage objects/settings and
   several project settings still require separate work. Review the restore
   summary before confirming.
3. **Manual logical backup/restore:** use for cross-project or cross-region
   migration of application data when the managed restore path is unavailable.
   The CLI dump does not automatically make Auth, Storage objects, SMTP, Vault,
   cron, or other project configuration portable. Treat Auth users and private
   files as separate migration workstreams; never manually insert rows into
   `auth.users`.

### Pre-migration checklist

Before creating the target or copying data:

1. Record source and target project refs, regions, plan, database version,
   extensions, Storage buckets, Auth providers, SMTP, redirect URLs, Vault
   secrets, cron jobs, Realtime publications, webhooks, Edge Functions, and
   Vercel variable scopes.
2. Confirm the target region and project identity. A project ref is an
   identifier, not a secret, but a wrong ref can send data to the wrong
   environment.
3. Put the source application into a short maintenance/read-only window and
   pause scheduled dispatch jobs. Do not migrate while writes are occurring.
4. Capture baseline row counts for every application table and object counts
   for every Storage bucket. Store the checklist outside Git.
5. Confirm an off-project backup can be read before proceeding. Keep backups
   encrypted, access-controlled, and outside the repository.

### Create a logical backup

Use the source database connection string from the Supabase **Connect** panel.
Keep the connection string in a temporary shell variable only; it contains the
database password and must never be committed or pasted into logs.

```bash
export SOURCE_DB_URL='postgresql://...'
export BACKUP_DIR='/secure/path/petmosphere-migration-YYYYMMDD'
mkdir -p "$BACKUP_DIR"

supabase db dump --db-url "$SOURCE_DB_URL" \
  -f "$BACKUP_DIR/roles.sql" --role-only
supabase db dump --db-url "$SOURCE_DB_URL" \
  -f "$BACKUP_DIR/schema.sql"
supabase db dump --db-url "$SOURCE_DB_URL" \
  -f "$BACKUP_DIR/data.sql" --use-copy --data-only \
  -x "storage.buckets_vectors" -x "storage.vector_indexes"

shasum -a 256 "$BACKUP_DIR"/*.sql > "$BACKUP_DIR/SHA256SUMS"
```

If migration history must be preserved in a manually restored project, also
export it separately:

```bash
supabase db dump --db-url "$SOURCE_DB_URL" \
  -f "$BACKUP_DIR/history_schema.sql" --schema supabase_migrations
supabase db dump --db-url "$SOURCE_DB_URL" \
  -f "$BACKUP_DIR/history_data.sql" --use-copy --data-only \
  --schema supabase_migrations
```

The logical dump is not a substitute for Supabase-managed backups or PITR. On
paid plans, verify the latest daily backup or PITR recovery point in **Database
→ Backups** before starting. A backup protects recovery; it does not prove the
target restore is correct until validation is complete.

### Restore into the target project

1. Create the target project in the required region. Do not reuse the source
   project's URL or keys.
2. Configure required extensions, webhooks, and database settings before the
   restore.
3. Obtain the target connection string and restore in one transaction:

```bash
export TARGET_DB_URL='postgresql://...'

psql \
  --single-transaction \
  --variable ON_ERROR_STOP=1 \
  --file "$BACKUP_DIR/roles.sql" \
  --file "$BACKUP_DIR/schema.sql" \
  --command 'SET session_replication_role = replica' \
  --file "$BACKUP_DIR/data.sql" \
  --dbname "$TARGET_DB_URL"
```

Do not run this command against an existing target that already contains the
same schema or data. Restore either into a new empty project or follow a
reviewed merge procedure. If Vault or column encryption is used, stop and
follow Supabase's encryption-key procedure instead of using the generic
command above.

If continuing with the CLI migration workflow, restore the separately exported
`supabase_migrations` history and then verify it:

```bash
psql --single-transaction --variable ON_ERROR_STOP=1 \
  --file "$BACKUP_DIR/history_schema.sql" \
  --file "$BACKUP_DIR/history_data.sql" \
  --dbname "$TARGET_DB_URL"
supabase link --project-ref TARGET_PROJECT_REF
supabase migration list
```

Do not use `supabase migration repair` to hide an actual schema mismatch.

### Migrate Auth, Storage, and project configuration

Database restoration alone is incomplete:

- **Auth users:** the managed Restore to a New Project path may include Auth
  user records. A manual logical dump does not automatically migrate managed
  Auth data. Verify the target **Authentication → Users** count and test sign
  in, signup, verification, reset-password, and logout. Never copy or edit
  `auth.users` with ad-hoc SQL.
- **Storage:** recreate private buckets and policies, then copy every object
  using the official Storage migration approach. Verify object counts and
  downloads with signed URLs. Database backups contain Storage metadata, not
  the actual object bytes.
- **Auth configuration:** re-enter Site URL, callback allowlists, email
  confirmation, templates, SMTP, OAuth credentials, rate limits, and custom
  claims as applicable.
- **Secrets and jobs:** recreate Vault secrets, `pg_cron`/`pg_net` jobs,
  Realtime publications, webhooks, Edge Functions, and custom domains. Do not
  copy source secrets into Git or migration files.

### Validate before cutover

Run all checks against the target while the source remains available:

1. Verify SHA-256 checksums for the backup files.
2. Compare row counts and primary-key ranges for every application table.
3. Check foreign keys and application invariants; investigate every mismatch.
4. Verify Auth user count and test the full email/password flow.
5. Verify bucket names, object counts, signed access, and private RLS/storage
   policies.
6. Run `supabase migration list` and `supabase test db` against the target.
7. Run the application smoke tests with the target URL and keys, including
   RLS, reminders, notifications, and account recovery.
8. Confirm Vercel runtime logs, Sentry environment, Supabase Auth logs, cron
   jobs, and SMTP delivery.

### Cut over and retain the source

1. Re-enter the short maintenance window and stop writes and scheduled jobs on
   the source.
2. Take a final backup or delta export and restore/validate it on the target.
3. Update the target environment variables in Vercel, Supabase callback URLs,
   SMTP, Vault, cron URLs, and any integrations.
4. Redeploy Vercel and run a non-destructive production smoke test.
5. Keep the source project intact and read-only for an agreed retention period.
   Do not route traffic back to it after new writes begin unless you have a
   documented reconciliation plan; otherwise the two projects diverge.
6. Delete the source only after the retention period, backup verification,
   legal/data-retention review, and explicit human approval.

Record source/target refs, backup locations, counts, validation results,
cutover time, and remaining risks in the release record. Never record database
passwords, API keys, Auth tokens, private VAPID keys, or customer data.

## Normal feature workflow

### 1. Start from the current repository state

Create a feature branch, pull the latest target branch, and start local
Supabase:

```bash
supabase start
supabase status
```

Use the local URL and publishable key printed by `supabase status` in
`apps/web/.env.local`. Local keys are development credentials and must remain
uncommitted. Do not paste the complete `supabase status` output into tickets,
prompts, logs, or documentation because it also contains privileged local
credentials.

Configure the web application with only the public local values:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<PUBLISHABLE_KEY from supabase status>
```

Store these values in `apps/web/.env.local`, never in a committed environment
file. Do not use the `SECRET_KEY` or `SERVICE_ROLE_KEY` as the browser
publishable key. Restart `pnpm dev` after changing the environment file.

Before exercising a feature, inspect local migration status and apply pending
migrations without deleting existing local data:

```bash
supabase migration list --local
supabase migration up --local
```

Use `supabase db reset --local` instead when deliberately testing a clean
rebuild. A reset deletes all local users and application data.

### Register and sign in locally

With Supabase and the web application running, open:

- application: <http://localhost:3000>
- signup: <http://localhost:3000/auth/sign-up>
- local email inbox: <http://127.0.0.1:54324>

Create an account, open the verification message in the local email inbox, and
enter its six-digit code in Petmosphere. Local email is captured by Mailpit and
is not delivered to the real recipient. The verified account can then sign in
through the normal local login page.

### Inspect the local database

Open local Supabase Studio at <http://127.0.0.1:54323>. Useful locations are:

- **Authentication → Users** for registered authentication accounts
- **Table Editor → profiles** for private application profiles
- **Table Editor → policy_acceptances** for recorded policy versions
- **Table Editor → pets** for owner-scoped pet records
- **Table Editor → health_logs** for private dated pet observations, selected
  emotions/descriptions, notes and private image paths
- **Table Editor → health_log_reminders** for per-pet daily reminder preferences;
  the dispatcher records the last locally notified date here to prevent
  duplicate reminders
- **Table Editor → reminders** for owner-scoped pet-care reminder occurrences;
  completed rows retain history and the one active row represents the next
  occurrence in a repeating series. `notification_lead_minutes` stores the
  per-reminder alert timing (`0` is at due time and `null` disables alerts);
  supported lead times are 5 minutes through 1 month before the due time.
- **Table Editor → web_push_subscriptions** for private browser push endpoints
  and encryption keys; never copy these values into logs or support tickets
- **Table Editor → notifications** for the private in-app inbox; the application
  shows 60 days and the reminder dispatcher removes records after six months
- **Table Editor → health_log_analytics_events** for privacy-minimised,
  write-only Journey A event counts; it intentionally stores no user, pet,
  note, filename, media or request identifiers
- **Storage → pet-photos** for private pet profile images
- **Storage → profile-avatars** for private account profile images
- **Storage → health-log-images** for private health-log images

The Studio SQL Editor can also inspect local development records:

```sql
select id, email, created_at
from auth.users
order by created_at desc;

select * from public.profiles;
select * from public.policy_acceptances;
select * from public.pets order by created_at desc;
select * from public.health_logs order by created_at desc;
select * from public.health_log_reminders order by updated_at desc;
select * from public.reminders order by due_local_date, local_time;
select id, owner_id, created_at, updated_at
from public.web_push_subscriptions
order by updated_at desc;
select id, owner_id, kind, read_at, created_at
from public.notifications
order by created_at desc;
select * from public.health_log_analytics_events order by created_at desc;
```

Studio uses administrative access and can see through RLS. Seeing a row in
Studio proves that it exists; it does not prove that browser users are properly
isolated. Use `supabase test db` to verify owner, other-user, and anonymous RLS
behaviour.

### PWA push reminder operations

Health-log and pet-care reminder delivery use browser Web Push. Separate
Next.js dispatchers are called every five minutes by Supabase Cron. Each claims
a due occurrence at most once. Health-log reminders are skipped when that date
already has a health log. Pet-care reminders send only generic wording; titles,
notes, pet names, categories, and other private details never enter the push
payload.
The stored timezone is `Australia/Melbourne`, so PostgreSQL applies AEDT or AEST
automatically across daylight-saving boundaries.

Generate one stable VAPID pair per environment. Run this locally and copy the
output directly into the team password manager; do not paste the private key
into Git, tickets, chat, or logs:

```bash
pnpm --filter @petmosphere/web exec web-push generate-vapid-keys --json
```

Configure these Vercel variables separately for Preview/staging and Production:

```env
NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY=<environment public key>
WEB_PUSH_VAPID_PRIVATE_KEY=<matching environment private key>
WEB_PUSH_SUBJECT=mailto:info.petmosphere@gmail.com
SUPABASE_SECRET_KEY=<matching environment secret API key>
CRON_SECRET=<random value of at least 32 characters>
```

The public VAPID key is intentionally sent to browsers. The private VAPID key,
Supabase secret key, and cron secret are server-only. The secret key is the
recommended replacement for the legacy JWT-based `service_role` key. It still
uses PostgreSQL's `service_role` role and bypasses RLS, which is why the
dispatcher endpoint requires its separate cron-secret check. Keep each
environment's values matched; changing a VAPID key pair requires users to
subscribe again.

After the corresponding Vercel deployment is live, configure each hosted
Supabase project independently. Enable the `pg_cron` and `pg_net` extensions,
then store two Vault secrets:

- `petmosphere_app_url`: `https://staging.petmosphere.com.au` in staging and
  `https://petmosphere.com.au` in production
- `health_log_cron_secret`: the same `CRON_SECRET` configured for that Vercel
  environment

Create the job through **Integrations → Cron** or with reviewed SQL equivalent
to the following. Job names must be unique within each project:

```sql
select cron.schedule(
  'dispatch-health-log-reminders',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'petmosphere_app_url'
    ) || '/api/v1/health-log-reminders/dispatch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'health_log_cron_secret'
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  );
  $$
);

select cron.schedule(
  'dispatch-pet-care-reminders',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'petmosphere_app_url'
    ) || '/api/v1/reminders/dispatch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'health_log_cron_secret'
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  );
  $$
);

select cron.schedule(
  'dispatch-pet-weight-reminders',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'petmosphere_app_url'
    ) || '/api/v1/weight-reminders/dispatch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'health_log_cron_secret'
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  );
  $$
);
```

Verify job runs in **Integrations → Cron** and confirm the dispatcher returns a
successful count-only response in Vercel runtime logs. Never log subscription
endpoints, encryption keys, pet identifiers, notes, filenames, or health data.
An expired push endpoint is removed automatically. Other provider failures are
reported only as aggregate counts and are not retried that day, which avoids
duplicate notifications; the next day's reminder remains eligible.

For a safe manual staging check, enable the health-log reminder from an installed PWA,
create no health log for that pet/date, and invoke the Cron job. Confirm one
generic notification arrives, invoke it again to confirm no duplicate, then
create today's log and confirm no reminder is claimed. Repeat the time-boundary
database tests with `supabase test db` before promotion.

Also create a pet-care reminder a few minutes ahead, confirm the browser has
notification permission, select its **Notify me** timing, and invoke
`dispatch-pet-care-reminders` once that alert window opens. Confirm the
notification uses generic wording, appears in the in-app Notifications page,
opens the reminder detail, and is not sent a second time. Choosing **None**
must produce no reminder notification. Completing a repeating reminder must preserve
the completed occurrence and create exactly one next future occurrence.

For weight reminders, log a weight before the scheduled time and confirm the
job advances without sending a notification. On another due date with no
weight entry, confirm one generic notification opens the pet's Log Weight page
and that a second job run does not duplicate it. Test weekly, fortnightly,
month-end monthly, and quarter-end schedules in staging before production.

### 2. Create a migration

```bash
supabase migration new short_descriptive_name
```

Edit only the newly created SQL file. Prefer explicit SQL and small,
single-purpose migrations. Include, where applicable:

- tables, constraints, indexes, and comments
- RLS enablement and policies
- grants with the smallest necessary privileges
- reversible application compatibility during rollout

Do not put environment-specific project IDs, URLs, keys, or real customer data
in a migration.

### 3. Rebuild locally from zero

```bash
supabase db reset --local
```

This is intentionally destructive only to the local database. It reapplies all
migrations and `supabase/seed.sql`, exposing ordering mistakes and dependencies
on manually created state. Seed data must be deterministic, synthetic, minimal,
and safe to commit.

Then run database tests when present and the repository checks:

```bash
supabase test db
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

If no database tests exist yet, record that honestly in the PR. Any table with
user-owned data must add RLS tests before the feature is complete.

### 4. Review the migration

Review the SQL as carefully as application code. Check:

- fresh-database application succeeds
- existing rows remain valid
- locks and table rewrites are acceptable
- constraints cannot fail on existing data
- indexes support new access paths without unnecessary duplication
- RLS covers anonymous, authenticated owner, and different-user access
- privileged functions use a safe `search_path` and justified security mode
- no secret, personal data, or environment-specific value is present

Commit the migration with the application change that requires it. Do not
apply an uncommitted migration remotely.

## Promotion to staging

Migrations are promoted in order: local, staging, then production. Never skip
staging.

1. Merge or use the exact reviewed commit intended for release.
2. Confirm the CLI is linked to staging:

   ```bash
   supabase link --project-ref voznszbrzjewutugewkt
   supabase migration list
   ```

3. Preview pending changes, then apply them:

   ```bash
   supabase db push --dry-run
   supabase db push
   supabase migration list
   ```

4. Deploy the Vercel Preview build that uses staging.
5. Run smoke tests and explicitly exercise authentication, authorization, RLS,
   constraints, and failure paths affected by the migration.
6. Observe Supabase logs, Vercel logs, and Sentry for unexpected failures.

Record the migration names, staging verification, and known risks in the PR or
release record.

## Promotion to production

Production promotion is a deliberate release operation, not a routine coding
step.

Before approval:

- the exact migration has passed a clean local reset and staging verification
- application code remains compatible with both the old and new schema during
  deployment
- Supabase backup/PITR status and the recovery approach have been checked
- destructive or high-lock changes have a maintenance and communication plan
- a second human has reviewed SQL affecting private health or authorization

Apply production migrations separately from application deployment so failures
are visible:

```bash
supabase link --project-ref kjjndqolgzwseffbalog
supabase migration list
supabase db push --dry-run
supabase db push
supabase migration list
```

Read the project identity and dry-run output before confirming the push. Deploy
the production application, run a minimal non-destructive smoke test, and watch
Supabase, Vercel, and Sentry. Afterwards, immediately restore the safer default
link:

```bash
supabase link --project-ref kjjndqolgzwseffbalog
```

## Safe schema evolution

For changes used by a live application, prefer expand-and-contract:

1. **Expand:** add nullable columns, new tables, indexes, or compatible APIs.
2. **Migrate:** deploy code that writes both shapes if needed; backfill in
   bounded, observable batches.
3. **Switch:** deploy code that reads the new shape and verify it.
4. **Contract:** in a later release, remove old columns, constraints, or code.

Do not combine a column rename/drop and the only compatible application deploy
into one irreversible step. Avoid large data backfills inside a schema
migration; use a reviewed, restartable operation with progress tracking.

## Rollback and incident response

Supabase migrations are forward-only by default. The preferred response to a
bad applied migration is:

1. stop the release and protect data from further writes if necessary
2. capture the error, affected migration, environment, and time
3. do not edit the applied migration or improvise in the dashboard
4. create and test a corrective forward migration locally
5. apply it to staging, verify it, then promote it to production

Use backup restore or point-in-time recovery only for genuine data-loss or
corruption incidents. A restore can discard newer valid writes and requires an
explicit incident decision. Never run `supabase db reset` against a hosted
environment.

For an urgent dashboard change needed to stabilise production, record the exact
SQL and reason, obtain approval, and immediately reconcile it into a new
migration. This is an emergency exception, not a normal workflow.

## Drift and migration conflicts

If a teammate or agent creates a migration with a conflicting timestamp or
changes remote schema outside migrations, stop promotion. Do not rewrite shared
history. Compare migration history, preserve already-applied files, and create
a new migration that reconciles the state.

Schema pulls or diffs may help investigate drift, but generated SQL must be
reviewed line by line before it becomes a migration. Never blindly accept a
generated destructive statement.

## Pull request checklist

Every database PR should answer:

- What data model or policy changes, and why?
- What migration files were added?
- Does `supabase db reset --local` pass from a clean local database?
- Which RLS roles and cross-user cases were tested?
- Is existing application code compatible during rollout?
- Is there a backfill, lock, data-loss, privacy, or health-safety risk?
- How will staging be verified?
- What is the forward-fix or recovery plan?
- Are environment variables documented without values?

## Periodic operations

- Review Supabase team access, MFA, and unused credentials quarterly.
- Rotate exposed or departing-user credentials immediately.
- Review backup/PITR configuration and perform a documented restore exercise
  before the product holds irreplaceable customer data.
- Review slow queries, database size, storage usage, and security advisories.
- Keep Supabase CLI and local PostgreSQL major versions aligned deliberately;
  do not upgrade production infrastructure casually.

## Official references

- [Supabase local development workflow](https://supabase.com/docs/guides/local-development/cli-workflows)
- [Supabase database migrations](https://supabase.com/docs/guides/local-development/database-migrations)
- [Supabase database testing](https://supabase.com/docs/guides/local-development/testing/overview)
- [Supabase database backups](https://supabase.com/docs/guides/platform/backups)
