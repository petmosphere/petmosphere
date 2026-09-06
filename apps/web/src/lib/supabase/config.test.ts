import { afterEach, describe, expect, it, vi } from "vitest";

import { getAppUrl } from "./config";

afterEach(() => vi.unstubAllEnvs());

describe("getAppUrl", () => {
  it("never uses a localhost reset URL in a Vercel production deployment", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "www.petmosphere.com.au");

    expect(getAppUrl()).toBe("https://www.petmosphere.com.au");
  });
});
