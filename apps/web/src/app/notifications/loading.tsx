export default function NotificationsLoading() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-[393px] animate-pulse bg-[#fdf8f2] px-5 pt-8">
      <div className="h-12 rounded-2xl bg-white/60" />
      <div className="mt-12 space-y-3">
        {[1, 2, 3].map((item) => (
          <div className="h-28 rounded-2xl bg-white/60" key={item} />
        ))}
      </div>
    </main>
  );
}
