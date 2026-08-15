# Petmosphere — AGENTS.md

## 1. Purpose

This file defines the engineering rules that all humans and AI coding agents
must follow when modifying the Petmosphere repository.

Petmosphere is an Australian pet health and management platform.

The initial product is a mobile-first Progressive Web App (PWA).

Long term, Petmosphere may expand into native iOS/Android applications,
local pet-owner community features, pet-service discovery, marketplaces,
veterinary partnerships, pet-friendly venue discovery, and commerce.

The current architecture must support future evolution without prematurely
building those future products.

---

# 2. Product principles

When making implementation decisions, prioritise in this order:

1. User and animal safety
2. Security and privacy
3. Correctness
4. Maintainability
5. Simple architecture
6. Development velocity
7. UI polish
8. Premature optimisation

Do not sacrifice safety, data isolation, or maintainability merely to ship
a feature faster.

Prefer the simplest architecture that preserves reasonable future options.

Do not build infrastructure for hypothetical future requirements unless
a clear architectural seam is inexpensive to preserve today.

---

# 3. Technology stack

Primary language:

- TypeScript

Repository:

- pnpm workspace
- Turborepo

Web application:

- Next.js App Router
- React
- Tailwind CSS
- shadcn/ui

Backend:

- Next.js Route Handlers
- REST API under `/api/v1`
- Business logic must NOT live in route handlers

Database and infrastructure:

- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- PostgreSQL Row Level Security

Validation:

- Zod

Forms:

- React Hook Form
- Zod

Testing:

- Vitest
- React Testing Library
- Playwright

Production hosting:

- Vercel

Future native app:

- Expo
- React Native
- Expo Router

Do not introduce alternative major frameworks without explicit approval.

---

# 4. Repository architecture

The repository uses the following high-level structure:

apps/
web/

packages/
domain/
api-contracts/
services/
database/
integrations/
config/
test-utils/

supabase/
migrations/
tests/

docs/
architecture/
adr/
product/
security/

Application dependency direction:

apps/web
↓
services
↓
domain
↙ ↘
database integrations

Dependencies must flow inward.

Domain code must not depend on Next.js, React, Supabase clients,
Vercel APIs, Stripe SDKs, or AI-provider SDKs.

---

# 5. Architecture rules

## 5.1 Route handlers

Route handlers are transport adapters.

They may:

- authenticate requests
- parse requests
- call application services
- map known errors to HTTP responses
- return responses

They must NOT contain substantial business logic.

Bad:

route.ts
→ subscription rule
→ AI prompt construction
→ database writes
→ health logic
→ provider calls

Good:

route.ts
→ validate
→ call service
→ return result

---

## 5.2 Domain logic

Business rules belong in domain or service modules.

Examples:

- whether a user can create another pet
- whether an AI session may start
- reminder completion behaviour
- entitlement calculation
- health-log constraints

Business rules must be independently testable.

---

## 5.3 External providers

External providers must be isolated behind adapters/interfaces.

Examples:

AIProvider
EmailProvider
PaymentProvider
StorageProvider
AnalyticsProvider

Never call AI providers, Stripe, Resend, or privileged Supabase APIs directly
from UI components.

Avoid provider-specific concepts leaking into domain models.

---

# 6. API rules

All product APIs must live under:

/api/v1/

Requests and responses must use shared schemas from:

packages/api-contracts

All externally supplied input must be validated.

Do not trust:

- browser validation
- TypeScript types
- URL parameters
- AI output

Validation must occur at runtime.

Breaking API changes require explicit approval and verbose explanation.

---

# 7. Database rules

Before creating, applying, or reviewing a database change, follow:

docs/architecture/DATABASE_RUNBOOK.md

All database schema changes MUST use Supabase migrations.

Never manually change production schema.

Never edit an already-applied shared migration to change its meaning.

Create a new migration instead.

Every user-owned record must have a clear authorization model.

Use database constraints where appropriate.

Examples:

- foreign keys
- uniqueness
- NOT NULL
- CHECK constraints

Do not rely solely on application code for data integrity.

---

# 8. Row Level Security

RLS is mandatory for user-owned data.

