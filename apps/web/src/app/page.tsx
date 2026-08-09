export default function HomePage() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-slate-50 px-6 py-12 text-slate-950">
      <div
        aria-hidden="true"
        className="absolute -top-24 right-[-7rem] h-72 w-72 rounded-full bg-cyan-200/50 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-32 left-[-6rem] h-80 w-80 rounded-full bg-teal-200/40 blur-3xl"
      />

      <section className="relative w-full max-w-xl rounded-3xl border border-white/80 bg-white/85 p-8 text-center shadow-xl shadow-cyan-950/5 backdrop-blur sm:p-12">
        <div className="mx-auto mb-7 grid h-16 w-16 place-items-center rounded-2xl bg-cyan-800 text-3xl shadow-lg shadow-cyan-900/15">
          <span aria-hidden="true">🐾</span>
          <span className="sr-only">Petmosphere paw mark</span>
        </div>

        <p className="text-sm font-semibold tracking-[0.2em] text-cyan-800 uppercase">
          Petmosphere
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Your pet&apos;s health, organised.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-7 text-pretty text-slate-600 sm:text-lg">
          PWA foundation is running successfully.
        </p>

        <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200">
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full bg-emerald-500"
          />
          Ready for local development
        </div>
      </section>
    </main>
  );
}
