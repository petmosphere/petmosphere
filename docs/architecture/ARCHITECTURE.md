# Petmosphere architecture

## Current approach

Petmosphere begins as a modular monolith in a pnpm/Turborepo workspace. Next.js is the current delivery layer: it renders the web UI and will later host versioned REST transport adapters under `/api/v1`.

Business rules and use cases belong outside framework-specific code. The intended dependency flow is:

```text
apps/web -> packages/services -> packages/domain
                         |-> packages/database
                         `-> packages/integrations
```

`packages/domain` must remain independent of Next.js, React, Supabase clients, deployment platforms, and provider SDKs. Database and integration packages are future adapters; application services will coordinate them through explicit ports. Route handlers will authenticate, validate, call a service, and map its result rather than contain business logic.

## Platform direction

The web app is a mobile-first PWA. A future Expo/React Native application may consume shared domain models, validation, API contracts, API client logic, and business rules. Web and native UI will remain separate.

Supabase is the initial database, authentication, and storage platform. Schema changes will use migrations, and user-owned data will require Row Level Security. No application schema exists in this bootstrap.

External providers will be isolated behind adapter interfaces so provider-specific SDKs and concepts do not leak into the domain.
