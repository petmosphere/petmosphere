# Password reset runbook

This runbook documents the Petmosphere password-recovery flow and the hosted
Supabase settings that must be recreated when migrating or creating a project.
It is an operational companion to the
[database development and release runbook](./DATABASE_RUNBOOK.md).

## How the flow works

1. The user submits their email at `/auth/forgot-password`.
2. The server calls Supabase `resetPasswordForEmail` with this callback:
   `https://<canonical-host>/auth/callback?next=/auth/reset-password`.
3. Supabase sends the hosted **Reset Password** email. Its button must use
   `{{ .ConfirmationURL }}`.
4. The callback exchanges the one-time `code` for a session and redirects to
   `/auth/reset-password`.
5. The user submits a new password. The server calls `auth.updateUser` and
   redirects to sign-in.

The request proxy also handles older or misconfigured links that arrive at
`/?code=...` by routing them through the same callback. This is a compatibility
fallback, not a replacement for the hosted Supabase configuration below.

## Configuration after a Supabase migration

Repeat these steps for staging and production. Use the canonical hostname for
that environment; do not use `localhost` in hosted settings.

### 1. Vercel environment variable

In **Vercel → Project → Settings → Environment Variables**, set:

| Variable              | Preview / staging        | Production                                                          |
| --------------------- | ------------------------ | ------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL` | The staging HTTPS origin | `https://petmosphere.com.au` or the approved canonical `www` origin |

Select the correct Vercel environment when editing the value. Redeploy after
changing it. The application uses this value to construct the recovery callback;
if a production deployment receives a localhost value, it falls back to
Vercel's production hostname.

### 2. Supabase URL Configuration

In **Supabase → Authentication → URL Configuration**:

- Set **Site URL** to the same canonical HTTPS origin as `NEXT_PUBLIC_APP_URL`.
- Add the exact recovery callback to **Redirect URLs**:

  ```text
  https://petmosphere.com.au/auth/callback?next=/auth/reset-password
  ```

- Add the normal signup callback for the same origin:

  ```text
  https://petmosphere.com.au/auth/callback
  ```

For staging, replace the hostname with the staging origin. Do not add a broad
wildcard when an exact URL is sufficient.

### 3. Supabase Reset Password email template

In **Supabase → Authentication → Email Templates → Reset Password**:

- Copy the contents of [`supabase/templates/recovery.html`](../../supabase/templates/recovery.html).
- Confirm the subject is `Reset your Petmosphere password`.
- Confirm the action link contains exactly:

  ```html
  href="{{ .ConfirmationURL }}"
  ```

Do not replace this with a hard-coded site URL or a manually assembled token
link. Supabase adds the one-time recovery code and the approved redirect.
Hosted dashboard templates are not deployed by database migrations.

### 4. Supabase email delivery

In **Supabase → Authentication → SMTP Settings**, configure the approved SMTP
sender for the target project. Send a test email from the dashboard and verify
that the reset message arrives with the Petmosphere template.

## Verification checklist

After every project migration or URL/template change:

- Request a new password reset email; do not reuse an old link.
- Confirm the email button opens `/auth/callback`, then
  `/auth/reset-password`.
- Submit a valid new password and confirm the user can sign in with it.
- Confirm an expired or reused link goes to the safe expired-link screen.
- Check that no email link contains `localhost`.
- Check Vercel runtime logs if the callback returns an error.

## Troubleshooting

### The link opens `/?code=...`

The email was generated with the Supabase Site URL fallback or an older
template. Deploy the current app (which includes the compatibility redirect),
then correct the Site URL, recovery Redirect URL, and Reset Password template.
Request a new email after the change.

### The link says it is expired

Recovery codes are one-time and time-limited. Request a new email, use the most
recent link, and verify the callback URL is allowlisted exactly in Supabase.

### The email is not received

Check Supabase Auth logs, SMTP settings, sender authentication, spam folders,
and the target project's **Authentication → Users** entry. A reset request does
not reveal whether an account exists.

## Migration sign-off

Record the following in the migration ticket before switching traffic:

- Target Supabase project reference and environment.
- Site URL and exact recovery Redirect URL verified.
- Reset Password template deployed from the repository.
- SMTP test email received.
- End-to-end reset completed with a test account.
- Vercel `NEXT_PUBLIC_APP_URL` updated and redeployed.
