import * as Sentry from "@sentry/nextjs";

import { createSentryOptions } from "@/lib/monitoring/sentry-options";

Sentry.init(
  createSentryOptions({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV,
  }),
);

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
