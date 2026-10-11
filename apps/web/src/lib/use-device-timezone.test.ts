import { afterEach, describe, expect, it, vi } from "vitest";

import { getDeviceTimezone } from "./use-device-timezone";

afterEach(() => vi.restoreAllMocks());

describe("getDeviceTimezone", () => {
  it("returns an empty value when the device time zone cannot be detected", () => {
    vi.spyOn(Intl, "DateTimeFormat").mockImplementation(() => {
      throw new Error("unavailable");
    });

    expect(getDeviceTimezone()).toBe("");
  });
});
