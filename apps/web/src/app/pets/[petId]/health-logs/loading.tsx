export default function HealthDiaryLoading() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-md bg-[#fdf8f2] px-6 py-8">
      <div
        aria-label="Loading health diary"
        className="animate-pulse space-y-6"
        role="status"
      >
        <div className="size-11 rounded-full bg-white" />
        <div className="h-12 w-64 rounded-full bg-[#ead9c7]" />
        <div className="h-96 rounded-3xl bg-white" />
      </div>
    </main>
  );
}
