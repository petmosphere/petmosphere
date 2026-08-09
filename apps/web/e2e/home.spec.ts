import { expect, test } from "@playwright/test";

test("shows the Petmosphere homepage", async ({ page, request }) => {
  await page.goto("/");

  await expect(page.getByText("Petmosphere", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Your pet's health, organised." }),
  ).toBeVisible();

  const manifestResponse = await request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBe(true);
  expect(await manifestResponse.json()).toMatchObject({
    display: "standalone",
    name: "Petmosphere",
  });
});
