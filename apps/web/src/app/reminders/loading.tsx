export default function RemindersLoading() {
  return (
    <main
      aria-label="Loading reminders"
      className="mx-auto min-h-dvh w-full max-w-md animate-pulse bg-[#fdf8f2] px-6 pt-8"
      role="status"
    >
      <div className="h-10 w-44 rounded-full bg-[#ead9c7]" />
      <div className="mt-8 h-12 rounded-full bg-[#f0e6d8]" />
      <div className="mt-8 space-y-3">
        <div className="h-24 rounded-3xl bg-[#fffaf5]" />
        <div className="h-24 rounded-3xl bg-[#fffaf5]" />
      </div>
    </main>
  );
}