Before marking a feature complete, verify:

1. Owner can access their own data.
2. Owner cannot access another user's data.
3. Unauthenticated users cannot access private data.
4. INSERT permissions are correct.
5. UPDATE permissions are correct.
6. DELETE permissions are correct.

Never solve an RLS problem by exposing or using a Supabase secret key or legacy
service-role key in client code.

---

# 9. Privacy

Petmosphere should follow privacy-by-design principles.

Collect only data required for a defined product purpose.

Do not send unnecessary personal information to AI providers.

AI requests should normally exclude:

- owner full name
- email
- phone number
- street address
- payment information
- microchip number

Use the minimum pet context required for the feature.

Private health records must never automatically become community/social data.

Future public community profiles must be a separate permission domain.

---

# 10. AI health guidance

Petmosphere does not provide veterinary diagnosis or treatment.

AI features provide general information and help owners prepare observations
for professional veterinary care.

AI must not be marketed or implemented as a replacement for a veterinarian.

A deterministic emergency screening layer must run independently of the LLM.

The model may increase urgency.

The model must never reduce urgency assigned by deterministic safety rules.

AI output must use structured validated responses before being rendered.

Do not use arbitrary free-form model text to control emergency UI.

Safety rules and prompts should be versioned.

AI failures must fail safely.

The health log, reminders, and non-AI product functionality must continue
working when AI is unavailable.

---

# 11. AI cost control

All AI calls must pass through the Petmosphere server.

Never call an AI provider directly from the browser.

Every request must be:

- authenticated
- authorised
- rate limited
- metered
- logged for cost
- bounded by input size
- bounded by output tokens

AI usage events should record at minimum:

- user
- feature
- model
- input tokens
- output tokens
- estimated cost
- request status
- timestamp

Support:

- per-user limits
- per-session limits
- global daily budget
- global monthly budget
- emergency feature kill switch

Do not implement truly unlimited AI usage.

---

# 12. Feature flags

Risky or incomplete functionality must be feature-flagged.

Examples:

- AI guidance
- payments
- weekly AI reports
- experimental recommendations

A feature flag must allow the feature to be disabled without redeploying
the entire application where practical.

The application should degrade gracefully if a feature is disabled.

---

# 13. Frontend rules

Build mobile-first.

Every user-facing feature must consider:

- loading state
- empty state
- success state
- validation state
- error state
- network/provider failure
- disabled state where applicable

Do not create a new UI primitive if shadcn/ui or an existing project primitive
already solves the requirement.

Feature-specific UI belongs under:

components/features/<feature>

Generic reusable primitives belong under:

components/ui

Avoid giant components.

Extract meaningful feature units rather than arbitrary tiny components.

---

# 14. Accessibility

Interactive controls must be keyboard accessible where applicable.

Use semantic HTML.

Forms must have labels.

Do not communicate state using colour alone.

Maintain appropriate touch targets for mobile use.

Images require suitable alt text where meaningful.

---

# 15. PWA rules

The web application is a mobile-first PWA.

Do not assume a native app exists.

Do not build native-specific abstractions prematurely.

Avoid introducing complex offline synchronisation unless explicitly requested.

PWA failure/offline states must be graceful.

## 15.1 Manifest and install assets

Use the Next.js App Router manifest convention (`app/manifest.ts`) as the
manifest source of truth. Keep it typed and review changes to names, URLs,
display mode, theme colours, icon purposes, and scope.

Generate repetitive raster icon, favicon, and splash-screen variants from one
approved high-resolution source asset. Prefer a documented, reproducible CLI
workflow such as `pwa-asset-generator` over resizing many files manually.
Pin or review the tool version before using it, inspect generated output, and
do not accept generated manifest snippets blindly.

Icons must include the sizes and formats needed by supported browsers. Provide
and visually verify a maskable icon whose important content stays within the
maskable safe zone. Generated assets must be committed only when they are
intentional, optimised, and referenced by the manifest or metadata.

Do not replace the typed Next.js manifest with an automatically rewritten
static manifest merely to accommodate an asset-generation tool.

## 15.2 Service workers and caching

