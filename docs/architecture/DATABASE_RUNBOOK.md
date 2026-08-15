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
- Never place database passwords, service-role/secret keys, access tokens, or
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
  this table stores time and timezone only and does not itself deliver a
  notification
- **Table Editor → health_log_analytics_events** for privacy-minimised,
  write-only Journey A event counts; it intentionally stores no user, pet,
  note, filename, media or request identifiers
- **Storage → pet-photos** for private pet profile images
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
select * from public.health_log_analytics_events order by created_at desc;
```

Studio uses administrative access and can see through RLS. Seeing a row in
Studio proves that it exists; it does not prove that browser users are properly
isolated. Use `supabase test db` to verify owner, other-user, and anonymous RLS
behaviour.

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
supabase link --project-ref cgrfodgltaliszixosiq
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
supabase link --project-ref voznszbrzjewutugewkt
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
