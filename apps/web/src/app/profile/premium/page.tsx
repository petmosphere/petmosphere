import type { Metadata } from "next";
import { Sparkles } from "lucide-react";

import { ProfileShell } from "@/components/features/profile/profile-shell";
import { requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = { title: "Petmosphere Premium" };

export default async function PremiumPage() {
  await requireUser("/profile/premium");
  return (
    <ProfileShell title="Premium">
      <section className="mt-16 text-center">
        <span className="mx-auto grid size-24 place-items-center rounded-full bg-[#65bcb5]/20 text-[#318783]">
          <Sparkles aria-hidden="true" className="size-10" />
        </span>
        <h2 className="mt-6 text-2xl font-bold">Coming soon</h2>
        <p className="mx-auto mt-3 max-w-xs leading-7 text-[#7a7a7a]">
          We’re shaping a thoughtful set of optional Premium tools. Pricing and
          availability will be shared before anything can be purchased.
        </p>
      </section>
    </ProfileShell>
  );
}