Keep the service worker as small as the required offline behavior permits. A
simple, well-tested offline navigation fallback may use the native Service
Worker and Cache APIs. When requirements expand to multiple runtime routes,
precache manifests, expiration policies, background sync, or coordinated
updates, prefer Workbox recipes and abstractions instead of hand-writing that
complex lifecycle and caching boilerplate.

Every cached route must be explicitly allowlisted and assigned a strategy based
on freshness, privacy, and failure requirements. Do not apply a broad caching
rule to all requests.

Default strategy guidance:

- immutable, content-hashed public assets may use precaching or Cache First
- public, non-sensitive content that tolerates staleness may use Network First
  or Stale While Revalidate with documented expiry behavior
- navigations may use Network First with a static offline fallback
- authenticated APIs and pet, health, profile, account, authentication,
  payment, or entitlement data must be Network Only by default
- mutation requests must never be cached as ordinary responses
- third-party and opaque responses must not be cached without explicit review

Before caching any private response, obtain explicit approval and document the
user benefit, device-sharing risk, cache partitioning, expiration, logout
cleanup, storage limits, invalidation, and deletion behavior. Browser Cache
Storage is not an appropriate general-purpose store for private health data.

Background sync is not enabled by default. Queuing or replaying mutations
requires explicit product and security review, idempotency protection,
authorization revalidation, bounded retention, conflict semantics, and a clear
user-visible pending or failed state. Never assume a failed mutation is safe to
replay.

Cache only successful responses that are safe for the selected strategy. Use
versioned cache names, remove obsolete caches, apply bounded expiration where
appropriate, and test service-worker upgrades with existing controlled tabs.
Avoid update behavior that can mix incompatible application shells and data.

## 15.3 Installation experience

Browser-provided installation remains the baseline. A custom install action is
optional and must be contextual, accessible, dismissible, and shown only after
the user has received enough value to understand the benefit.

Do not repeatedly prompt, block content, or use manipulative installation UX.
Feature-detect installation APIs, hide custom controls when already installed,
and provide platform-appropriate instructions where `beforeinstallprompt` is
not supported, including Safari on iOS. Do not assume one install flow works
across all browsers and platforms.

## 15.4 PWA verification

Use the Chrome DevTools Application panel to inspect the manifest, icon
warnings, service-worker scope and lifecycle, Cache Storage, storage usage, and
offline behavior. Test install, first load, repeat load, offline navigation,
reconnection, service-worker update, cache cleanup, and uninstall/reinstall
behavior on a production build.

Use Lighthouse for performance, accessibility, best-practices, and SEO signals.
Do not treat Lighthouse as the sole PWA compliance test because its dedicated
PWA testing is deprecated. Verify installability and offline behavior directly
in supported desktop and mobile browsers, including Safari/iOS and
Chrome/Android where relevant, and automate stable smoke checks with
Playwright where practical.

External PWA showcases, including Hacker News implementations, may provide
examples but are not architectural standards. Petmosphere's Next.js App Router,
package boundaries, privacy rules, and tested product requirements remain the
source of truth.

---

# 16. Future native compatibility

Future iOS/Android applications will use Expo/React Native.

Share:

- domain models
- API contracts
- validation
- API client logic
- formatting utilities
- business rules

Do NOT force sharing of web UI with native UI.

Web-only packages must not leak into shared domain packages.

---

# 17. Error handling

Do not silently swallow errors.

Expected domain failures should use typed/known errors.

Unexpected errors should be sent to monitoring.

Do not expose stack traces, secret values, SQL details, or provider internals
to users.

User-facing errors should explain what the user can do next.

## 17.1 Error monitoring

Sentry is the default unexpected-error monitoring provider for the Next.js
application. Keep framework-specific Sentry setup inside `apps/web`; do not
introduce Sentry, Next.js, or React dependencies into shared domain packages.

Use Sentry for unexpected exceptions that require investigation. Expected
validation and domain failures should remain typed, handled deliberately, and
must not create noisy monitoring events merely because a user entered invalid
data.

The default Sentry configuration must remain privacy-preserving and
error-focused. Unless a separately approved change documents the need and has
received privacy review, do not enable:

