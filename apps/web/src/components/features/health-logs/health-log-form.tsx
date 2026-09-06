"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  createHealthLogSchema,
  HEALTH_LOG_IMAGE_TYPES,
  MAX_HEALTH_LOG_IMAGES,
  MAX_HEALTH_LOG_NOTE_LENGTH,
  type CreateHealthLogFormInput,
  type CreateHealthLogInput,
  type HealthLogResponse,
} from "@petmosphere/api-contracts";
import { type HealthLogObservation, type Pet } from "@petmosphere/domain";
import { ChevronDown, ImagePlus, LoaderCircle, WifiOff, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { DatePicker } from "@/components/ui/date-picker";
import { PetAvatar } from "@/components/features/pets/pet-avatar";
import { trackHealthLogEvent } from "@/lib/health-logs/analytics";
import { optimizeHealthLogImage } from "@/lib/health-logs/optimize-image";
import { HealthLogObservationOptions } from "./health-log-observation-options";
import { HealthLogStatusOptions } from "./health-log-status-options";

function elapsedMilliseconds(startedAt: number) {
  return Math.min(Date.now() - startedAt, 86_400_000);
}

export function HealthLogForm({
  existing,
  initialDate,
  onCancel,
  onConflict,
  onPetChange,
  onSaved,
  petOptions,
  selectedPetId,
}: {
  existing: HealthLogResponse | null;
  initialDate: string;
  onCancel: () => void;
  onConflict: (date: string) => void;
  onPetChange: (petId: string) => void;
  onSaved: (healthLog: HealthLogResponse) => void;
  petOptions: { pet: Pet; photoUrl: string | null }[];
  selectedPetId: string;
}) {
  const router = useRouter();
  const [startedAt] = useState(() => Date.now());
  const [images, setImages] = useState<File[]>([]);
  const [isOptimizingImages, setIsOptimizingImages] = useState(false);
  const [retainedImageIndexes, setRetainedImageIndexes] = useState(
    () => existing?.imageUrls.map((_, index) => index) ?? [],
  );
  const [imageError, setImageError] = useState<string>();
  const [serverError, setServerError] = useState<string>();
  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Australia/Melbourne";
  const {
    clearErrors,
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setValue,
  } = useForm<CreateHealthLogFormInput, unknown, CreateHealthLogInput>({
    defaultValues: {
      creationRequestId: crypto.randomUUID(),
      localDate: existing?.localDate ?? initialDate,
      note: existing?.note ?? "",
      observations: existing?.observations ?? [],
      petId: selectedPetId,
      timezone,
      ...(existing ? { status: existing.status } : {}),
    },
    mode: "onChange",
    resolver: zodResolver(createHealthLogSchema),
  });
  const [localDate, note, observations, status] = useWatch({
    control,
    name: ["localDate", "note", "observations", "status"],
  });
  const selectedPet =
    petOptions.find(({ pet }) => pet.id === selectedPetId) ?? petOptions[0];

  useEffect(() => {
    trackHealthLogEvent({ event: "health_log_started" });
  }, []);

  const previews = useMemo(
    () => images.map((image) => URL.createObjectURL(image)),
    [images],
  );
  useEffect(
    () => () => previews.forEach((preview) => URL.revokeObjectURL(preview)),
    [previews],
  );

  async function chooseImages(files: FileList | null) {
    setImageError(undefined);
    if (!files) return;
    const selected = Array.from(files);
    const remaining =
      MAX_HEALTH_LOG_IMAGES - retainedImageIndexes.length - images.length;
    if (selected.length > remaining) {
      setImageError(
        `Choose no more than ${remaining} additional ${remaining === 1 ? "photo" : "photos"}.`,
      );
      return;
    }
    if (
      selected.some(
        (image) =>
          !HEALTH_LOG_IMAGE_TYPES.includes(
            image.type as (typeof HEALTH_LOG_IMAGE_TYPES)[number],
          ),
      )
    ) {
      setImageError("Choose JPEG, PNG or WebP photos.");
      return;
    }
    setIsOptimizingImages(true);
    try {
      const optimized = await Promise.all(selected.map(optimizeHealthLogImage));
      setImages((current) => [...current, ...optimized]);
    } catch {
      setImageError(
        "We couldn’t optimise one of those photos. Choose another JPEG, PNG or WebP image.",
      );
    } finally {
      setIsOptimizingImages(false);
    }
  }

  const submit = handleSubmit(async (values) => {
    setServerError(undefined);
    if (!navigator.onLine) {
      setServerError(
        "You’re offline. Your entry is still here—reconnect and try again.",
      );
      trackHealthLogEvent({ event: "health_log_save_failed" });
      return;
    }

    const formData = new FormData();
    formData.set("creationRequestId", values.creationRequestId);
    formData.set("localDate", values.localDate);
    formData.set("note", values.note ?? "");
    formData.set("observations", JSON.stringify(values.observations));
    formData.set("petId", values.petId);
    formData.set("status", values.status);
    formData.set("timezone", values.timezone);
    if (existing) {
      formData.set("healthLogId", existing.id);
      formData.set(
        "retainedImageIndexes",
        JSON.stringify(retainedImageIndexes),
      );
    }
    images.forEach((image) => formData.append("images", image));

    try {
      const response = await fetch("/api/v1/health-logs", {
        body: formData,
        method: existing ? "PATCH" : "POST",
      });
      if (response.status === 401) {
        router.push("/auth/sign-in?next=/home");
        return;
      }
      const body: unknown = await response.json();
      if (response.status === 409) {
        trackHealthLogEvent({ event: "health_log_save_failed" });
        onConflict(values.localDate);
        return;
      }
      if (!response.ok) {
        const message =
          typeof body === "object" &&
          body !== null &&
          "message" in body &&
          typeof body.message === "string"
            ? body.message
            : "We could not save this health log. Try again.";
        setServerError(message);
        trackHealthLogEvent({ event: "health_log_save_failed" });
        return;
      }

      const healthLog = body as HealthLogResponse;
      trackHealthLogEvent({
        event: "health_log_completed",
        imageCount: healthLog.imageUrls.length,
        optionalFieldCount:
          Number(Boolean(values.note?.trim())) +
          Number(values.observations.length > 0) +
          Number(healthLog.imageUrls.length > 0),
        timeToCompleteMs: elapsedMilliseconds(startedAt),
      });
      onSaved(healthLog);
    } catch {
      setServerError(
        "We couldn’t reach Petmosphere. Your entry is still here—try again when you’re connected.",
      );
      trackHealthLogEvent({ event: "health_log_save_failed" });
    }
  });

  return (
    <form className="flex flex-col gap-6 pb-8" noValidate onSubmit={submit}>
      {/* pet-context */}
      <label className="block text-[14px] font-semibold text-[#7a7a7a]">
        Pet
        <span className="relative mt-2 flex min-h-16 items-center gap-3 rounded-2xl border border-[#f0e6d8] bg-white/60 px-3 normal-case focus-within:border-[#ed802a] focus-within:ring-1 focus-within:ring-[#ed802a]">
          {selectedPet ? (
            <>
              <PetAvatar
                className="size-11 shrink-0 rounded-full bg-[#f0e6d8]"
                name={selectedPet.pet.name}
                photoUrl={selectedPet.photoUrl}
                species={selectedPet.pet.species}
              />
              <span className="min-w-0 flex-1 truncate text-base font-bold text-[#2d2d2d]">
                {selectedPet.pet.name}
              </span>
              {petOptions.length > 1 && !existing ? (
                <ChevronDown
                  aria-hidden="true"
                  className="size-5 text-[#7a7a7a]"
                />
              ) : null}
            </>
          ) : null}
          <select
            aria-label="Pet"
            className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-default"
            disabled={Boolean(existing) || petOptions.length < 2}
            onChange={(event) => onPetChange(event.target.value)}
            value={selectedPetId}
          >
            {petOptions.map(({ pet }) => (
              <option key={pet.id} value={pet.id}>
                {pet.name}
              </option>
            ))}
          </select>
        </span>
      </label>

      {/* date-picker-section */}
      <div className="flex flex-col gap-1.5">
        <span className="pb-1 text-[14px] font-semibold text-[#7a7a7a]">
          Date
        </span>
        <DatePicker
          onChange={(date) =>
            setValue("localDate", date, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          value={localDate}
        />
        {errors.localDate ? (
          <p className="text-sm text-red-600" role="alert">
            {errors.localDate.message}
          </p>
        ) : null}
      </div>

      {/* mood-section */}
      <div className="flex flex-col gap-0">
        <span className="mb-2 block text-[14px] font-semibold text-[#7a7a7a]">
          Mood
        </span>
        <HealthLogStatusOptions
          {...(errors.status?.message ? { error: errors.status.message } : {})}
          onChange={(value) => {
            if (value !== status) setValue("observations", []);
            setValue("status", value, {
              shouldDirty: true,
              shouldValidate: true,
            });
            clearErrors("status");
          }}
          petName={selectedPet?.pet.name ?? "your pet"}
          value={status}
        />
      </div>

      {/* tags-section */}
      {status ? (
        <HealthLogObservationOptions
          onChange={(value: HealthLogObservation[]) =>
            setValue("observations", value, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          status={status}
          value={observations ?? []}
        />
      ) : null}

      {/* photos-section */}
      <fieldset>
        <legend className="mb-2 block text-[14px] font-semibold text-[#7a7a7a]">
          Photos
        </legend>
        <div
          className={`grid gap-3 ${retainedImageIndexes.length + images.length > 0 ? "grid-cols-4" : "grid-cols-1"}`}
        >
          {existing?.imageUrls.map((url, index) =>
            retainedImageIndexes.includes(index) ? (
              <div
                className="relative aspect-square overflow-hidden rounded-2xl border border-[#f0e6d8]"
                key={url}
              >
                <Image
                  alt={`Saved health log photo ${index + 1}`}
                  className="object-cover"
                  fill
                  sizes="80px"
                  src={url}
                  unoptimized
                />
                <button
                  aria-label={`Remove saved photo ${index + 1}`}
                  className="absolute top-1 right-1 grid size-9 place-items-center rounded-full bg-stone-950/70 text-white"
                  onClick={() =>
                    setRetainedImageIndexes((current) =>
                      current.filter((item) => item !== index),
                    )
                  }
                  type="button"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              </div>
            ) : null,
          )}
          {previews.map((url, index) => (
            <div
              className="relative aspect-square overflow-hidden rounded-2xl border border-[#f0e6d8]"
              key={url}
            >
              <Image
                alt={`Selected health log photo ${index + 1}`}
                className="object-cover"
                fill
                sizes="80px"
                src={url}
                unoptimized
              />
              <button
                aria-label={`Remove selected photo ${index + 1}`}
                className="absolute top-1 right-1 grid size-9 place-items-center rounded-full bg-stone-950/70 text-white"
                onClick={() =>
                  setImages((current) =>
                    current.filter((_, imageIndex) => imageIndex !== index),
                  )
                }
                type="button"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>
          ))}
          {retainedImageIndexes.length + images.length <
          MAX_HEALTH_LOG_IMAGES ? (
            <label
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-[#aaa095] bg-white/60 text-center font-medium text-[#7a7a7a] focus-within:outline-2 focus-within:outline-[#ed802a] ${retainedImageIndexes.length + images.length > 0 ? "aspect-square flex-col text-sm" : "min-h-20 w-full"}`}
              htmlFor="health-log-images"
            >
              <ImagePlus aria-hidden="true" className="size-6 text-[#7a7a7a]" />
              <span>Add photos</span>
              <input
                accept={HEALTH_LOG_IMAGE_TYPES.join(",")}
                className="sr-only"
                disabled={isOptimizingImages}
                id="health-log-images"
                multiple
                onChange={(event) => {
                  void chooseImages(event.target.files);
                  event.currentTarget.value = "";
                }}
                type="file"
              />
            </label>
          ) : null}
        </div>
        {imageError ? (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {imageError}
          </p>
        ) : null}
        <p className="mt-2 text-xs text-[#aaa095]">
          {isOptimizingImages
            ? "Optimising photos on this device…"
            : "Up to four private photos · larger photos are optimised before upload"}
        </p>
      </fieldset>

      {/* note-section */}
      <div>
        <span
          aria-hidden="true"
          className="mb-2 block text-[14px] font-semibold text-[#7a7a7a]"
        >
          Note
        </span>
        <label className="sr-only" htmlFor="health-log-note">
          Add a note (optional)
        </label>
        <textarea
          {...register("note")}
          aria-invalid={Boolean(errors.note)}
          className="min-h-[120px] w-full resize-y rounded-2xl border border-[#f0e6d8] bg-white/60 p-4 text-[15px] leading-[22px] text-[#2d2d2d] outline-none placeholder:text-[#aaa095] focus:border-[#ed802a] focus:ring-4 focus:ring-[#ed802a]/10"
          id="health-log-note"
          maxLength={MAX_HEALTH_LOG_NOTE_LENGTH}
          placeholder="Add a note…"
        />
        <span className="mt-1 block text-right text-xs text-[#aaa095]">
          {note?.length ?? 0}/{MAX_HEALTH_LOG_NOTE_LENGTH}
        </span>
      </div>

      {serverError ? (
        <div
          className="rounded-2xl border border-[#efb3ae] bg-[#fff0ef] p-4 text-sm text-[#9f342d]"
          role="alert"
        >
          <div className="flex gap-3">
            <WifiOff aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            <p>{serverError}</p>
          </div>
        </div>
      ) : null}

      {/* primary-action-container */}
      <div className="pt-1">
        <button
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#65bcb5] text-base font-bold text-[#fdf8f2] transition-transform duration-150 ease-out enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
          disabled={!status || !localDate || isSubmitting || isOptimizingImages}
          type="submit"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle
                aria-hidden="true"
                className="size-5 animate-spin"
              />
              Saving…
            </>
          ) : existing ? (
            "Save changes"
          ) : (
            "Save"
          )}
        </button>
        <button
          className="mt-6 min-h-11 w-full text-[15px] font-semibold text-[#7a7a7a] active:scale-[0.98]"
          onClick={onCancel}
          type="button"
        >
          {existing ? "Cancel" : "Skip"}
        </button>
      </div>
    </form>
  );
}
