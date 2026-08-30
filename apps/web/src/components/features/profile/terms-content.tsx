import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { AppNav } from "@/components/features/pets/app-nav";

const acceptableUseItems = [
  "upload, create, store or distribute unlawful, harmful, defamatory, abusive or fraudulent content",
  "upload content that infringes another person’s intellectual-property, privacy, confidentiality or other rights",
  "upload personal information that you are not authorised to provide",
  "impersonate another person or misrepresent your identity or authority",
  "access or attempt to access another user’s account, records or data",
  "obtain passwords, credentials or security information belonging to another person",
  "introduce malware, malicious code or harmful files",
  "interfere with, overload, disrupt or circumvent the Service or its security controls",
  "scrape, crawl or use automated tools to access the Service without our written permission",
  "reverse engineer or attempt to extract source code, except where applicable law permits it",
  "send spam or store bulk content unrelated to the intended purpose of the Service",
  "test the vulnerability of the Service without our written authorisation",
  "use the Service as an emergency dispatch, veterinary monitoring or clinical decision-making service",
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
          <Link
            aria-label="Back"
            className="grid size-11 shrink-0 place-items-center rounded-full border border-[#f0e6d8] bg-white/60 text-[#ed802a] transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a] active:scale-[0.97] motion-reduce:transform-none"
            href={backHref}
          >
            <ArrowLeft aria-hidden="true" className="size-5" strokeWidth={2} />
          </Link>
          <h1 className="text-2xl font-extrabold tracking-[-0.025em]">
            Terms of Service
          </h1>
        </div>
        <p className="mt-3 text-sm text-[#7A7A7A]">
          Effective date: 12 August 2026 · Version 2026-08-12
        </p>

        <div className="mt-6 space-y-4">
          <Section number="1" title="About these Terms">
            <p>
              These Terms of Service (“Terms”) are an agreement between you and
              J CAI &amp; S LI &amp; H LU, ABN 24 226 497 748, trading as
              Petmosphere (“Petmosphere”, “we”, “us” or “our”).
            </p>
            <p>
              These Terms govern your access to and use of the Petmosphere
              website, progressive web application, future mobile applications
              and related services that we make available from time to time
              (collectively, the “Service”).
            </p>
            <p>
              By creating an account, selecting “I accept”, or otherwise using
              account functionality governed by these Terms, you agree to these
              Terms. If you do not agree, do not create an account or use the
              Service.
            </p>
          </Section>

          <Section number="2" title="The Service">
            <p>
              Petmosphere is a digital pet health and management platform that
              helps pet owners organise, record and manage information relating
              to their pets.
            </p>
            <p>
              The Service may include tools for maintaining pet profiles,
              recording health and wellbeing observations, storing photographs,
              videos and documents, managing reminders, viewing historical
              records, and accessing general educational or informational
              content.
            </p>
            <p>
              We may introduce additional functionality over time, including
              integrations with third-party services and optional automated or
              artificial-intelligence-assisted informational tools. Available
              features may vary depending on your account, device, location or
              version of the Service.
            </p>
            <p>
              We may improve, modify or discontinue parts of the Service. Where
              a change materially affects existing users, we will provide
              reasonable notice where practicable. This does not affect rights
              or remedies available under applicable law.
            </p>
          </Section>

          <Section number="3" title="Veterinary and emergency disclaimer">
            <p>
              Petmosphere is not a veterinary clinic, veterinarian or other
              veterinary practitioner, animal emergency service, or substitute
              for professional veterinary advice, examination, diagnosis or
              treatment.
            </p>
            <p>
              Information made available through the Service is general and
              informational in nature. It may be incomplete, delayed or
              incorrect and should not be relied upon to make urgent or clinical
              decisions about an animal.
            </p>
            <p>
              Petmosphere does not continuously monitor your records or entries
              for emergencies. Uploading information does not notify a
              veterinarian, emergency service or other professional.
            </p>
            <p>
              Reminders and notifications are convenience tools only and may be
              delayed, interrupted or unavailable. Do not rely on Petmosphere as
              the sole means of managing medication, treatment, appointments or
              urgent care.
            </p>
            <p>
              You remain responsible for decisions concerning your pet. Contact
              a qualified veterinarian if you have concerns about an animal’s
              health. In an emergency, contact a veterinarian or emergency
              veterinary hospital immediately.
            </p>
          </Section>

          <Section number="4" title="Eligibility and your account">
            <p>
              You must be at least 18 years old to create an account and must
              provide information that is accurate and reasonably current.
            </p>
            <p>
              You must not impersonate another person, create an account using
              information you are not authorised to use, sell or transfer your
              account without our written permission, or allow another person to
              use your account in breach of these Terms.
            </p>
            <p>
              You are responsible for taking reasonable steps to keep your
              credentials secure. If you believe your account has been accessed
              without permission, change your password immediately and contact
              us.
            </p>
          </Section>

          <Section number="5" title="Your content and data">
            <h3 className="font-bold text-stone-900">Your rights</h3>
            <p>
              “User Content” means records, notes, photographs, videos,
              documents and other content that you submit to or store through
              the Service. As between you and Petmosphere, you retain any rights
              you hold in your User Content.
            </p>
            <p>
              You must have the rights, permissions and authority necessary to
              submit User Content. You must not upload information about another
              person unless you are authorised to do so and its submission is
              lawful.
            </p>
            <h3 className="pt-2 font-bold text-stone-900">
              Licence required to provide the Service
            </h3>
            <p>
              You grant Petmosphere a non-exclusive, worldwide and royalty-free
              licence to host, reproduce, process, transmit, back up and display
              your User Content only as reasonably necessary to operate, secure
              and support the Service, prevent or investigate misuse, comply
              with law, and exercise our rights and responsibilities under these
              Terms.
            </p>
            <p>
              This licence permits us to use service providers acting on our
              behalf. It does not permit us to make private pet records public
              or use them for advertising without separate permission. It
              continues while we hold the relevant User Content, including any
              limited period during which residual copies remain in secured
              backups.
            </p>
            <h3 className="pt-2 font-bold text-stone-900">
              Personal information
            </h3>
            <p>
              We handle personal information in accordance with our Privacy
              Policy and applicable privacy law. We do not sell personal
              information for monetary consideration. Our Privacy Policy
              explains how information may be disclosed to providers that help
              us operate Petmosphere.
            </p>
            <h3 className="pt-2 font-bold text-stone-900">
              Access, export and deletion requests
            </h3>
            <p>
              You may request access to, correction of, export of or deletion of
              eligible account information using available account tools or by
              contacting us. We will respond to verified requests as stated in
              our Privacy Policy and required by law.
            </p>
            <p>
              We may retain information where reasonably necessary to comply
              with legal, taxation or accounting obligations; resolve disputes;
              investigate security incidents, fraud or misuse; enforce these
              Terms; or maintain the security and integrity of the Service.
              Residual copies may remain temporarily in secured backups.
            </p>
            <h3 className="pt-2 font-bold text-stone-900">Important records</h3>
            <p>
              Petmosphere is not intended to be the only copy or permanent
              archive of important records. Retain independent copies of
              information needed for veterinary care, insurance, legal
              compliance or other important purposes.
            </p>
          </Section>

          <Section number="6" title="Acceptable use">
            <p>
              You must use the Service lawfully and responsibly. You must not
              use or attempt to use Petmosphere to:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              {acceptableUseItems.map((item) => (
                <li key={item}>{item};</li>
              ))}
            </ul>
            <p>
              We may investigate suspected misuse and take proportionate action,
              including restricting or suspending access where reasonably
              necessary to protect users, animals, Petmosphere or third parties.
            </p>
          </Section>

          <Section number="7" title="Petmosphere intellectual property">
            <p>
              Petmosphere and its licensors retain all rights in the Service
              other than rights you retain in your User Content. This includes
              software, interface designs, Petmosphere content, graphics,
              databases, trademarks, business names and branding.
            </p>
            <p>
              Subject to these Terms, we grant you a limited, personal,
              non-exclusive, non-transferable and revocable right to access and
              use the Service for its intended personal use.
            </p>
          </Section>

          <Section number="8" title="Feedback">
            <p>
              If you voluntarily provide suggestions or feedback, you permit us
              to use that feedback to operate and improve the Service without
              payment or obligation to you. This does not give us ownership of
              your User Content or personal information.
            </p>
          </Section>

          <Section number="9" title="Third-party services">
            <p>
              The Service relies on third-party providers for functions such as
              hosting, authentication, storage, monitoring and email delivery.
              Optional features may allow you to connect third-party services
              that have their own terms and privacy policies.
            </p>
            <p>
              We are not responsible for a third-party service you independently
              choose to connect. This does not exclude responsibility we may
              have for providers acting on our behalf or liability that cannot
              lawfully be excluded.
            </p>
          </Section>

          <Section number="10" title="Service availability and changes">
            <p>
              We aim to operate Petmosphere reliably, but do not guarantee that
              the Service will always be available, uninterrupted or error-free.
            </p>
            <p>
              The Service may be affected by maintenance, internet or
              telecommunications failures, provider outages, device or browser
              compatibility, security incidents, legal requirements, or
              circumstances outside our reasonable control.
            </p>
            <p>
              We may temporarily restrict access where reasonably necessary for
              maintenance, security, legal compliance or protection of users and
              data. Where practicable, we will give reasonable notice of planned
              downtime or material changes.
            </p>
          </Section>

          <Section number="11" title="Suspension and account closure">
            <p>
              You may ask us to close your account using available account tools
              or by contacting us.
            </p>
            <p>
              We may restrict, suspend or close an account where we reasonably
              believe these Terms have been seriously or repeatedly breached;
              the account poses a security, fraud, legal or safety risk;
              continued access could cause harm; we are legally required to act;
              or continued operation is no longer reasonably practicable.
            </p>
            <p>
              Where appropriate, we will give notice and a reasonable
              opportunity to address the issue. We may act immediately where
              delay would create a material risk. Where reasonably practicable,
              we will allow retrieval of eligible User Content before permanent
              closure unless doing so would create a security or legal risk.
            </p>
          </Section>

          <Section number="12" title="Consumer guarantees">
            <p>
              Our services come with guarantees that cannot be excluded under
              the Australian Consumer Law.
            </p>
            <p>
              Nothing in these Terms excludes, restricts or modifies any
              consumer guarantee, right or remedy under the Australian Consumer
              Law, or any other right or liability that cannot lawfully be
              excluded, restricted or modified.
            </p>
          </Section>

          <Section number="13" title="Liability">
            <p>
              Nothing in these Terms limits liability where doing so would be
              unlawful, including liability under consumer guarantees that
              cannot be excluded or limited.
            </p>
            <p>
              To the extent permitted by law, Petmosphere is not liable for loss
              caused solely by your unlawful or unauthorised use; failure to
              seek appropriate professional care; reliance on Petmosphere as an
              emergency or clinical service contrary to these Terms; inaccurate
              or unlawful User Content; failure to maintain independent copies
              of important records; or a third-party service you independently
              choose to use.
            </p>
            <p>
              Where the law permits us to limit a remedy for failure to comply
              with a consumer guarantee relating to services, our liability is
              limited, at our option, to supplying the affected services again
              or paying the reasonable cost of having them supplied again. This
              does not apply where the limitation would be unfair or unlawful.
            </p>
          </Section>

          <Section number="14" title="Changes to these Terms">
            <p>
              We may update these Terms to reflect changes to the Service, our
              business or providers, legal or security requirements, or
              improvements to clarity and user protection.
            </p>
            <p>
              If a change is material, we will give reasonable advance notice
              and identify when it takes effect. Where it materially increases
              your obligations or reduces your rights, we may ask you to accept
              it before continuing to use affected functionality.
            </p>
          </Section>

          <Section number="15" title="Complaints and disputes">
            <p>
              Contact us with enough information for us to understand your
              concern. We will acknowledge complaints within a reasonable time
              and attempt to resolve them in good faith.
            </p>
            <p>
              Nothing prevents you from contacting a regulator, exercising
              rights under the Australian Consumer Law or commencing legal
              proceedings.
            </p>
          </Section>

          <Section number="16" title="Governing law">
            <p>
              These Terms are governed by the laws of Victoria, Australia. You
              and Petmosphere submit to the jurisdiction of Victorian courts and
              courts entitled to hear appeals from them.
            </p>
            <p>
              This does not limit a right to bring a dispute in another
              jurisdiction under applicable consumer law.
            </p>
          </Section>

          <Section number="17" title="General terms">
            <p>
              If part of these Terms is invalid or unenforceable, it will be
              read down to the minimum extent necessary or removed, and the
              remainder will continue.
            </p>
            <p>
              A failure to immediately enforce a right is not a waiver. We may
              transfer our rights and obligations as part of a genuine
              restructuring, financing, sale or transfer of Petmosphere,
              provided it does not materially reduce your rights.
            </p>
          </Section>

          <Section number="18" title="Contact us">
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
