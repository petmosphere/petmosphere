export default function AuthLoading() {
  return (
    <main
      aria-label="Loading..."
      className="min-h-dvh animate-pulse bg-[#fdf8f2] motion-reduce:animate-none"
      role="status"
    >
      <section className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pt-8 pb-6">
        {/* back button slot */}
        <span aria-hidden="true" className="h-11" />

        {/* logo */}
        <div className="mx-auto mt-5 size-[52px] rounded-[22%] bg-[#ead9c7]" />

        {/* title */}
        <div className="mx-auto mt-5 h-8 w-44 rounded-full bg-[#ead9c7]" />
        {/* subtitle */}
        <div className="mx-auto mt-2 h-4 w-56 rounded-full bg-[#f0e6d8]" />

        {/* inputs */}
        <div className="mt-8 h-14 rounded-xl bg-[#f0e6d8]" />
        <div className="mt-3 h-14 rounded-xl bg-[#f0e6d8]" />

        {/* submit button */}
        <div className="mt-3 h-14 rounded-xl bg-[#ed802a]/30" />
      </section>
    </main>
  );
}
