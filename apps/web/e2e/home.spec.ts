import { expect, test } from "@playwright/test";

test("shows the Petmosphere homepage", async ({ page, request }) => {
  await page.goto("/");

  await expect(page.getByText("Petmosphere", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Track your pet’s wellness in 10 seconds a day",
    }),
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
  await page.getByRole("button", { name: "Next" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Never miss a vaccination or vet visit",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(
    page.getByRole("heading", { name: "Made for Aussie pets" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Get Started" }).click();

  await expect(
    page.getByRole("heading", { name: "Create your account" }),
  ).toBeVisible();
  await expect(page.getByLabel("Name")).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Password", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Confirm password" }),
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: /agree to the Terms of Service/i }),
  ).not.toBeChecked();
  await expect(
    page.getByRole("button", { name: "Create account" }),
  ).toBeDisabled();

  await page.getByLabel("Name").fill("Pet Owner");
  await page.getByLabel("Email address").fill("owner@example.com");
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill("valid-password");
  await page
    .getByRole("textbox", { name: "Confirm password" })
    .fill("valid-password");

  await expect(
    page.getByRole("button", { name: "Create account" }),
  ).toBeDisabled();

  await page
    .getByRole("checkbox", { name: /agree to the Terms of Service/i })
    .check();
  await expect(
    page.getByRole("button", { name: "Create account" }),
  ).toBeEnabled();
});

test("accepts a six-digit email verification code", async ({
  context,
  page,
}) => {
  await context.addCookies([
    {
      domain: "127.0.0.1",
      httpOnly: true,
      name: "petmosphere_pending_sign_up_email",
      path: "/auth",
      sameSite: "Lax",
      secure: false,
      value: "owner@example.com",
    },
  ]);
  await page.goto("/auth/verify-email");

  await expect(
    page.getByRole("heading", { name: "Check your email" }),
  ).toBeVisible();
  await expect(page.getByText(/ow•••@example\.com/)).toBeVisible();

  const code = page.getByLabel("Verification code");
  const verifyButton = page.getByRole("button", { name: "Verify email" });
  await expect(verifyButton).toBeDisabled();
  await code.fill("12a3456");
  await expect(code).toHaveValue("123456");
  await expect(verifyButton).toBeEnabled();
});

test("creates and verifies an account against local Supabase", async ({
  page,
  request,
}) => {
  test.skip(
    process.env.E2E_LOCAL_AUTH !== "true",
    "Local Supabase integration is opt-in.",
  );

  const email = `playwright-${crypto.randomUUID()}@example.com`;
  await page.goto("/auth/sign-up");
  await page.getByLabel("Name").fill("Playwright Owner");
  await page.getByLabel("Email address").fill(email);
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill("test-only-password");
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
  await expect(page.getByLabel("Verification code")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Resend code/ }),
  ).toBeDisabled();

  async function getVerificationCode() {
    const response = await request.get(
      "http://127.0.0.1:54324/api/v1/messages",
    );
    if (!response.ok()) return "";

    const mailbox = (await response.json()) as {
      messages: Array<{
        Snippet: string;
        To: Array<{ Address: string }>;
      }>;
    };
    const message = mailbox.messages.find((candidate) =>
      candidate.To.some((recipient) => recipient.Address === email),
    );
    return message?.Snippet.match(/\b\d{6}\b/)?.[0] ?? "";
  }

  await expect.poll(getVerificationCode).toMatch(/^\d{6}$/);
  await page.getByLabel("Verification code").fill("000000");
  await page.getByRole("button", { name: "Verify email" }).click();
  await expect(
    page.getByText(
      "That code is incorrect or has expired. Check it and try again.",
    ),
  ).toBeVisible();

  await page.getByLabel("Verification code").fill(await getVerificationCode());
  await page.getByRole("button", { name: "Verify email" }).click();

  await expect(page).toHaveURL(/\/auth\/welcome$/);
  await expect(
    page.getByRole("heading", { name: "Welcome to Petmosphere!" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Get started" })).toBeVisible();
});
