import { expect, test } from "@playwright/test";

test("shows the Petmosphere homepage", async ({ page, request }) => {
  await page.goto("/");

  await expect(page.getByText("Petmosphere", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Track your pet’s wellness in 10 seconds a day",
    }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();

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
    .fill("different-password");

  await expect(page.getByText("Passwords do not match.")).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Confirm password" }),
  ).toHaveAttribute("aria-invalid", "true");
  await expect(
    page.getByRole("button", { name: "Create account" }),
  ).toBeDisabled();

  await page
    .getByRole("textbox", { name: "Confirm password" })
    .fill("valid-password");
  await expect(page.getByText("Passwords do not match.")).toBeHidden();

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
      domain: "localhost",
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

test("guides users through password recovery states", async ({ page }) => {
  await page.goto("/auth/sign-in");
  await page.getByRole("link", { name: "Forgot password?" }).click();

  await expect(
    page.getByRole("heading", { name: "Reset password" }),
  ).toBeVisible();
  const email = page.getByLabel("Email address");
  const sendReset = page.getByRole("button", { name: "Send Reset Link" });
  await expect(sendReset).toBeDisabled();

  await email.fill("not-an-email");
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(sendReset).toBeDisabled();

  await email.fill("owner@example.com");
  await expect(sendReset).toBeEnabled();

  await page.goto("/auth/reset-password");
  const password = page.getByRole("textbox", {
    name: "New password",
    exact: true,
  });
  const confirmation = page.getByRole("textbox", {
    name: "Confirm new password",
  });
  const updatePassword = page.getByRole("button", {
    name: "Update password",
  });
  await password.fill("new-secure-password");
  await confirmation.fill("different-password");
  await expect(page.getByText("Passwords do not match.")).toBeVisible();
  await expect(confirmation).toHaveAttribute("aria-invalid", "true");
  await expect(updatePassword).toBeDisabled();

  await confirmation.fill("new-secure-password");
  await expect(page.getByText("Passwords do not match.")).toBeHidden();
  await expect(updatePassword).toBeEnabled();

  await page.goto("/auth/sign-in?notice=password-updated");
  await expect(
    page.getByText("Password updated. Sign in with your new password."),
  ).toBeVisible();
});

test("completes account and password recovery against local Supabase", async ({
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

  await page.getByRole("link", { name: "Get started" }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/auth\/sign-in$/);

  await page.getByLabel("Email address").fill(email);
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill("test-only-password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/onboarding$/);

  await page.getByRole("button", { name: "Sign out" }).click();
  await page.goto("/auth/forgot-password");
  const recoveryEmail = page.getByLabel("Email address");
  await recoveryEmail.fill(email);
  await expect(
    page.getByRole("button", { name: "Send Reset Link" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Send Reset Link" }).click();
  await expect(
    page.getByText(
      "If an account exists, a password reset link is on its way.",
    ),
  ).toBeVisible();

  async function getPasswordResetLink() {
    const response = await request.get(
      "http://127.0.0.1:54324/api/v1/messages",
    );
    if (!response.ok()) return "";

    const mailbox = (await response.json()) as {
      messages: Array<{
        ID: string;
        Subject: string;
        To: Array<{ Address: string }>;
      }>;
    };
    const message = mailbox.messages.find(
      (candidate) =>
        candidate.Subject.toLowerCase().includes("reset") &&
        candidate.To.some((recipient) => recipient.Address === email),
    );
    if (!message) return "";

    const detailResponse = await request.get(
      `http://127.0.0.1:54324/api/v1/message/${message.ID}`,
    );
    if (!detailResponse.ok()) return "";

    const detail = (await detailResponse.json()) as {
      HTML: string;
      Text: string;
    };
    return (
      `${detail.HTML}\n${detail.Text}`
        .match(/https?:\/\/[^\s"'<>]+/)?.[0]
        ?.replaceAll("&amp;", "&") ?? ""
    );
  }

  await expect.poll(getPasswordResetLink).toMatch(/\/auth\/v1\/verify/);
  const recoveryResponse = await request.get(await getPasswordResetLink(), {
    maxRedirects: 0,
  });
  expect([302, 303]).toContain(recoveryResponse.status());
  const redirectLocation = recoveryResponse.headers().location;
  expect(redirectLocation).toBeTruthy();

  const callbackUrl = new URL(redirectLocation!);
  callbackUrl.port = "3100";
  await page.goto(callbackUrl.toString());
  await expect(page).toHaveURL(/\/auth\/reset-password$/);

  await page
    .getByRole("textbox", { name: "New password", exact: true })
    .fill("new-test-only-password");
  await page
    .getByRole("textbox", { name: "Confirm new password" })
    .fill("new-test-only-password");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page).toHaveURL(/\/auth\/sign-in\?notice=password-updated$/);
  await expect(
    page.getByText("Password updated. Sign in with your new password."),
  ).toBeVisible();

  await page.getByLabel("Email address").fill(email);
  await page
    .getByRole("textbox", { name: "Password", exact: true })
    .fill("new-test-only-password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
});
