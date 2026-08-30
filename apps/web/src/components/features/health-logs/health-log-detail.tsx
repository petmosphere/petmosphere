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

// Pill colours for observation tags, keyed by status
const observationPillClass: Record<HealthLogResponse["status"], string> = {
  concerned: "bg-[#ED802A] text-[#FDF8F2]",
  doing_well: "bg-[#65BCB5] text-[#FDF8F2]",
  something_different: "bg-[#CD9255] text-[#FDF8F2]",
};

// Status label text colours matching pill palette
const statusTextClass: Record<HealthLogResponse["status"], string> = {
  concerned: "text-[#ED802A]",
  doing_well: "text-[#65BCB5]",
  something_different: "text-[#CD9255]",
};

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
    <section className="flex flex-col gap-4 px-6 pt-2 pb-20">
      {/* top-nav-row: back | date | edit + trash */}
      <header className="flex items-center justify-between">
        <button
          aria-label="Back to health diary"
          className="grid size-6 place-items-center active:scale-[0.97]"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft aria-hidden="true" className="size-5 text-[#2D2D2D]" />
        </button>

        <p className="text-sm font-semibold text-[#7A7A7A]">
          {new Intl.DateTimeFormat("en-AU", { dateStyle: "medium" }).format(
            new Date(`${healthLog.localDate}T12:00:00`),
          )}
        </p>

        <div className="flex gap-4">
          <button
            aria-label="Edit health log"
            className="grid size-4 place-items-center text-[#7A7A7A] active:scale-[0.97]"
            onClick={onEdit}
            type="button"
          >
            <Pencil aria-hidden="true" className="size-4" />
          </button>
          <button
            aria-label="Delete health log"
            className="grid size-4 place-items-center text-[#7A7A7A] active:scale-[0.97]"
            onClick={() => setConfirmDelete(true)}
            type="button"
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </button>
        </div>
      </header>

      {/* pet-row: avatar + name */}
      <div className="flex items-center gap-3">
        <PetAvatar
          className="size-10 shrink-0 rounded-full"
          name={pet.name}
          photoUrl={photoUrl}
          species={pet.species}
        />
        <p className="text-base font-bold text-[#2D2D2D]">{pet.name}</p>
      </div>

      {/* status-display-container: emoji + label */}
      <div className="flex items-center gap-3 pt-4">
        <span aria-hidden="true" className="text-5xl leading-none">
          {mood.emoji}
        </span>
        <p
          className={`text-2xl font-bold ${statusTextClass[healthLog.status]}`}
        >
          {mood.label}
        </p>
      </div>

      {/* tags-section: "What was noticed" + observation pills */}
      {healthLog.observations.length > 0 ? (
        <div className="flex flex-col gap-3 pt-8">
          <p className="text-sm font-medium text-[#7A7A7A]">What was noticed</p>
          <div className="flex flex-wrap gap-2">
            {healthLog.observations.map((observation) => (
              <span
                className={`rounded-full px-3 py-2 text-[13px] font-semibold ${observationPillClass[healthLog.status]}`}
                key={observation}
              >
                <span aria-hidden="true" className="mr-1">
                  {healthLogObservationDetails[observation].emoji}
                </span>
                {healthLogObservationDetails[observation].label}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* photos-section */}
      {healthLog.imageUrls.length > 0 ? (
        <div className="flex flex-col gap-3 pt-6">
          <p className="text-sm font-medium text-[#7A7A7A]">Photos</p>
          <div className="flex flex-row gap-3">
            {healthLog.imageUrls.map((url, index) => (
              <div
                className="relative size-24 shrink-0 overflow-hidden rounded-2xl border border-[#F0E6D8]"
                key={url}
              >
                <Image
                  alt={`Health log photo ${index + 1}`}
                  className="object-cover"
                  fill
                  sizes="96px"
                  src={url}
                  unoptimized
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* note-section */}
      {healthLog.note ? (
        <div className="flex flex-col gap-3 pt-6">
          <p className="text-sm font-medium text-[#7A7A7A]">Note</p>
          <div className="rounded-xl border border-[#F0E6D8] bg-white/60 p-4">
            <p className="text-[15px] leading-[22px] whitespace-pre-wrap text-[#2D2D2D]">
              {healthLog.note}
            </p>
          </div>
        </div>
      ) : null}

      {/* footer: logged-at timestamp */}
      <div className="pt-8">
        <p className="text-xs text-[#AAAAAA]">
          Logged at{" "}
          {new Intl.DateTimeFormat("en-AU", {
            hour: "numeric",
            hour12: true,
            minute: "2-digit",
            timeZone: healthLog.derivationTimezone,
          }).format(new Date(healthLog.createdAt))}
        </p>
      </div>

      {/* delete confirmation dialog */}
      {confirmDelete ? (
        <div
          aria-labelledby="delete-log-title"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-end bg-stone-950/55 p-4 sm:place-items-center"
          role="dialog"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#ffebee] text-[#ffa959]">
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
                className="min-h-12 rounded-2xl bg-[#ffa959] font-semibold text-white disabled:opacity-60"
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
