import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-[#fbf7f1] px-6 py-12 text-stone-950">
      <div
        aria-hidden="true"
        className="absolute -top-24 right-[-7rem] h-72 w-72 rounded-full bg-[#e8d0b3]/70 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-32 left-[-6rem] h-80 w-80 rounded-full bg-[#87b35c]/25 blur-3xl"
      />

      <section className="relative w-full max-w-xl rounded-3xl border border-white/80 bg-white/85 p-8 text-center shadow-xl shadow-cyan-950/5 backdrop-blur sm:p-12">
        <div className="mx-auto mb-7 grid h-16 w-16 place-items-center rounded-2xl bg-[#cd9255] text-3xl shadow-lg shadow-[#8b5b30]/15">
          <span aria-hidden="true">🐾</span>
          <span className="sr-only">Petmosphere paw mark</span>
        </div>

        <p className="text-sm font-semibold tracking-[0.2em] text-[#8b5b30] uppercase">
          Petmosphere
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Your pet&apos;s health, organised.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-7 text-pretty text-slate-600 sm:text-lg">
          A calm, private place to keep your pet&apos;s care on track.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            className="flex min-h-12 items-center justify-center rounded-2xl bg-[#87b35c] px-5 font-bold text-stone-950"
            href="/auth/sign-up"
          >
            Create account
          </Link>
          <Link
            className="flex min-h-12 items-center justify-center rounded-2xl border border-[#cd9255] bg-white px-5 font-bold text-[#8b5b30]"
            href="/auth/sign-in"
          >
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
