# Observability and error reporting

Petmosphere uses Sentry for unexpected application errors and Vercel runtime logs for deployment and server diagnostics. Local development continues to use terminal and browser console output. Sentry is optional locally and is disabled when no DSN is configured.

## Privacy defaults

The initial Sentry integration is error-only. Performance tracing, session replay, and automatic console-log capture are disabled. The SDK is explicitly configured not to collect user identity, cookies, request or response headers, HTTP bodies, URL query parameters, GraphQL documents or variables, AI inputs or outputs, database query data, or local variables from stack frames.

These controls reduce collection; they do not replace careful error handling. Code must never attach credentials, access tokens, health conversations, payment details, or unnecessary personal information to an exception. Any future expansion of monitoring data requires a privacy and security review.

## Environments and access

Use distinct `APP_ENV` and `NEXT_PUBLIC_APP_ENV` values for development, preview/staging, and production so events can be filtered reliably. Restrict Sentry organisation access to team members who need it, enable multi-factor authentication, and periodically review project retention and access settings.

The browser and server DSNs identify the Sentry project and are not credentials. `SENTRY_AUTH_TOKEN` is a secret build credential used to upload source maps. It must be stored in local ignored environment files or Vercel's encrypted environment settings and never exposed through a `NEXT_PUBLIC_` variable.

## Investigation workflow

1. Find the exception and environment in Sentry Issues.
2. Correlate its timestamp and release with the relevant Vercel deployment and runtime logs.
3. Reproduce locally without copying production personal data.
4. Fix the underlying failure and add a regression test where practical.
5. Resolve the issue after the fix has been verified in the affected environment.

Do not persist application logs in Supabase by default. Operational telemetry has different access, retention, volume, and privacy needs from product data. Store only purpose-specific audit or usage records in PostgreSQL when a future feature explicitly requires them and has a documented schema and retention policy.
