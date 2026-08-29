import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function ProfileShell({
  backHref = "/profile",
  children,
  title,
}: {
  backHref?: string;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[393px] flex-col bg-[#fdf8f2] px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] text-[#2d2d2d] shadow-xl shadow-stone-900/5">
      <header className="flex items-center gap-4">
        <Link
          aria-label="Back"
          className="grid size-11 shrink-0 place-items-center rounded-full border border-[#ead9c7] bg-white/55 text-[#ed802a] transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a] active:scale-[0.96] motion-reduce:transform-none"
          href={backHref}
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-[-0.02em]">{title}</h1>
      </header>
      {children}
    </main>
  );
}
