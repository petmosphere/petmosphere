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

test("opens the email account journey", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Create account" }).click();

  await expect(
    page.getByRole("heading", { name: "A healthier routine starts here" }),
  ).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Confirm password")).toBeVisible();
});

test("creates an account against local Supabase", async ({ page }) => {
  test.skip(
    process.env.E2E_LOCAL_AUTH !== "true",
    "Local Supabase integration is opt-in.",
  );

  const email = `playwright-${crypto.randomUUID()}@example.test`;
  await page.goto("/auth/sign-up");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("test-only-password");
  await page.getByLabel("Confirm password").fill("test-only-password");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/auth\/verify-email$/);
  await expect(
    page.getByRole("heading", { name: "Check your email" }),
  ).toBeVisible();
});
