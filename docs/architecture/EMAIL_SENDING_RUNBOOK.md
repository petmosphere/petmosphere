# Email sending runbook — `no-reply@petmosphere.com.au`

This runbook is the source of truth for how Petmosphere sends auth emails
(verification codes, password recovery) and how to change or troubleshoot that
setup. It covers three services: **Brevo** (SMTP provider), **Vercel** (DNS),
and **Supabase** (auth email dispatch).

## Why not the defaults

- **Supabase built-in SMTP** sends from a shared Supabase sender. It is
  rate-limited, intended for testing only, and routinely lands in spam.
- **Gmail SMTP** (`smtp.gmail.com` with an app password) is for personal mail.
  It cannot pass DMARC alignment for a domain you do not control, so Gmail and
  Outlook treat the mail as spoofed → spam. Gmail also suspends automated
  sending from personal accounts.
- The fix is a transactional SMTP provider plus a **domain you own,
  authenticated with SPF + DKIM + DMARC**. Petmosphere uses Brevo's free tier
  (300 emails/day, no credit card).

## Architecture

```
Supabase Auth (verification / recovery emails)
  → SMTP: smtp-relay.brevo.com:587  (Brevo credentials)
    → From: Petmosphere <no-reply@petmosphere.com.au>
      → Signed with DKIM for petmosphere.com.au (DNS on Vercel)
        → Recipient inbox (Gmail / Outlook / Yahoo)
```

- **Brevo** — sends the mail; holds the SPF/DKIM/DMARC configuration.
- **Vercel** — authoritative DNS for `petmosphere.com.au` (the domain's
  nameservers point to Vercel; GoDaddy is registrar only). All DNS records
  live in the Vercel dashboard.
- **Supabase** — triggers the emails (signup confirmation, password recovery)
  and holds the SMTP credentials.

## Current setup (as of 2026-10)

### DNS records (Vercel → Domains → petmosphere.com.au → DNS Records)

| Name                | Type  | Value                                                   | Purpose           |
| ------------------- | ----- | ------------------------------------------------------- | ----------------- |
| `brevo-code` (root) | TXT   | `brevo-code:<account-specific>`                         | Brevo ownership   |
| `brevo1._domainkey` | CNAME | `b1.<domain>.dkim.brevo.com.`                           | DKIM signing key  |
| `brevo2._domainkey` | CNAME | `b2.<domain>.dkim.brevo.com.`                           | DKIM signing key  |
| `mail`              | CNAME | `mail-<domain>.brand.brevosend.com.`                    | Branding/tracking |
| `img.mail`          | CNAME | `mail-<domain>.img.brand.brevosend.com.`                | Branded images    |
| `r.mail`            | CNAME | `mail-<domain>.r.brand.brevosend.com.`                  | Click tracking    |
| `_dmarc`            | TXT   | `v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com`      | DMARC policy      |
| root (`@`)          | TXT   | SPF including `include:spf.brevo.org` (verify in Brevo) | SPF               |

Exact values are account-specific — always copy the current values from
Brevo → **Senders, Domains & Dedicated IPs → Domains → petmosphere.com.au →
View configuration** rather than from this table.

Note: `p=none` is monitor-only DMARC. Once deliverability is stable (2+ weeks
of clean sends), consider tightening to `p=quarantine`.

### Brevo

- Account: Petmosphere's Brevo login. Free plan (300 emails/day).
- **Domains**: `petmosphere.com.au` — status **Authenticated**, **Branded**.
- **Senders**: `Petmosphere <no-reply@petmosphere.com.au>` — **Verified**.
  Replies forward to the configured gmail inbox.
  - Do **not** use freemail senders (e.g. `@gmail.com`). Brevo flags them
    ("Freemail domain is not recommended") and mailbox providers junk them.
- **SMTP credentials**: Profile → SMTP & API → SMTP details. Host
  `smtp-relay.brevo.com`, port 587, login `…@smtp-brevo.com`, and a generated
  SMTP key (secret — stored only in Supabase SMTP settings).

### Supabase (production project)

Authentication → SMTP Settings → custom SMTP enabled:

| Field             | Value                                 |
| ----------------- | ------------------------------------- |
| Sender email      | `no-reply@petmosphere.com.au`         |
| Sender name       | `Petmosphere`                         |
| Host              | `smtp-relay.brevo.com`                |
| Port              | `587`                                 |
| Username          | Brevo SMTP login (`…@smtp-brevo.com`) |
| Password          | Brevo SMTP key (secret)               |
| Min interval/user | 30 seconds                            |

