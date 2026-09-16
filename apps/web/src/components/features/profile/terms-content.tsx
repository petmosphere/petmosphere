import Link from "next/link";

import { AppNav } from "@/components/features/pets/app-nav";
import { BackButton } from "@/components/ui/back-button";

const acceptableUseItems = [
  "upload, create, store or distribute unlawful, harmful, defamatory, abusive or fraudulent content;",
  "upload content that infringes others’ intellectual property, privacy, confidentiality or other rights;",
  "upload images or videos containing identifiable people without their consent;",
  "impersonate another person or misrepresent your identity or authority;",
  "access or attempt to access another user’s account, records or data;",
  "obtain passwords or security information belonging to another person;",
  "introduce malware or harmful code or files;",
  "interfere with, overload, disrupt or circumvent the Service or its security controls;",
  "scrape, crawl or use automated tools to access the Service without our written permission;",
  "reverse engineer or attempt to extract source code, except where permitted by law;",
  "send spam or store bulk content unrelated to the intended purpose of the Service;",
  "test the vulnerability of the Service without our written authorisation; or",
  "use the Service as an emergency dispatch, veterinary monitoring or clinical decision‑making service.",
];

function Section({
  children,
  number,
  title,
}: {
  children: React.ReactNode;
  number: string;
  title: string;
}) {
  return (
    <section className="rounded-2xl border border-[#f0e6d8] bg-white/60 p-6">
      <h2 className="flex items-center gap-3 text-base font-bold text-[#2d2d2d]">
        <span className="grid h-6 min-w-9 place-items-center rounded-lg bg-[#ed802a]/10 px-2 text-sm font-semibold text-[#ed802a]">
          {number}
        </span>
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-6 text-[#7a7a7a]">
        {children}
      </div>
    </section>
  );
}

export function TermsContent({
  backHref,
  diaryHref,
  profileMode = false,
}: {
  backHref: string;
  diaryHref?: string | undefined;
  profileMode?: boolean;
}) {
  return (
    <main className="min-h-dvh bg-[#fdf8f2] pb-28 text-[#2d2d2d]">
      <div
        className={`mx-auto w-full px-6 pt-[max(1.5rem,env(safe-area-inset-top))] ${
          profileMode ? "max-w-[393px]" : "max-w-md"
        }`}
      >
        <div className="flex items-center gap-4">
          <BackButton
            className="grid size-11 shrink-0 place-items-center rounded-full border border-[#f0e6d8] bg-white/60 text-[#ed802a] transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a] active:scale-[0.97] motion-reduce:transform-none"
            fallbackHref={backHref}
            iconClassName="size-5"
          />
          <h1 className="text-2xl font-extrabold tracking-[-0.025em]">
            Terms of Service
          </h1>
        </div>
        <p className="mt-3 text-sm text-[#7A7A7A]">
          Effective date: 16 September 2026 · Version 2026-09-16
        </p>

        <div className="mt-6 space-y-4">
          <Section number="1" title="About these Terms">
            <p>
              These Terms of Service (Terms) are an agreement between J CAI & S
              LI & H LU (ABN 24 226 497 748), trading as Petmosphere
              (Petmosphere, we, us or our), and you. They govern your access to
              and use of the Petmosphere website, progressive web application,
              and related services (the Service).
            </p>
            <p>
              By creating an account, selecting I accept, or using the Service,
              you agree to these Terms. If you do not agree, do not use the
              Service.
            </p>
          </Section>

          <Section number="2" title="The Service">
            <p>
              Petmosphere helps pet owners organise and manage information about
              their pets, including pet profiles, observations, documents and
              reminders. Features may vary by device, location or version. We
              may improve, modify or discontinue parts of the Service. Where a
              change materially affects existing users, we will provide
              reasonable notice where practicable and in accordance with section
              14.
            </p>
          </Section>

          <Section number="3" title="Veterinary and emergency disclaimer">
            <p>
              Petmosphere is not a veterinary clinic or practitioner and is not
              a substitute for professional veterinary advice, diagnosis or
              treatment. Information in the Service is general and informational
              only and may be incomplete, delayed or incorrect. Do not rely on
              the Service to make urgent or clinical decisions. We do not
              continuously monitor your entries for emergencies and uploading
              information does not notify a veterinarian or emergency service.
              Reminders and notifications are convenience tools and may be
              delayed or unavailable. If you have concerns about an animal’s
              health, contact a qualified veterinarian. In an emergency, contact
              a veterinarian or emergency hospital immediately.
            </p>
          </Section>

          <Section number="4" title="Eligibility and your account">
            <p>Provide information that is accurate and reasonably current.</p>
            <p>
              Do not impersonate another person, create an account using
              information you are not authorised to use, or sell/transfer your
              account without our written permission.
            </p>
            <p>
              Keep your credentials secure. If you believe your account has been
              accessed without permission, change your password and contact us.
            </p>
            <p>
              If you are under the age at which you can legally enter into a
              contract in your jurisdiction, you confirm that you have reviewed
              these Terms with a parent or legal guardian and have their consent
              for your use of the Service.
            </p>
          </Section>

          <Section number="5" title="Your content and data">
            <h3 className="font-bold text-stone-900">Your rights</h3>
            <p>
              User Content means records, notes, photographs, videos, documents
              and other content you submit to or store through the Service. As
              between you and Petmosphere, you retain any rights you hold in
              your User Content. Only upload content you are authorised to
              provide. Do not include another person’s personal information in
              pet notes or uploads unless you are authorised to do so and it is
              lawful.
            </p>
            <h3 className="pt-2 font-bold text-stone-900">
              Licence required to provide the Service
            </h3>
            <p>
              You grant Petmosphere a non-exclusive, worldwide, royalty-free
              licence to host, reproduce, process, transmit, back up and display
              your User Content only as reasonably necessary to operate, secure
              and support the Service, prevent or investigate misuse, comply
              with law, and exercise our rights and responsibilities under these
              Terms. This licence allows us to use service providers acting on
              our behalf. It does not permit us to make private pet records
              public or use them for advertising without separate permission.
              The licence continues while we hold the relevant User Content,
              including any limited period during which residual copies remain
              in secured backups.
            </p>
            <h3 className="pt-2 font-bold text-stone-900">Important records</h3>
            <p>
              Petmosphere is not intended to be the only copy or permanent
              archive of important records. Retain independent copies of
              information needed for veterinary care, insurance, legal
              compliance or other important purposes.
            </p>
          </Section>

          <Section number="6" title=" Privacy and data handling">
            <p>
              We handle personal information in accordance with our Privacy
              Policy and applicable privacy law. We do not sell personal
              information. We do not use private pet records for third‑party
              advertising. The Privacy Policy explains how information may be
              disclosed to providers that help us operate Petmosphere and how to
              make access, correction, export and deletion requests.
            </p>
            <p>
              Primary hosting and location: Primary hosting for the Service is
              in Sydney, Australia (AWS ap‑southeast‑2) via our providers. We do
              not provide offshore customer support access. Some providers may
              process or store information outside Australia (for example, in
              the United States or other regions where they operate). Where
              Australian privacy law applies, we will take reasonable steps
              required by law before disclosing personal information overseas
              and will require appropriate safeguards consistent with the
              Australian Privacy Principles (APPs).
            </p>
            <p>
              Notifiable data breaches: If an eligible data breach occurs, we
              will assess promptly and notify affected individuals and the OAIC
              where required by law.
            </p>
          </Section>

          <Section number="7" title="Notifications and communications">
            <p>
              The Service may send push notifications you choose to enable.
              Delivery may be delayed, interrupted or unavailable. You can
              disable notifications in your device or browser settings and
              within the Service. We comply with the Spam Act 2003 for
              electronic communications and provide unsubscribe/opt‑out
              mechanisms where required.
            </p>
          </Section>

          <Section number="8" title="Acceptable use">
            <p>Use the Service lawfully and responsibly. You must not:</p>
            <ul className="list-disc space-y-2 pl-6">
              {acceptableUseItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p>
              We may investigate suspected misuse and take proportionate action,
              including removing or disabling access to content, preserving
              content for legal purposes, and restricting or suspending access
              where reasonably necessary to protect users, animals, Petmosphere
              or third parties. Where appropriate, we will provide notice and a
              reasonable opportunity to address the issue unless immediate
              action is reasonably necessary to prevent harm or legal risk.
            </p>
          </Section>

          <Section number="9" title="Intellectual property">
            <p>
              Petmosphere and its licensors retain all rights in the Service
              other than rights you retain in your User Content. This includes
              software, interface designs, Petmosphere content, graphics,
              databases, trademarks, business names and branding. Subject to
              these Terms, we grant you a limited, personal, non‑exclusive,
              non‑transferable and revocable right to access and use the Service
              for its intended personal use.
            </p>
          </Section>

          <Section number="10" title="Feedback">
            <p>
              If you voluntarily provide suggestions or feedback, you permit us
              to use that feedback to operate and improve the Service without
              payment or obligation to you. This does not give us ownership of
              your User Content or personal information.
            </p>
          </Section>

          <Section number="11" title="Third‑party services and integrations">
            <p>
              The Service relies on third‑party providers for functions such as
              hosting, authentication, storage, monitoring, and notifications
              (for example, Supabase, Vercel, Sentry, and providers used for
              email and push notifications). Optional features may later allow
              you to connect third‑party services subject to their terms and
              privacy policies. We are not responsible for third‑party services
              you choose to connect, which is subject to any non‑excludable
              liability under law.
            </p>
          </Section>

          <Section number="12" title=" Service availability and changes">
            <p>
              We aim to operate the Service reliably but do not guarantee it
              will always be available, uninterrupted or error‑free. The Service
              may be affected by maintenance, internet or telecommunications
              failures, provider outages, device or browser compatibility,
              security incidents, legal requirements or circumstances outside
              our reasonable control. We may temporarily restrict access where
              reasonably necessary for maintenance, security, legal compliance
              or protection of users and data. Where practicable, we will give
              reasonable notice of planned downtime or material changes.
            </p>
          </Section>

          <Section number="13" title="Fees and billing">
            <p>
              There are no paid plans or in-app purchases at launch (MVP). If we
              introduce paid plans later, we will:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                provide clear plan and price information, including GST
                treatment, billing cycles, auto-renewal, trials (if any),
                cancellation, pro-rata refunds (if any), chargebacks and late or
                non-payment handling;
              </li>
              <li>
                provide at least 30 days’ advance notice of any material price
                or plan change; and
              </li>
              <li>
                allow you to cancel before the change takes effect. If you have
                prepaid fees for a period beyond the effective date of a
                material detrimental change, we will provide a pro-rata refund
                for the unused period to the extent required by law or by these
                Terms.
              </li>
            </ul>
          </Section>

          <Section number="14" title="Changes to these Terms">
            <p>
              We may update these Terms to reflect changes to the Service, our
              business or providers, legal or security requirements, or to
              improve clarity and user protection.
            </p>
            <p>
              For material changes, we will give at least 30 days’ advance
              notice via email and/or in‑Service notice and identify when the
              change takes effect.
            </p>
            <p>
              Where a change materially increases your obligations or reduces
              your rights, you may terminate before the change takes effect. If
              you have prepaid fees for a period beyond the effective date, we
              will provide a pro‑rata refund for the unused period.
            </p>
            <p>
              These commitments do not limit rights or remedies under applicable
              law.
            </p>
          </Section>

          <Section number="15" title="Suspension and account closure">
            <p>
              You may close your account using available tools or by contacting
              us. We may restrict, suspend or close an account where we
              reasonably believe these Terms have been seriously or repeatedly
              breached; the account poses a security, fraud, legal or safety
              risk; continued access could cause harm; we are legally required
              to act; or continued operation is no longer reasonably
              practicable. Unless immediate action is necessary to prevent harm
              or legal risk, we will provide notice and a reasonable opportunity
              to address the issue. Where reasonably practicable, we will allow
              retrieval or export of eligible User Content before permanent
              closure. We may offer a simple appeal process; decisions will be
              made in a reasonable time.
            </p>
          </Section>

          <Section number="16" title="Access, export and deletion">
            <p>
              You may request access to, correction of, export of or deletion of
              eligible account information using available account tools or by
              contacting us. We may need to verify your identity and may refuse
              or limit a request where the law allows, explaining why where
              required. Exports may currently be provided via support on a
              reasonable‑efforts basis; we plan to add self‑service export tools
              in future. If you request to delete your account, we will remove
              your personal information from our active databases within 7 days.
              Please note that residual copies of this data may persist in our
              secure, encrypted backups for a period of up to 30 days before
              being permanently overwritten in our standard backup cycle.
            </p>
          </Section>

          <Section number="17" title="Consumer guarantees">
            <p>
              Our services come with guarantees that cannot be excluded under
              the Australian Consumer Law (ACL). Nothing in these Terms
              excludes, restricts or modifies any consumer guarantee, right or
              remedy under the ACL, or any other right or liability that cannot
              lawfully be excluded, restricted or modified.
            </p>
          </Section>

          <Section number="18" title="Liability">
            <p>
              Nothing in these Terms limits liability where doing so would be
              unlawful, including liability under non‑excludable consumer
              guarantees. To the extent permitted by law, we are not liable for
              loss caused solely by your unlawful or unauthorised use; failure
              to seek appropriate professional care; reliance on the Service as
              an emergency or clinical service contrary to these Terms;
              inaccurate or unlawful User Content; failure to maintain
              independent copies of important records; or a third‑party service
              you independently choose to use. Where the law permits us to limit
              a remedy for failure to comply with a consumer guarantee relating
              to services, our liability is limited, at our option, to supplying
              the affected services again or paying the reasonable cost of
              having them supplied again. This section does not limit liability
              to the extent such limitation would be unfair or unlawful,
              including for certain privacy obligations where limitation is not
              permitted by law.
            </p>
          </Section>

          <Section number="19" title="Intellectual property complaints">
            <p>
              If you believe content available through the Service infringes
              your rights, please email a notice to info.petmosphere@gmail.com
              with:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                identification of the copyrighted work or other rights at issue;
              </li>
              <li>
                identification of the content and where it is located in the
                Service;
              </li>
              <li>your contact details; and</li>
              <li>
                a statement that you have a good-faith belief the use is not
                authorised and that the information in your notice is accurate.
              </li>
            </ul>
            <p>
              We may remove or disable access to the content and, where
              appropriate, notify the user and allow a response. We may close
              accounts of repeat infringers in appropriate circumstances.
            </p>
          </Section>

          <Section number="20" title="Future features and AI tools">
            <p>
              We may later introduce optional AI-assisted informational tools.
              If we do, we will explain how those features work, what content
              they process, what third-party providers (if any) are involved,
              retention periods, and your choices (including opt-out). We will
              not use your private pet records to train our models without your
              explicit consent.
            </p>
          </Section>

          <Section number="21" title="App distribution and app store terms">
            <p>
              If you download the Service via an app store (for example, Apple
              App Store), additional terms required by that store may apply. We
              will publish any required addendum at or before mobile app
              release. To the extent of any conflict, the store-required terms
              will apply for the mobile app.
            </p>
          </Section>

          <Section number="22" title="Governing law and disputes">
            <p>
              These Terms are governed by the laws of New South Wales,
              Australia. You and Petmosphere submit to the non-exclusive
              jurisdiction of the courts of New South Wales and courts entitled
              to hear appeals from them. This does not limit any rights you may
              have under the Australian Consumer Law, including a right to bring
              a dispute in another forum where applicable law permits.
            </p>
          </Section>

          <Section number="23" title="General terms">
            <p>
              If part of these Terms is invalid or unenforceable, it will be
              read down to the minimum extent necessary or removed, and the
              remainder will continue in force. A failure to immediately enforce
              a right is not a waiver. We may transfer our rights and
              obligations as part of a genuine restructuring, financing, sale or
              transfer of Petmosphere, provided it does not materially reduce
              your rights and we notify you of the assignee where practicable.
            </p>
          </Section>

          <Section number="24" title="Contact and legal notices">
            <p>
              <strong>Petmosphere</strong>
              <br />
              Operated by J CAI &amp; S LI &amp; H LU
              <br />
              ABN 24 226 497 748
              <br />
              Email:{" "}
              <a
                className="font-semibold text-[#ED802A] underline"
                href="mailto:info.petmosphere@gmail.com"
              >
                info.petmosphere@gmail.com
              </a>
            </p>
          </Section>
        </div>
      </div>

      {profileMode ? (
        <div className="mx-auto w-full max-w-[393px]">
          <AppNav
            active="profile"
            diaryHref={diaryHref}
            fixed
            reminderHref="/reminders"
          />
        </div>
      ) : (
        <div className="fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[#fdf8f2] via-[#fdf8f2]/95 to-transparent px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto w-full max-w-md">
            <Link
              className="block min-h-13 w-full rounded-xl bg-[#ED802A] px-5 py-3.5 text-center text-base font-semibold text-[#fdf8f2] shadow-[0_4px_16px_rgba(205,146,85,0.14)] transition hover:bg-[#df6d16] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a94e0c]"
              href="/auth/sign-up"
            >
              Agree
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
