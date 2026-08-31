import Image from "next/image";
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
        <Link aria-label="Petmosphere home" className="mx-auto block w-fit" href="/">
          <Image
            alt="Petmosphere"
            className="rounded-[22%] shadow-sm"
            height={52}
            src="/app-icon.svg"
            width={52}
          />
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
