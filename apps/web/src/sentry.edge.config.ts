import * as Sentry from "@sentry/nextjs";

import { createSentryOptions } from "@/lib/monitoring/sentry-options";

Sentry.init(
  createSentryOptions({
    dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.APP_ENV ?? process.env.NODE_ENV,
  }),
);
