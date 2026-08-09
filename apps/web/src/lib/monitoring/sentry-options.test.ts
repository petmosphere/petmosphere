import { describe, expect, it } from "vitest";

import { createSentryOptions } from "./sentry-options";

describe("createSentryOptions", () => {
  it("disables reporting when no DSN is configured", () => {
    expect(createSentryOptions({ environment: "development" }).enabled).toBe(
      false,
    );
  });

  it("uses privacy-preserving error-only defaults", () => {
    const options = createSentryOptions({
      dsn: "https://public@example.invalid/1",
      environment: "test",
    });

    expect(options).toMatchObject({
      enabled: true,
      enableLogs: false,
      tracesSampleRate: 0,
      dataCollection: {
        userInfo: false,
        cookies: false,
        httpHeaders: { request: false, response: false },
        httpBodies: [],
        urlQueryParams: false,
        graphQL: { document: false, variables: false },
        genAI: { inputs: false, outputs: false },
        databaseQueryData: false,
        stackFrameVariables: false,
      },
    });
  });
});
