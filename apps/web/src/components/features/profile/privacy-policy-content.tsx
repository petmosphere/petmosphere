import Link from "next/link";

const sections = [
  {
    body: (
      <>
        <p>
          Petmosphere is operated by J CAI &amp; S LI &amp; H LU (ABN 24 226 497
          748), trading as Petmosphere (we, us). This policy explains how we
          handle personal information when you use Petmosphere (the Service). We
          aim to comply with applicable Australian privacy law, including the
          Australian Privacy Principles (APPs).
        </p>
      </>
    ),
    title: "About this policy",
  },
  {
    body: (
      <>
        <p>
          Personal information means information or an opinion about an
          identified individual, or an individual who is reasonably
          identifiable, whether true or not and whether recorded in a material
          form or not.
        </p>
      </>
    ),
    title: "What we mean by personal information",
  },
  {
    body: (
      <>
        <p>Depending on how you use Petmosphere, we may collect:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>your name, email address, account and preference information</li>
          <li>
            pet profiles, including names, species, breeds, age or date of
            birth, sex, desexed status, weight and photos
          </li>
          <li>
            private pet records such as daily check-ins, observations, notes,
            images and reminders
          </li>
          <li>
            notification settings and the technical subscription details needed
            to deliver web push notifications
          </li>
          <li>messages and other information you send to support</li>
          <li>
            limited device, browser, network, security and diagnostic
            information generated when the Service is used (for example, event
            logs and error details)
          </li>
        </ul>
        <p>
          Please do not include another person’s personal information in pet
          notes or uploads unless you are authorised to do so and it is lawful.
        </p>
      </>
    ),
    title: "Information we collect",
  },
  {
    body: (
      <>
        <p>
          It is not practicable for us to provide most features anonymously or
          under a pseudonym because an account and email address are needed to
          secure and synchronise your records. You can browse public pages
          without logging in.
        </p>
      </>
    ),
    title: "Anonymity and pseudonymity",
  },
  {
    body: (
      <>
        <p>
          We usually collect information directly from you when you create an
          account, add or update records, configure notifications, or contact
          us. Some technical information is collected automatically by our
          hosting, security and error-monitoring systems when you use the
          Service.
        </p>
      </>
    ),
    title: "How we collect information",
  },
  {
    body: (
      <>
        <p>We use information to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>create and secure your account</li>
          <li>store, display and synchronise your private pet records</li>
          <li>deliver reminders and notifications you choose to enable</li>
          <li>provide support and respond to requests</li>
          <li>operate, protect, troubleshoot and improve Petmosphere</li>
          <li>meet legal obligations and prevent misuse</li>
        </ul>
        <p>
          We do not sell personal information. We do not use private pet records
          for third-party advertising. Petmosphere does not currently use your
          private records to provide AI veterinary advice.
        </p>
      </>
    ),
    title: "How we use information",
  },
  {
    body: (
      <>
        <p>
          We currently send app/browser push notifications only, which you can
          enable or disable at any time in your device or browser settings and
          within the Service. If we introduce marketing emails or SMS in future,
          we will obtain consent and include clear unsubscribe mechanisms
          consistent with the Spam Act 2003.
        </p>
      </>
    ),
    title: "Direct marketing and notifications",
  },
  {
    body: (
      <>
        <p>
          We may disclose information to service providers that help us operate
          Petmosphere, including:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Supabase for database, authentication and storage services</li>
          <li>Vercel for hosting</li>
          <li>Sentry for privacy-minimised unexpected-error monitoring</li>
          <li>providers used for email and push notifications</li>
        </ul>
        <p>
          Providers may only receive information reasonably needed to perform
          their service and are required to handle it under confidentiality and
          appropriate safeguards. We may also disclose information where
          required by law, to protect people or the Service, or as part of a
          genuine business transfer subject to appropriate safeguards.
        </p>
      </>
    ),
    title: "Service providers and disclosure",
  },
  {
    body: (
      <>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Primary hosting for the Service is in Sydney, Australia
            (ap-southeast-2) via our providers.
          </li>
          <li>
            Some providers may process or store information outside Australia,
            including in the United States or other regions where they operate.
          </li>
          <li>
            We take reasonable steps required by law before disclosing personal
            information overseas and require contractual safeguards consistent
            with the APPs.
          </li>
        </ul>
        <p>
          We will update this section if our data locations materially change.
        </p>
      </>
    ),
    title: "Data location and overseas processing",
  },
  {
    body: (
      <>
        <p>
          We use safeguards including authenticated access, database Row Level
          Security, private media storage, signed media access, encrypted
          network connections and restricted operational access. We configure
          monitoring to avoid collecting private health notes, media, secrets or
          unnecessary identity information.
        </p>
        <p>
          No online service is completely secure. Tell us promptly if you
          believe your account or information has been accessed without
          permission.
        </p>
      </>
    ),
    title: "Storage and security",
  },
  {
    body: (
      <>
        <p>
          We retain information while your account is active and for as long as
          reasonably needed to provide the Service, meet legal obligations,
          resolve disputes, prevent fraud and maintain security.
        </p>
        <p>
          When you delete information or close your account, we will remove or
          de-identify personal information in our active systems within 7 days,
          subject to information we are required or permitted to retain under
          law (for example, for security, fraud prevention or legal compliance).
          Limited residual copies may remain temporarily in protected backups or
          provider logs after deletion. Encrypted backups are typically retained
          for up to 30 days and are then overwritten in the normal backup cycle.
          Our service providers may also retain limited logs and backups for
          their standard retention periods under contracts that require
          appropriate safeguards and deletion at the end of those periods. CDN
          or edge caches may retain content briefly due to their nature, but we
          issue purge requests promptly.
        </p>
        <p>
          Account deletion is available from Edit Profile after
          re-authentication. Deleting your account is irreversible and removes
          your active Petmosphere account data; remaining backups and caches
          will expire as described above.
        </p>
      </>
    ),
    title: "Retention and deletion",
  },
  {
    body: (
      <>
        <p>
          You may ask to access or correct personal information we hold about
          you, or request an export or deletion, by emailing us. We may need to
          verify your identity. We will respond within a reasonable period
          (usually within 30 days). If we refuse or limit a request as permitted
          by law, we will tell you why (unless unreasonable) and how to
          complain. Exports may be provided via support on a reasonable-efforts
          basis; we plan to add self-service export tools in future.
        </p>
      </>
    ),
    title: "Access, correction and portability",
  },
  {
    body: (
      <>
        <p>
          Petmosphere uses essential browser storage and cookies to maintain
          authenticated sessions, security and preferences. We do not currently
          use third-party advertising cookies. Web push is optional and can be
          disabled in Notification Settings and your browser or device settings.
        </p>
      </>
    ),
    title: "Cookies, local storage and notifications",
  },
  {
    body: (
      <>
        <p>
          We do not adopt, use or disclose Australian Government identifiers
          (such as Medicare or driver licence numbers) as our own identifiers.
        </p>
      </>
    ),
    title: "Government identifiers",
  },
  {
    body: (
      <>
        <p>
          The Service may be used by people under 18. If you are under the age
          at which you can legally give consent in your jurisdiction, please
          review this policy with a parent or legal guardian and use the Service
          with their consent and supervision where required by law.
        </p>
      </>
    ),
    title: "Children and young people",
  },
  {
    body: (
      <>
        <p>
          If we become aware of an eligible data breach under the Notifiable
          Data Breaches scheme, we will promptly assess the situation and notify
          affected individuals and the Office of the Australian Information
          Commissioner (OAIC) where required by law.
        </p>
      </>
    ),
    title: "Notifiable Data Breaches",
  },
  {
    body: (
      <>
        <p>
          Email us with details of your concern. We will acknowledge and assess
          privacy complaints within a reasonable time (usually within 30 days)
          and may ask for more information. If you are not satisfied, you may be
          able to contact the OAIC (oaic.gov.au) through its privacy complaints
          process.
        </p>
      </>
    ),
    title: "Privacy complaints",
  },
  {
    body: (
      <>
        <p>
          We may update this policy when Petmosphere, our providers or legal
          obligations change. We will publish the updated date and provide
          reasonable notice of material changes where appropriate.
        </p>
        <p>
          Questions or requests can be sent to{" "}
          <a
            className="font-semibold text-[#b05d1d] underline"
            href="mailto:info.petmosphere@gmail.com"
          >
            info.petmosphere@gmail.com
          </a>
          .
        </p>
      </>
    ),
    title: "Changes and contact",
  },
];

export function PrivacyPolicyContent({
  showDraft = true,
  termsHref = "/terms",
}: {
  showDraft?: boolean;
  termsHref?: string;
}) {
  return (
    <div className="space-y-4">
      {showDraft ? (
        <p className="rounded-xl border border-[#e8c69f] bg-[#fff0df] px-4 py-3 text-sm leading-5 text-[#7a522d]">
          Draft for review — this policy should be reviewed before production
          launch and whenever providers or data practices change.
        </p>
      ) : null}

      {sections.map(({ body, title }) => (
        <section
          className="rounded-2xl border border-[#ead9c7] bg-white/60 p-5 shadow-[0_8px_24px_rgba(205,146,85,0.05)]"
          key={title}
        >
          <h2 className="text-base font-bold">{title}</h2>
          <div className="mt-3 space-y-3 text-sm leading-6 text-[#73706d]">
            {body}
          </div>
        </section>
      ))}

      <p className="px-1 text-center text-sm text-[#7a7a7a]">
        Read the{" "}
        <Link
          className="font-semibold text-[#b05d1d] underline"
          href={termsHref}
        >
          Terms of Service
        </Link>
        .
      </p>
    </div>
  );
}
