"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeletePetButton({ petId }: { petId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string>();

  async function remove() {
    setDeleting(true);
    setError(undefined);
    try {
      const response = await fetch(`/api/v1/pets/${petId}`, {
        method: "DELETE",
      });
      if (response.status === 401) {
        router.replace(
          `/auth/sign-in?next=${encodeURIComponent(`/pets/${petId}`)}`,
        );
        return;
      }
      if (!response.ok) {
        setError("We could not delete this pet. Try again.");
        setDeleting(false);
        return;
      }
      router.replace("/home");
      router.refresh();
    } catch {
      setError("Check your connection and try again.");
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        aria-label="Delete pet"
        className="grid size-11 place-items-center rounded-full text-red-600 transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-red-500 active:scale-[0.97]"
        onClick={() => {
          setError(undefined);
          setConfirming(true);
        }}
        type="button"
      >
        <Trash2 aria-hidden="true" className="size-5" />
      </button>

      {confirming ? (
        <div
          aria-labelledby="delete-pet-title"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-end bg-stone-950/55 p-4 sm:place-items-center"
          onClick={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setConfirming(false);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape" && !deleting) setConfirming(false);
          }}
          role="dialog"
        >
          <div className="w-full max-w-sm rounded-3xl border border-[#f0e6d8] bg-[#fdf8f2] p-6 text-center shadow-2xl">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#ffebee] text-[#ef7070]">
              <Trash2 aria-hidden="true" className="size-6" />
            </span>
            <h2 className="mt-4 text-2xl font-bold" id="delete-pet-title">
              Delete this pet?
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              This permanently removes the pet profile, health logs, reminders,
              weight history and photos. This cannot be undone.
            </p>
            {error ? (
              <p className="mt-3 text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                autoFocus
                className="min-h-12 rounded-2xl border border-[#e8d0b3] bg-white font-semibold transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a] active:scale-[0.97] disabled:opacity-60"
                disabled={deleting}
                onClick={() => setConfirming(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="min-h-12 rounded-2xl bg-[#ef7070] font-semibold text-white transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ef7070] active:scale-[0.97] disabled:opacity-60"
                disabled={deleting}
                onClick={() => void remove()}
                type="button"
              >
                {deleting ? "Deleting…" : "Delete pet"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
