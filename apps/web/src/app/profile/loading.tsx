export default function ProfileLoading() {
  return (
    <main
      aria-label="Loading profile"
      className="mx-auto min-h-dvh w-full max-w-[393px] animate-pulse bg-[#fdf8f2] px-6 pt-8"
      role="status"
    >
      <div className="h-8 w-28 rounded-full bg-[#ead9c7]" />
      <div className="mt-6 h-72 rounded-3xl bg-white/60" />
      <div className="mt-6 h-32 rounded-3xl bg-white/60" />
      <div className="mt-6 h-36 rounded-3xl bg-white/60" />
    </main>
  );
}
