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
} from "@petmosphere/domain";
import { CalendarDays, Camera, LoaderCircle, WifiOff, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

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
}: {
  existing: HealthLogResponse | null;
  initialDate: string;
  onCancel: () => void;
  onConflict: (date: string) => void;
  onSaved: (healthLog: HealthLogResponse) => void;
  petId: string;
  petName: string;
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
      <div className="mb-7">
        <label className="text-lg font-bold" htmlFor="health-log-date">
          Date{" "}
          <span aria-hidden="true" className="text-red-600">
            *
          </span>
        </label>
        <div className="relative mt-3">
          <CalendarDays
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#ed802a]"
          />
          <input
            {...register("localDate")}
            aria-invalid={Boolean(errors.localDate)}
            className="min-h-14 w-full rounded-2xl border border-[#ead9c7] bg-white pr-4 pl-12 font-medium outline-none focus:border-[#ed802a] focus:ring-4 focus:ring-[#ed802a]/10"
            id="health-log-date"
            max={today}
            type="date"
          />
        </div>
        {errors.localDate ? (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {errors.localDate.message}
          </p>
        ) : null}
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

      <div className="mt-7">
        <div className="flex items-end justify-between gap-3">
          <label className="text-lg font-bold" htmlFor="health-log-note">
            Add notes{" "}
            <span className="font-normal text-stone-500">(optional)</span>
          </label>
          <span className="text-xs text-stone-400">
            {note?.length ?? 0}/{MAX_HEALTH_LOG_NOTE_LENGTH}
          </span>
        </div>
        <textarea
          {...register("note")}
          aria-invalid={Boolean(errors.note)}
          className="mt-3 min-h-32 w-full resize-y rounded-2xl border border-[#ead9c7] bg-white p-4 leading-6 outline-none focus:border-[#ed802a] focus:ring-4 focus:ring-[#ed802a]/10"
          id="health-log-note"
          maxLength={MAX_HEALTH_LOG_NOTE_LENGTH}
          placeholder="Anything else you noticed?"
        />
      </div>

      <fieldset className="mt-7">
        <legend className="text-lg font-bold">
          Add photos{" "}
          <span className="font-normal text-stone-500">(optional)</span>
        </legend>
        <p className="mt-1 text-sm text-stone-500">
          Up to four private photos · 4 MB each
        </p>
        <div className="mt-3 grid grid-cols-3 gap-3">
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
              className="grid aspect-square min-h-24 cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-[#d7b28b] bg-white text-center text-sm font-medium text-[#a96225] focus-within:outline-2 focus-within:outline-[#ed802a]"
              htmlFor="health-log-images"
            >
              <span>
                <Camera aria-hidden="true" className="mx-auto mb-1 size-6" />
                Choose photos
              </span>
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
      </fieldset>

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

      <div className="mt-7 grid grid-cols-[1fr_2fr] gap-3">
        <button
          className="min-h-14 rounded-2xl border border-[#e8d0b3] bg-white font-semibold text-stone-600 active:scale-[0.98]"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
        <button
          className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#f47b20] px-5 font-semibold text-white shadow-lg shadow-[#f47b20]/20 transition-transform duration-150 ease-out enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none"
          disabled={!status || !localDate || isSubmitting}
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
            "Save log"
          )}
        </button>
      </div>
    </form>
  );
}
