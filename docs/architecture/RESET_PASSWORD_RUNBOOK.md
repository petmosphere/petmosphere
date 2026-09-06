# Password reset runbook

## Recovery flow

1. Submit email at `/auth/forgot-password` to request a recovery code.
2. `/auth/verify-recovery` displays a masked email and six-digit input.
3. Read the email in Gmail, then return to the original PWA/browser to enter the
   code. Gmail does not need access to the PWA's cookies.
4. The server calls Supabase `verifyOtp` with `type: "recovery"`. Only successful
   verification creates the session used by `/auth/reset-password`.
5. Submit the new password; the app returns to sign-in.

Pending recovery email is stored in an HttpOnly cookie separately from signup.
It is not authentication proof. Supabase enforces OTP expiry and single use.
Resend has a 60-second cooldown and Supabase provider rate limits. Use the latest
code. Request responses do not reveal whether an account exists.

## Manual setup after migration

Repeat for **staging and production separately**. Database migrations do not
deploy hosted Auth templates or settings.

1. **Supabase → Authentication → Email Templates → Reset Password**: copy
   [`recovery.html`](../../supabase/templates/recovery.html). Subject:
   `Reset your Petmosphere password`. Display `{{ .Token }}`, not a
   `{{ .ConfirmationURL }}` link.
2. **Authentication → Sign In / Providers → Email**: set Email OTP Length to
   **6**, Email OTP Expiration to **600 seconds**. This also affects signup.
   Update **Email Templates → Confirm signup** from
   [`confirmation.html`](../../supabase/templates/confirmation.html), which now
   says 10 minutes. Local equivalents are `otp_length = 6`, `otp_expiry = 600`
   under `[auth.email]` in `supabase/config.toml`; restart local Supabase.
3. **Authentication → SMTP Settings**: configure the target project's approved
   sender and SMTP credentials, then verify delivery.
4. **Authentication → URL Configuration**: use the canonical environment origin
   as Site URL. Keep `/auth/callback` and
   `/auth/callback?next=/auth/reset-password` allowlisted for signup and legacy
   recovery. The new OTP flow does not depend on callback exchange.

| Platform/config                               | Variable/settings                                                  | Environment                                                 |
| --------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------- |
| Vercel                                        | `NEXT_PUBLIC_APP_URL`                                              | Production canonical HTTPS origin; Preview staging origin   |
| Vercel                                        | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Matching target Supabase project for Production and Preview |
| Supabase dashboard                            | Email templates, OTP length/expiry, SMTP, Site URL, Redirect URLs  | Each project separately                                     |
| Local `apps/web/.env.local`                   | Public app and Supabase variables above                            | Local development                                           |
| `supabase/config.toml`, `supabase/templates/` | Auth settings and email bodies                                     | Local; copy settings manually to hosted projects            |

Redeploy after Vercel environment changes. No new variables or database migration
are needed. See the [database runbook](./DATABASE_RUNBOOK.md) for the full
project migration inventory.

## Migration verification checklist

- Record target project/environment and confirm all dashboard steps above.
- Request a fresh code in the installed PWA; read Gmail; return to the PWA,
  enter the code, change password, and sign in with the new password.
- Test incorrect, expired and reused codes; resend after 60 seconds; repeated
  resend; provider failures; and changing the email address.
- Test signup too: OTP expiry is shared. Verify mobile layout, paste and keyboard.
- Never log codes, passwords, email bodies or session cookies.

## Troubleshooting

- **Email contains a link:** update the target project's Reset Password template
  and request a fresh email.
- **Invalid/expired code:** use the latest message for the exact address,
  including its `+alias`. Verify project, six-digit length and 600-second expiry.
- **Missing pending email:** request another code in the PWA/browser where you
  will enter it. Gmail can remain in a separate browser context.
- **No email:** inspect SMTP, spam and Supabase Auth rate limits/logs without
  exposing provider details or account existence to the requester.
- **Old link fails:** PKCE links need the original verifier cookie. Use the new
  recovery code flow instead.
