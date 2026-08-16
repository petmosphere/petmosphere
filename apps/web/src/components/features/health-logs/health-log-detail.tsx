import type { HealthLogResponse } from "@petmosphere/api-contracts";
import type { Pet } from "@petmosphere/domain";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { PetAvatar } from "@/components/features/pets/pet-avatar";
import {
  healthLogObservationDetails,
  healthLogStatusDetails,
} from "./health-log-status-options";

export function HealthLogDetail({
  healthLog,
  onBack,
  onDelete,
  onEdit,
  pet,
  photoUrl,
}: {
  healthLog: HealthLogResponse;
  onBack: () => void;
  onDelete: () => Promise<void>;
  onEdit: () => void;
  pet: Pet;
  photoUrl: string | null;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();
  const mood = healthLogStatusDetails[healthLog.status];
  const MoodIcon = mood.icon;

  async function remove() {
    setDeleting(true);
    setDeleteError(undefined);
    try {
      await onDelete();
    } catch {
      setDeleteError("We could not delete this log. Try again.");
      setDeleting(false);
    }
  }

  return (
    <section>
      <header className="flex items-center justify-between">
        <button
          aria-label="Back to health diary"
          className="grid size-11 place-items-center rounded-full bg-white active:scale-[0.97]"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft aria-hidden="true" />
        </button>
        <div className="flex gap-1">
          <button
            aria-label="Delete health log"
            className="grid size-11 place-items-center rounded-full text-stone-500 active:scale-[0.97]"
            onClick={() => setConfirmDelete(true)}
            type="button"
          >
            <Trash2 aria-hidden="true" className="size-5" />
          </button>
          <button
            aria-label="Edit health log"
            className="grid size-11 place-items-center rounded-full text-stone-500 active:scale-[0.97]"
            onClick={onEdit}
            type="button"
          >
            <Pencil aria-hidden="true" className="size-5" />
          </button>
        </div>
      </header>

      <p className="mt-6 text-stone-500">
        {new Intl.DateTimeFormat("en-AU", { dateStyle: "long" }).format(
          new Date(`${healthLog.localDate}T12:00:00`),
        )}
      </p>
      <div className="mt-7 flex items-center gap-4">
        <PetAvatar
          className="size-16"
          name={pet.name}
          photoUrl={photoUrl}
          species={pet.species}
        />
        <div>
          <h1 className="text-2xl font-bold">{pet.name}</h1>
          <p className="text-sm text-stone-500">Private health log</p>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-4 rounded-3xl bg-white p-5 shadow-sm">
        <span
          className={`grid size-16 place-items-center rounded-2xl ${mood.selectedClass}`}
        >
          <MoodIcon aria-hidden="true" className="size-9" />
        </span>
        <div>
          <p className="text-sm text-stone-500">Emotion</p>
          <p className="text-2xl font-bold">{mood.label}</p>
        </div>
      </div>

      {healthLog.observations.length > 0 ? (
        <div className="mt-7">
          <h2 className="text-lg font-bold">What was noticed</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {healthLog.observations.map((observation) => (
              <span
                className="rounded-full bg-[#ED802A] px-4 py-2 text-sm font-medium text-white"
                key={observation}
              >
                {healthLogObservationDetails[observation]}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {healthLog.imageUrls.length > 0 ? (
        <div className="mt-7">
          <h2 className="text-lg font-bold">Photos</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {healthLog.imageUrls.map((url, index) => (
              <div
                className="relative aspect-square overflow-hidden rounded-2xl"
                key={url}
              >
                <Image
                  alt={`Health log photo ${index + 1}`}
                  className="object-cover"
                  fill
                  sizes="180px"
                  src={url}
                  unoptimized
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {healthLog.note ? (
        <div className="mt-7">
          <h2 className="text-lg font-bold">Notes</h2>
          <p className="mt-3 rounded-2xl bg-white p-4 leading-6 whitespace-pre-wrap text-stone-600">
            {healthLog.note}
          </p>
        </div>
      ) : null}

      {confirmDelete ? (
        <div
          aria-labelledby="delete-log-title"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-end bg-stone-950/55 p-4 sm:place-items-center"
          role="dialog"
        >
          <div className="w-full max-w-sm rounded-3xl bg-[#fdf8f2] p-6 text-center shadow-2xl">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#fff0ef] text-[#d65952]">
              <Trash2 aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-2xl font-bold" id="delete-log-title">
              Delete this log?
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-500">
              This permanently removes the entry and its photos. This cannot be
              undone.
            </p>
            {deleteError ? (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {deleteError}
              </p>
            ) : null}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                className="min-h-12 rounded-2xl border border-[#e8d0b3] bg-white font-semibold"
                disabled={deleting}
                onClick={() => setConfirmDelete(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="min-h-12 rounded-2xl bg-[#d65952] font-semibold text-white disabled:opacity-60"
                disabled={deleting}
                onClick={() => void remove()}
                type="button"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
