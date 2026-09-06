import { describe, expect, it } from "vitest";

import { formatBirthDateInput } from "./birth-date-input";

describe("formatBirthDateInput", () => {
  it("formats digits for a numeric mobile keyboard", () => {
    expect(formatBirthDateInput("1")).toBe("1");
    expect(formatBirthDateInput("1205")).toBe("12/05");
    expect(formatBirthDateInput("12052020")).toBe("12/05/2020");
    expect(formatBirthDateInput("12/05/2020")).toBe("12/05/2020");
  });
});
