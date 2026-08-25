import { PawPrint } from "lucide-react";
import Link from "next/link";

export function AuthShell({
  children,
  description,
  title,
}: Readonly<{
  children: React.ReactNode;
  description: string;
  title: string;
}>) {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#fdf8f2] px-5 py-10 text-stone-950">
      <section className="w-full max-w-md rounded-[2rem] border border-[#ead9c7] bg-white/60 p-6 shadow-xl shadow-[#8b5b30]/8 sm:p-9">
        <Link
          aria-label="Petmosphere home"
          className="mx-auto flex h-13 w-13 items-center justify-center rounded-full bg-[#fffaf5] font-bold text-[#dd792d] shadow-sm"
          href="/"
        >
          <PawPrint aria-hidden="true" className="size-6" strokeWidth={1.8} />
        </Link>
        <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-balance">
          {title}
        </h1>
        <p className="mt-2 text-center leading-7 text-stone-500">
          {description}
        </p>
        {children}
      </section>
    </main>
  );
}
