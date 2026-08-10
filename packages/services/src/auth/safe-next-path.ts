const DEFAULT_AUTH_DESTINATION = "/onboarding";

export function getSafeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_AUTH_DESTINATION;
  }

  try {
    const url = new URL(value, "https://petmosphere.invalid");

    if (url.origin !== "https://petmosphere.invalid") {
      return DEFAULT_AUTH_DESTINATION;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_AUTH_DESTINATION;
  }
}
