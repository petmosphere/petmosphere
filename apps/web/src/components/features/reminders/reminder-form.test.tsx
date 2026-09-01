import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReminderForm } from "./reminder-form";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock("@/lib/health-logs/push-notifications", () => ({
  enablePushNotifications: () => Promise.resolve({ ok: true }),
}));

const pet = {
  approximateAge: null,
  birthDate: null,
  breed: null,
  createdAt: "2026-08-22T00:00:00.000Z",
  desexedStatus: null,
  id: "73000000-0000-4000-8000-000000000003",
  name: "Max",
  ownerId: "71000000-0000-4000-8000-000000000001",
  photoPath: null,
  sex: null,
  species: "dog" as const,
  updatedAt: "2026-08-22T00:00:00.000Z",
  weightKg: null,
};

// Date "2026-08-22" is "today" in all three tests.
// The DatePicker trigger aria-label pattern is:
//   "Date: <display>. Tap to change."  (placeholder while empty)
// After selecting Aug 22 (today): "Date: Today, 22 Aug. Tap to change."

describe("ReminderForm", () => {
  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();
    vi.unstubAllGlobals();
  });

  it("keeps save disabled until required fields are valid", () => {
    render(
      <ReminderForm pets={[{ pet, photoUrl: null }]} today="2026-08-22" />,
    );
    const save = screen.getByRole("button", { name: "Save" });
    expect(save).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Title/), {
      target: { value: "Flea treatment" },
    });

    // Select date via DatePicker: open sheet → click day → confirm
    fireEvent.click(
      screen.getByRole("button", {
        name: /Date: Select date\. Tap to change\./,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: /22 August 2026/ }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    // Set time via the native hidden input (NativePickerField)
    fireEvent.change(screen.getByTestId("reminder-time-input"), {
      target: { value: "19:00" },
    });

    expect(save).toBeEnabled();
    expect(
      screen.getByRole("button", {
        name: /Date: 22 Aug 2026\. Tap to change\./,
      }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Time: 7:00 pm" })).toBeVisible();
  });

  it("selects a date from the picker sheet", () => {
    render(
      <ReminderForm pets={[{ pet, photoUrl: null }]} today="2026-08-22" />,
    );

    // Open the DatePicker sheet
    fireEvent.click(
      screen.getByRole("button", {
        name: /Date: Select date\. Tap to change\./,
      }),
    );
    // Click day cell and confirm
    fireEvent.click(screen.getByRole("button", { name: /22 August 2026/ }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    // Trigger now shows the selected date
    expect(
      screen.getByRole("button", {
        name: /Date: 22 Aug 2026\. Tap to change\./,
      }),
    ).toBeVisible();
  });

  it("returns to the reminder home after saving", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({ json: vi.fn().mockResolvedValue({}), ok: true }),
    );
    render(
      <ReminderForm pets={[{ pet, photoUrl: null }]} today="2026-08-22" />,
    );
    fireEvent.change(screen.getByLabelText(/Title/), {
      target: { value: "Flea treatment" },
    });

    // Select date via DatePicker
    fireEvent.click(
      screen.getByRole("button", {
        name: /Date: Select date\. Tap to change\./,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: /22 August 2026/ }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));

    fireEvent.change(screen.getByTestId("reminder-time-input"), {
      target: { value: "19:00" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/reminders"));
    expect(refresh).toHaveBeenCalledOnce();
  });
});
