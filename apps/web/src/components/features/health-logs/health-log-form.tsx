"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  createHealthLogSchema,
  HEALTH_LOG_IMAGE_TYPES,
  MAX_HEALTH_LOG_IMAGE_BYTES,
  MAX_HEALTH_LOG_IMAGES,
  MAX_HEALTH_LOG_NOTE_LENGTH,
  type CreateHealthLogFormInput,
  type CreateHealthLogInput,
  type HealthLogResponse,
} from "@petmosphere/api-contracts";
import {
  deriveLocalDate,
  type HealthLogObservation,
  type Pet,
} from "@petmosphere/domain";
import {
  CalendarDays,
  ImagePlus,
  LoaderCircle,
  Tags,
  WifiOff,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { PetAvatar } from "@/components/features/pets/pet-avatar";
import { trackHealthLogEvent } from "@/lib/health-logs/analytics";
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
  onSaved,
  petId,
  petName,
  petPhotoUrl,
  petSpecies,
}: {
  existing: HealthLogResponse | null;
  initialDate: string;
  onCancel: () => void;
  onConflict: (date: string) => void;
  onSaved: (healthLog: HealthLogResponse) => void;
  petId: string;
  petName: string;
  petPhotoUrl: string | null;
  petSpecies: Pet["species"];
}) {
  const router = useRouter();
  const [startedAt] = useState(() => Date.now());
  const [images, setImages] = useState<File[]>([]);
  const [retainedImageIndexes, setRetainedImageIndexes] = useState(
    () => existing?.imageUrls.map((_, index) => index) ?? [],
  );
  const [imageError, setImageError] = useState<string>();
  const [serverError, setServerError] = useState<string>();
  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Australia/Melbourne";
  const today = deriveLocalDate(new Date(), timezone);
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
      petId,
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

  function chooseImages(files: FileList | null) {
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
    if (selected.some((image) => image.size > MAX_HEALTH_LOG_IMAGE_BYTES)) {
      setImageError("Choose photos that are each smaller than 4 MB.");
      return;
    }
    setImages((current) => [...current, ...selected]);
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
    <form className="pb-8" noValidate onSubmit={submit}>
      <div className="mb-5">
        <div className="flex items-center justify-between gap-4">
          <label
            className="text-sm font-medium text-[#7a7a7a]"
            htmlFor="health-log-date"
          >
            Log date
          </label>
          <div className="relative">
            <input
              {...register("localDate")}
              aria-invalid={Boolean(errors.localDate)}
              className="min-h-12 w-[174px] appearance-none rounded-2xl border border-[#e8d0b3] bg-white py-2 pr-11 pl-4 text-[15px] font-semibold text-[#2d2d2d] tabular-nums shadow-sm transition-[border-color,box-shadow] outline-none focus:border-[#ed802a] focus:ring-4 focus:ring-[#ed802a]/10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
              id="health-log-date"
              max={today}
              type="date"
            />
            <CalendarDays
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-[#ed802a]"
            />
          </div>
        </div>
        {errors.localDate ? (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {errors.localDate.message}
          </p>
        ) : null}
      </div>

      <section className="rounded-2xl bg-[#fdf8f2] px-5 py-5 shadow-[0_4px_16px_rgba(205,146,85,0.08)]">
        <div className="mb-4 flex items-center gap-3">
          <PetAvatar
            className="size-10 border border-[#ed802a]"
            name={petName}
            photoUrl={petPhotoUrl}
            species={petSpecies}
          />
          <h2 className="text-lg font-medium">How is {petName} today?</h2>
        </div>
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
          petName={petName}
          value={status}
        />
      </section>

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

      <fieldset className="mt-8">
        <legend className="sr-only">Add photos (optional)</legend>
        <div
          className={`grid gap-3 ${retainedImageIndexes.length + images.length > 0 ? "grid-cols-3" : "grid-cols-1"}`}
        >
          {existing?.imageUrls.map((url, index) =>
            retainedImageIndexes.includes(index) ? (
              <div
                className="relative aspect-square overflow-hidden rounded-2xl"
                key={url}
              >
                <Image
                  alt={`Saved health log photo ${index + 1}`}
                  className="object-cover"
                  fill
                  sizes="112px"
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
              className="relative aspect-square overflow-hidden rounded-2xl"
              key={url}
            >
              <Image
                alt={`Selected health log photo ${index + 1}`}
                className="object-cover"
                fill
                sizes="112px"
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
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#d7c3b0] bg-[#fdf8f2] text-center font-medium text-[#7a7a7a] focus-within:outline-2 focus-within:outline-[#ed802a] ${retainedImageIndexes.length + images.length > 0 ? "aspect-square min-h-24 flex-col text-sm" : "min-h-[76px] w-full"}`}
              htmlFor="health-log-images"
            >
              <ImagePlus aria-hidden="true" className="size-6" />
              <span>Add photos</span>
              <input
                accept={HEALTH_LOG_IMAGE_TYPES.join(",")}
                className="sr-only"
                id="health-log-images"
                multiple
                onChange={(event) => {
                  chooseImages(event.target.files);
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
          Up to four private photos · 4 MB each
        </p>
      </fieldset>

      <div className="relative mt-6">
        <label className="sr-only" htmlFor="health-log-note">
          Add a note (optional)
        </label>
        <Tags
          aria-hidden="true"
          className="pointer-events-none absolute top-5 left-4 size-5 text-[#7a7a7a]"
        />
        <textarea
          {...register("note")}
          aria-invalid={Boolean(errors.note)}
          className="min-h-20 w-full resize-y rounded-xl border border-[#e8d0b3] bg-[#fdf8f2] py-4 pr-4 pl-12 leading-6 outline-none placeholder:text-[#aaa095] focus:border-[#ed802a] focus:ring-4 focus:ring-[#ed802a]/10"
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
          className="mt-6 rounded-2xl border border-[#efb3ae] bg-[#fff0ef] p-4 text-sm text-[#9f342d]"
          role="alert"
        >
          <div className="flex gap-3">
            <WifiOff aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            <p>{serverError}</p>
          </div>
        </div>
      ) : null}

      <button
        className="mt-8 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#65bcb5] text-base font-semibold text-[#fdf8f2] shadow-[0_8px_24px_rgba(205,146,85,0.08)] transition-transform duration-150 ease-out enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none"
        disabled={!status || !localDate || isSubmitting}
        type="submit"
      >
        {isSubmitting ? (
          <>
            <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
            Saving…
          </>
        ) : existing ? (
          "Save changes"
        ) : (
          "Save"
        )}
      </button>
      <button
        className="mt-6 min-h-11 w-full text-[15px] font-medium text-[#7a7a7a] underline underline-offset-4 active:scale-[0.98]"
        onClick={onCancel}
        type="button"
      >
        {existing ? "Cancel" : "Skip"}
      </button>
    </form>
  );
}
