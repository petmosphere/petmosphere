import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { proxy } from "./proxy";

describe("proxy", () => {
  it("routes root recovery links through the auth callback", async () => {
    const response = await proxy(
      new NextRequest("https://petmosphere.com.au/?code=recovery-code"),
    );

    expect(response.headers.get("location")).toBe(
      "https://petmosphere.com.au/auth/callback?code=recovery-code&next=%2Fauth%2Freset-password",
    );
  });
});