Authentication → Email Templates: "Confirm signup" and "Reset password" use
the repo templates `supabase/templates/confirmation.html` and
`supabase/templates/recovery.html` (subject: "Your Petmosphere verification
code"). Keep the repo copies in sync with any dashboard edits.

The local development stack (`supabase` CLI) ignores this and uses the local
Inbucket mail catcher — see "Local development" below.

## Reproducing the setup from scratch

1. **Brevo account** — sign up free at app.brevo.com.
2. **Add sending domain** — Senders, Domains & Dedicated IPs → Domains →
   Add a domain → `petmosphere.com.au`.
3. **Add DNS records** — copy the values Brevo shows (Brevo offers an
   NS-delegation mode; the CNAME/TXT mode is what Petmosphere uses). Add them
   in **Vercel → Domains → petmosphere.com.au → DNS Records → Add**:
   - Name field takes the prefix only (`brevo1._domainkey`, `mail`, …) —
     Vercel appends the domain. Use `@` for root records.
   - NS records cannot coexist with other records on the same name; if Vercel
     reports conflicts, records for that name already exist (they may be the
     correct Brevo ones — verify before deleting anything).
4. **Verify the domain** in Brevo (may take minutes to a few hours for DKIM).
5. **Add the sender** — Senders → Add a sender →
   `no-reply@petmosphere.com.au`, reply-to inbox = team gmail. Brevo emails a
   confirmation link to that address; the `mail` CNAME records must be in
   place for it to arrive. Verify it.
6. **Generate SMTP key** — Profile → SMTP & API → generate key.
7. **Configure Supabase** — fill the SMTP settings table above → Save.
8. **Sync email templates** from `supabase/templates/`.
9. **Test** — see below.

## Verifying deliverability

1. Sign up on production with a Gmail address.
2. The email should land in the **primary inbox**, from
   `Petmosphere <no-reply@petmosphere.com.au>`.
3. Gmail → open email → ⋮ → **Show original** — expect:
   ```
   SPF:   PASS
   DKIM:  PASS  (domain: petmosphere.com.au)
   DMARC: PASS
   ```
4. Repeat with Outlook/Hotmail (View message source → `dmarc=pass`) and Yahoo.
5. Optional: send to the address shown at mail-tester.com — aim for 9/10+.
6. Check Brevo → Transactional → Logs for accepted/delivered status and spam
   reports on every send.

### New-domain warm-up

A freshly authenticated domain has zero sender reputation. For the first
2–3 weeks: send low volume, open/click test emails, and ask beta users who
see junk to mark it "Not junk". If Gmail passes but Outlook junks initially,
that is warm-up, not misconfiguration — escalate only if it persists past the
warm-up window (then consider a dedicated IP or a deliverability-focused
provider such as Postmark).

## Local development

Local Supabase does not use Brevo. `supabase/config.toml` enables the local
SMTP catcher (`local_smtp`), and verification emails are readable in the
Inbucket web UI at `http://127.0.0.1:54324` (the e2e suite reads codes from
there too). Nothing to configure; never point local at Brevo — it would burn
the daily quota and send real email from test flows.

## Troubleshooting

| Symptom                                        | Check                                                                                                                                                                                    |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Email lands in junk (Gmail)                    | Show original → if `DKIM: PASS (d=brevo.com)` instead of `d=petmosphere.com.au`, the sender in Brevo is not using the domain key — recheck Senders and the domain's Authenticated status |
| Email lands in junk (first weeks only)         | Domain warm-up — see above                                                                                                                                                               |
| Email never arrives                            | Brevo → Transactional → Logs: not attempted → Supabase SMTP settings wrong (host/port/credentials). Attempted but bounced → sender not verified in Brevo                                 |
| Supabase rejects SMTP settings                 | Username must be the `…@smtp-brevo.com` login, not an email address                                                                                                                      |
| Brevo verification stays red                   | DNS propagation (wait, re-verify) or record mismatch — compare every name/value against Brevo's current config; a stale `brevo-code` TXT after re-keying is the usual culprit            |
| Verification email content is Supabase default | Dashboard email templates not synced from `supabase/templates/`                                                                                                                          |
| 300/day quota exhausted                        | Reduce non-essential sends or upgrade Brevo plan                                                                                                                                         |

## Changing the setup

- **Rotating the SMTP key**: generate a new key in Brevo, update Supabase SMTP
  settings, then revoke the old key in Brevo. Test a signup immediately after.
- **Rotating DKIM/adding providers**: add the new provider's records in
  Vercel DNS alongside Brevo's (SPF allows multiple `include:` mechanisms;
  never create a second TXT starting `v=spf1` on the same name — merge into
  one record).
- Any change here must be reflected in this runbook in the same PR.
