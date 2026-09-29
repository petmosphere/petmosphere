"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function TermsBackButton({ fallbackHref }: { fallbackHref: string }) {
  const router = useRouter();

  function returnToPreviousPage() {
    window.close();
    window.setTimeout(() => {
      if (window.history.length > 1) router.back();
      else router.replace(fallbackHref);
    }, 100);
  }

  return (
    <button
      aria-label="Back"
      className="grid size-11 shrink-0 place-items-center rounded-full border border-[#f0e6d8] bg-white/60 text-[#ed802a] transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a] active:scale-[0.97] motion-reduce:transform-none"
      onClick={returnToPreviousPage}
      type="button"
    >
      <ArrowLeft aria-hidden="true" className="size-5" />
    </button>
  );
}

export function TermsAgreeButton() {
  const router = useRouter();

  function returnToSignUp() {
    window.localStorage.setItem("signup-terms-agreed", "true");
    window.close();
    window.setTimeout(() => router.replace("/auth/sign-up"), 100);
  }

  return (
    <button
      className="min-h-13 w-full rounded-xl bg-[#ED802A] px-5 py-3.5 text-center text-base font-semibold text-[#fdf8f2] shadow-[0_4px_16px_rgba(205,146,85,0.14)] transition hover:bg-[#df6d16] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a94e0c]"
      onClick={returnToSignUp}
      type="button"
    >
      Agree
    </button>
  );
}
