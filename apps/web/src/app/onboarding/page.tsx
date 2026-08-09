import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { signOutAction } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Account ready",
  robots: { follow: false, index: false },
};

export default async function OnboardingPage() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) redirect("/auth/sign-in?next=/onboarding");
  } catch {
    redirect("/auth/sign-in?next=/onboarding");
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-[#fbf7f1] px-5 py-10 text-stone-950">
      <section className="w-full max-w-md rounded-[2rem] border border-[#e8d0b3] bg-white p-8 text-center shadow-xl shadow-[#8b5b30]/8">
        <span aria-hidden="true" className="text-5xl">
          🐶
        </span>
        <h1 className="mt-5 text-3xl font-bold">Your account is ready</h1>
        <p className="mt-3 leading-7 text-stone-600">
          Next, you’ll review Petmosphere’s policies. That step is coming in the
          next journey card.
        </p>
        <form action={signOutAction} className="mt-8">
          <button
            className="min-h-12 w-full rounded-2xl border border-stone-300 font-semibold"
            type="submit"
          >
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}
