import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TimezonePreference } from "./timezone-preference";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn() }),
}));

afterEach(() => vi.unstubAllGlobals());

describe("TimezonePreference", () => {
  it("saves a worldwide choice without changing existing schedules", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetch);
    render(<TimezonePreference initialTimezone={null} />);

    fireEvent.click(
      screen.getByRole("button", { name: /Change|Choose a time zone/i }),
    );
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "London" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Europe/London" }));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/v1/profile/timezone",
        expect.objectContaining({
          body: JSON.stringify({ timezone: "Europe/London" }),
          method: "PATCH",
        }),
      ),
    );
    expect(
      screen.getByText(/Existing reminders keep their saved time/),
    ).toBeVisible();
  });
});
