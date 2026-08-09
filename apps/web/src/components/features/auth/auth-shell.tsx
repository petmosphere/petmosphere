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
    <main className="grid min-h-dvh place-items-center bg-[#fbf7f1] px-5 py-10 text-stone-950">
      <section className="w-full max-w-md rounded-[2rem] border border-[#e8d0b3] bg-white p-6 shadow-xl shadow-[#8b5b30]/8 sm:p-9">
        <Link
          aria-label="Petmosphere home"
          className="inline-flex items-center gap-2 font-bold text-[#8b5b30]"
          href="/"
        >
          <span aria-hidden="true" className="text-2xl">
            🐾
          </span>
          Petmosphere
        </Link>
        <h1 className="mt-7 text-3xl font-bold tracking-tight text-balance">
          {title}
        </h1>
        <p className="mt-3 leading-7 text-stone-600">{description}</p>
        {children}
      </section>
    </main>
  );
}
