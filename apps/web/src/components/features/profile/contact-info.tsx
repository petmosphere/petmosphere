import { Mail } from "lucide-react";

import { AppNav } from "@/components/features/pets/app-nav";

import { ProfileShell } from "./profile-shell";

const supportEmail = "info.petmosphere@gmail.com";

export function ContactInfo({ diaryHref }: { diaryHref?: string | undefined }) {
  return (
    <ProfileShell title="Contact us">
      <section className="mt-12 text-center">
        <span className="mx-auto grid size-20 place-items-center rounded-full bg-[#fff0df] text-[#ed802a]">
          <Mail aria-hidden="true" className="size-9" />
        </span>
        <h2 className="mt-6 text-xl font-bold">We’re here to help</h2>
        <p className="mx-auto mt-3 max-w-xs leading-6 text-[#7a7a7a]">
          Tap the email address below to open your email app. Please describe
          what happened and how we can help, but do not include passwords or
          other sensitive information.
        </p>
        <a
          className="mx-auto mt-6 inline-flex min-h-14 items-center gap-3 rounded-2xl border border-[#ead9c7] bg-white/55 px-5 font-semibold text-[#2d2d2d] shadow-[0_8px_24px_rgba(205,146,85,0.06)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a]"
          href={`mailto:${supportEmail}`}
        >
          <Mail aria-hidden="true" className="size-5 text-[#ed802a]" />
          {supportEmail}
        </a>
      </section>
      <div aria-hidden="true" className="h-24" />
      <AppNav
        active="profile"
        diaryHref={diaryHref}
        fixed
        reminderHref="/reminders"
      />
    </ProfileShell>
  );
}
