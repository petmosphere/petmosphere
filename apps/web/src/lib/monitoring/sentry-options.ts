const privateDataCollectionDefaults = {
  userInfo: false,
  cookies: false,
  httpHeaders: {
    request: false,
    response: false,
  },
  httpBodies: [],
  urlQueryParams: false,
  graphQL: {
    document: false,
    variables: false,
  },
  genAI: {
    inputs: false,
    outputs: false,
  },
  databaseQueryData: false,
  stackFrameVariables: false,
};

type SentryOptionsInput = {
  dsn?: string | undefined;
  environment?: string | undefined;
};

export function createSentryOptions({ dsn, environment }: SentryOptionsInput) {
  return {
    ...(dsn ? { dsn } : {}),
    enabled: Boolean(dsn),
    ...(environment ? { environment } : {}),
    attachStacktrace: true,
    debug: false,
    enableLogs: false,
    tracesSampleRate: 0,
    dataCollection: privateDataCollectionDefaults,
  };
}
