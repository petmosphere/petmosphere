import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TimezonePicker } from "./timezone-picker";

describe("TimezonePicker", () => {
  it("finds and selects a worldwide IANA time zone", () => {
    const onChange = vi.fn();
    render(<TimezonePicker onChange={onChange} value="Australia/Melbourne" />);

    fireEvent.click(
      screen.getByRole("button", { name: /Australia\/Melbourne/i }),
    );
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Europe/London" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Europe/London" }));

    expect(onChange).toHaveBeenCalledWith("Europe/London");
  });
});