- automatic console-log capture
- performance tracing
- session replay
- user identity collection
- cookies
- request or response headers
- HTTP request or response bodies
- URL query parameters
- GraphQL documents or variables
- AI inputs or outputs
- database query data
- local variables from stack frames

Do not attach health conversations, credentials, payment details, or
unnecessary personal information to Sentry events, breadcrumbs, tags, or
contexts.

Use distinct environment names for development, preview/staging, and
production so events can be filtered reliably.

Sentry environment variables are:

- `NEXT_PUBLIC_SENTRY_DSN` — public browser project identifier
- `SENTRY_DSN` — server project identifier
- `SENTRY_AUTH_TOKEN` — secret build credential for source-map uploads

A Sentry DSN is not a secret, but it must still be configured through local or
deployment environment settings rather than duplicated throughout source code.
`SENTRY_AUTH_TOKEN` is a secret. Never commit it, log it, expose it to browser
code, or prefix it with `NEXT_PUBLIC_`.

Source maps may be uploaded during trusted deployment builds. They should not
be publicly served after upload where the build tooling supports deletion.
Monitoring or source-map upload failure must not expose credentials in build
output.

When verifying monitoring, prefer a temporary synthetic event. Do not leave a
public crash route or test-error button enabled in the shipped application.

---

# 18. Logging

Never log secrets.

Never log:

- passwords
- access tokens
- refresh tokens
- Stripe secrets
- Supabase service keys
- AI API keys

Avoid logging full health conversations unless specifically required
and privacy-reviewed.

Prefer structured logs.

During local development, concise browser and terminal console output is
appropriate for diagnostics, subject to the same privacy and secret-handling
rules as production.

In preview/staging and production:

- use Sentry Issues for unexpected application exceptions
- use Vercel runtime logs for deployment and server diagnostics
- include useful non-sensitive context such as environment, operation, status,
  timestamp, and a correlation identifier where available
- avoid arbitrary debug logs and remove temporary diagnostics before merging
- write messages that help an engineer identify the failing operation without
  reproducing sensitive payloads

Do not use Supabase PostgreSQL as the default store for operational application
logs. Monitoring data has different volume, retention, privacy, and access
requirements from product data.

Purpose-specific audit, security, cost, or usage events may be stored in
Supabase only when the product requires them. Such records need an explicit
schema, authorization and RLS model, retention policy, documented purpose, and
privacy review. They are application records, not a substitute for Sentry or
Vercel logs.

Monitoring access should be limited to team members who need it. Enable
multi-factor authentication and periodically review Sentry access and data
retention settings.

---

# 19. Testing requirements

A feature is not complete because the happy path works.

At minimum verify:

## Functional

- happy path
- invalid input
- empty state
- overflow
- duplicate submission where relevant
- provider failure where relevant

## Authentication

- logged-out access
- logged-in access

## Authorization

- own resource access
- another user's resource access

## Data

- create
- read
- update
- delete where supported
- database constraint behaviour

## UI

- mobile viewport (iPhone, iPad, Macbook sizes)
- loading
- errors
- accessibility basics

## AI features

Additionally verify:

- usage allowance
- rate limiting
- token/input limits
- provider failure
- malformed provider output
- emergency escalation
- AI kill switch
- cost event recording

---

# 20. Definition of Done

A feature is DONE only when:

- implementation is complete
- TypeScript passes
- lint passes
- relevant tests pass
- authorization has been checked
- RLS has been checked where applicable
- mobile behaviour has been checked
- failure states exist
- monitoring is present where relevant
- unexpected failures are observable without collecting unnecessary sensitive
  data
- monitoring configuration changes have been tested and an ingestion check has
  been performed where practical
- analytics are present where relevant
- migration exists where required
- environment variables are documented
- no secret is committed
- feature flag exists where required
- documentation is updated where architectural behaviour changed

Do not mark a feature complete solely because the UI renders.

---

# 21. Package dependencies

Before installing a new package:

1. Check whether the repository already provides the capability.
2. Prefer well-maintained dependencies.
3. Avoid large dependencies for trivial utilities.
4. Do not introduce competing libraries for the same responsibility.
5. Explain non-obvious dependencies in the PR.

