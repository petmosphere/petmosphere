import Link from "next/link";

const sections = [
  {
    body: (
      <>
        <p>
          Petmosphere is operated by J CAI &amp; S LI &amp; H LU, ABN 24 226 497
          748, trading as Petmosphere. This draft explains how we handle
          personal information when you use Petmosphere.
        </p>
      </>
    ),
    title: "About this policy",
  },
  {
    body: (
      <>
        <p>Depending on how you use Petmosphere, we may collect:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>your name, email address, account and preference information;</li>
          <li>
            pet profiles, including names, species, breeds, age or date of
            birth, sex, desexed status, weight and photos;
          </li>
          <li>
            private pet records such as daily check-ins, observations, notes,
            images and reminders;
          </li>
          <li>
            notification settings and the technical subscription details needed
            to deliver web push notifications;
          </li>
          <li>messages and other information you send to support; and</li>
          <li>
            limited device, browser, network, security and diagnostic
            information generated when the Service is used.
          </li>
        </ul>
        <p>
          Please do not include another person’s personal information in pet
          notes or uploads unless you are authorised to do so.
        </p>
      </>
    ),
    title: "Information we collect",
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
        <ul className="list-disc space-y-1 pl-5">
          <li>create and secure your account;</li>
          <li>store, display and synchronise your private pet records;</li>
          <li>deliver reminders and notifications you choose to enable;</li>
          <li>provide support and respond to requests;</li>
          <li>operate, protect, troubleshoot and improve Petmosphere; and</li>
          <li>meet legal obligations and prevent misuse.</li>
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
          We may disclose information to service providers that help us operate
          Petmosphere, including Supabase for database, authentication and
          storage services; Vercel for hosting; Sentry for privacy-minimised
          unexpected-error monitoring; and providers used for email and push
          notifications.
        </p>
        <p>
          Providers may only receive information reasonably needed to perform
          their service. We may also disclose information where required by law,
          to protect people or the Service, or as part of a genuine business
          transfer subject to appropriate safeguards.
        </p>
      </>
    ),
    title: "Service providers and disclosure",
  },
  {
    body: (
      <>
        <p>
          Some providers may process or store information outside Australia,
          including in the United States or other regions where they operate.
          Locations can change with provider configuration. Where Australian
          privacy law applies, we will take reasonable steps required by law
          before disclosing personal information overseas.
        </p>
      </>
    ),
    title: "Overseas processing",
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
          resolve disputes, prevent fraud and maintain security. Limited
          residual copies may remain temporarily in protected backups or
          provider logs after deletion.
        </p>
        <p>
          Account deletion is available from Edit Profile after
          re-authentication. It is immediate and permanent for active
          Petmosphere account data, subject to limited information we must or
          are permitted to retain.
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
          verify your identity and may refuse or limit a request where the law
          allows, explaining why where required.
        </p>
      </>
    ),
    title: "Access and correction",
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
          Petmosphere accounts are for people aged 18 or older. The Service is
          not directed to children and we do not knowingly create accounts for
          people under 18.
        </p>
      </>
    ),
    title: "Children",
  },
  {
    body: (
      <>
        <p>
          Email us with details of your concern. We will acknowledge and assess
          privacy complaints within a reasonable time and may ask for more
          information. If you are not satisfied, you may be able to contact the
          Australian Information Commissioner through the{" "}
          <a
            className="font-semibold text-[#b05d1d] underline"
            href="https://www.oaic.gov.au/privacy/privacy-complaints"
          >
            OAIC privacy complaints process
          </a>
          .
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
