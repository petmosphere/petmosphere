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
    page.getByRole("heading", { name: "Create your account" }),
  ).toBeVisible();
  await expect(page.getByLabel("Name")).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Confirm password" }),
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: /agree to the Terms of Service/i }),
  ).not.toBeChecked();
  await expect(
    page.getByRole("button", { name: "Create account" }),
  ).toBeDisabled();
});

test("creates an account against local Supabase", async ({ page }) => {
  test.skip(
    process.env.E2E_LOCAL_AUTH !== "true",
    "Local Supabase integration is opt-in.",
  );

  const email = `playwright-${crypto.randomUUID()}@example.test`;
  await page.goto("/auth/sign-up");
  await page.getByLabel("Name").fill("Playwright Owner");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("test-only-password");
  await page
    .getByRole("textbox", { name: "Confirm password" })
    .fill("test-only-password");
  await page
    .getByRole("checkbox", { name: /agree to the Terms of Service/i })
    .check();
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/auth\/verify-email$/);
  await expect(
    page.getByRole("heading", { name: "Check your email" }),
  ).toBeVisible();
});