Never replace a major framework/library without explicit approval.

---

# 22. Parallel development rules

Multiple developers and coding agents may work simultaneously.

Keep changes narrow.

Do not refactor unrelated files while implementing a feature.

Avoid drive-by formatting changes.

Do not rename or relocate shared modules without coordination.

Prefer small commits with a single purpose.

If another branch introduces a conflicting migration, create a new migration
rather than rewriting shared history.

Never force-push shared branches.

---

# 23. Git workflow

Never develop directly on main.

Branch naming:

feature/<ticket>-<description>
fix/<ticket>-<description>
chore/<ticket>-<description>

Examples:

feature/PET-101-health-log
fix/PET-142-reminder-timezone
chore/PET-180-sentry

All production changes arrive through reviewed pull requests.

Production deployment comes from main.

---

# 24. Pull request expectations

A PR should explain:

- What changed?
- Why?
- How was it verified?
- Database changes?
- New environment variables?
- Security/privacy implications?
- Screenshots for UI changes?
- Known limitations?
- Rollback approach if material?

Avoid mixing unrelated work into one PR.

---

# 25. Agent behaviour

Before modifying code:

1. Read this AGENTS.md.
2. Inspect existing implementation.
3. Identify the relevant module.
4. Search for existing patterns.
5. State the planned files to change.
6. Identify security/privacy implications.

During implementation:

- follow existing conventions
- minimise unrelated changes
- preserve architecture boundaries
- write tests with the implementation
- do not suppress TypeScript errors without justification
- treat repository-scoped agent and skill files as maintained repository
  content: inspect them before use and keep them within formatting and validation
  checks unless a documented tool requirement makes that impossible

After implementation:

1. Run formatting.
2. Run lint.
3. Run type checking.
4. Run relevant unit tests.
5. Run relevant integration/E2E tests.
6. Review the diff.
7. Check for secrets.
8. Report what was changed and how it was verified.

---

# 26. Do not do these things

An agent must NOT:

- bypass RLS to make a feature work
- expose service-role credentials
- commit secrets
- place business logic inside React components
- call AI providers directly from the browser
- change production schema manually
- invent medical guidance rules
- silently add dependencies
- remove tests merely because they fail
- use `any` to avoid understanding a type problem
- suppress lint/type errors without explanation
- rewrite unrelated code while implementing a feature
- claim a test passed without running it
- claim a feature is production-ready without checking failure paths

---

# 27. Health/safety change rule

Any change affecting:

- emergency classification
- medical wording
- veterinary recommendation logic
- AI health system prompts
- weight health interpretation
- medication guidance
- toxic substances
- symptom urgency rules

must be explicitly identified as a HEALTH-SAFETY CHANGE.

Do not invent or materially modify clinical rules without approved
source material or appropriate veterinary review.

---

# 28. Architectural decisions

Significant architecture changes should create an ADR under:

docs/adr/

Examples:

- changing authentication provider
- introducing a queue
- changing AI provider architecture
- introducing a dedicated backend application
- changing database platform
- introducing native shared UI
- changing payment provider

Do not introduce major architecture changes silently.

---

# 29. SEO and discoverability

SEO requirements apply to public, indexable pages.

Private application pages, authenticated routes, health records, and private
user-generated content must not be indexed.

Public pages should consider:

- descriptive and unique page titles and metadata
- canonical URLs
- Open Graph and social preview metadata
- sitemap and robots configuration
- semantic heading structure
- crawlable navigation
- accurate structured data where appropriate
- mobile performance and Core Web Vitals
- accessible content and meaningful image alt text

Do not expose private or sensitive information in:

- URLs
- page metadata
- structured data
- social previews
- sitemaps
- analytics events

Do not create misleading veterinary or medical claims for search traffic.

Do not use fabricated reviews, ratings, authorship, or structured data.

Authenticated product screens should normally use `noindex` and must not be
included in public sitemaps.

Use Next.js metadata APIs and shared metadata helpers where appropriate.

Public content intended for indexing should render meaningful HTML without
requiring client-side JavaScript.

Material changes to public URLs require redirects and a review of canonical
URLs, sitemap entries, and existing external links.
