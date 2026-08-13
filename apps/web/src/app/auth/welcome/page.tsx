import { CircleCheckBig, PawPrint } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Welcome to Petmosphere" };

export default async function WelcomePage() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) redirect("/auth/sign-in");
  } catch {
    redirect("/auth/sign-in");
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-[#fdf8f2] px-6 py-10 text-stone-950">
      <section className="w-full max-w-md text-center">
        <Link
          aria-label="Petmosphere home"
          className="mx-auto flex h-13 w-13 items-center justify-center rounded-full bg-[#fffaf5] font-bold text-[#dd792d] shadow-sm"
          href="/"
        >
          <PawPrint aria-hidden="true" className="size-6" strokeWidth={1.8} />
        </Link>

        <div className="mx-auto mt-10 grid size-56 place-items-center rounded-full border border-[#ead9c7] bg-white shadow-xl shadow-[#8b5b30]/8 sm:size-64">
          <div className="grid size-36 place-items-center rounded-full bg-[#fff0e1] sm:size-40">
            <CircleCheckBig
              aria-hidden="true"
              className="size-20 text-[#f47b20]"
              strokeWidth={1.4}
            />
          </div>
        </div>

        <h1 className="mt-10 text-3xl font-bold tracking-tight text-balance">
          Welcome to Petmosphere!
        </h1>
        <p className="mx-auto mt-3 max-w-sm leading-7 text-stone-600">
          Your email is verified and your private account is ready.
        </p>

        <Link
          className="mt-10 flex min-h-13 w-full items-center justify-center rounded-xl bg-[#66bbb6] px-5 font-bold text-white transition hover:bg-[#50aaa5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#347c78]"
          href="/onboarding"
        >
          Get started
        </Link>
      </section>
    </main>
  );
}
