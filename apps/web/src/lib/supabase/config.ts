const CONFIGURATION_MESSAGE =
  "Account services are not configured for this environment. Please try again later.";

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(CONFIGURATION_MESSAGE);
  }

  return { publishableKey, url };
}

export function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function getAppUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  throw new Error(CONFIGURATION_MESSAGE);
}

export function getPublicConfigurationError(error: unknown) {
  return error instanceof Error && error.message === CONFIGURATION_MESSAGE
    ? error.message
    : null;
}
