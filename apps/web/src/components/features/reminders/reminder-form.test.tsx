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
    fireEvent.change(screen.getByTestId("reminder-date-input"), {
      target: { value: "2026-08-22" },
    });
    fireEvent.change(screen.getByTestId("reminder-time-input"), {
      target: { value: "19:00" },
    });
    expect(save).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Date: 22 Aug 2026" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Time: 7:00 pm" })).toBeVisible();
  });

  it("opens the native date picker from the styled trigger", () => {
    render(
      <ReminderForm pets={[{ pet, photoUrl: null }]} today="2026-08-22" />,
    );
    const input = screen.getByTestId("reminder-date-input") as HTMLInputElement;
    const showPicker = vi.fn();
    input.showPicker = showPicker;

    fireEvent.click(screen.getByRole("button", { name: "Date: Select date" }));

    expect(showPicker).toHaveBeenCalledOnce();
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
    fireEvent.change(screen.getByTestId("reminder-date-input"), {
      target: { value: "2026-08-22" },
    });
    fireEvent.change(screen.getByTestId("reminder-time-input"), {
      target: { value: "19:00" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/reminders"));
    expect(refresh).toHaveBeenCalledOnce();
  });
});
