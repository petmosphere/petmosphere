import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FaqContent } from "./faq-content";

describe("FaqContent", () => {
  it("renders practical help, safety guidance and support contact details", () => {
    render(<FaqContent />);

    expect(screen.getByText("How do I add my first pet?")).toBeVisible();
    expect(
      screen.getByText("Does Petmosphere provide veterinary advice?"),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "info.petmosphere@gmail.com" }),
    ).toHaveAttribute("href", "mailto:info.petmosphere@gmail.com");
  });

  it("starts with the first answer expanded", () => {
    const { container } = render(<FaqContent />);

    expect(container.querySelector("details")).toHaveAttribute("open");
  });
});
