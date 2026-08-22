"use client";

export default function RemindersError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-md place-items-center bg-[#fdf8f2] px-6 text-center">
      <div>
        <h1 className="text-2xl font-bold">Reminders could not load</h1>
        <p className="mt-3 text-stone-500">
          Check your connection and try again. Your reminder details are still
          private and unchanged.
        </p>
        <button
          className="mt-6 min-h-12 rounded-2xl bg-[#ed802a] px-6 font-semibold text-white"
          onClick={reset}
          type="button"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
