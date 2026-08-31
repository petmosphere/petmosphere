"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  MAX_PET_PHOTO_BYTES,
  PET_PHOTO_TYPES,
  updatePetSchema,
  type UpdatePetFormInput,
  type UpdatePetInput,
} from "@petmosphere/api-contracts";
import type { Pet, PetDesexedStatus, PetSex } from "@petmosphere/domain";
import { ArrowLeft, CalendarDays, Camera } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { BreedSelect } from "./breed-select";

export function EditPetForm({
  pet,
  photoUrl,
}: {
  pet: Pet;
  photoUrl: string | null;
}) {
  const router = useRouter();
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string>();
  const [serverError, setServerError] = useState<string>();
  const [birthDateDisplay, setBirthDateDisplay] = useState(() => {
    const v = pet.birthDate;
    if (!v) return "";
    const [y, m, d] = v.split("-");
    return d && m && y ? `${d}/${m}/${y}` : "";
  });
  const [birthDateFormatError, setBirthDateFormatError] = useState<
    string | undefined
  >();
  const {
    control,
    formState: { errors, isSubmitting, isValid },
    handleSubmit,
    register,
    setValue,
  } = useForm<UpdatePetFormInput, unknown, UpdatePetInput>({
    defaultValues: {
      approximateAge: pet.approximateAge ?? "",
      birthDate: pet.birthDate ?? "",
      breed: pet.breed ?? "",
      desexedStatus: pet.desexedStatus ?? "",
      name: pet.name,
      sex: pet.sex ?? "",
      species: pet.species,
      weightKg: pet.weightKg?.toString() ?? "",
    },
    mode: "onChange",
    resolver: zodResolver(updatePetSchema),
  });
  const [sex, desexedStatus] = useWatch({
    control,
    name: ["sex", "desexedStatus"],
  });
  const photoPreview = useMemo(
    () => (photo ? URL.createObjectURL(photo) : (photoUrl ?? undefined)),
    [photo, photoUrl],
  );

  useEffect(
    () => () => {
      if (photo && photoPreview) URL.revokeObjectURL(photoPreview);
    },
    [photo, photoPreview],
  );

  function selectPhoto(file: File | undefined) {
    setPhotoError(undefined);
    if (!file) return;
    if (
      !PET_PHOTO_TYPES.includes(file.type as (typeof PET_PHOTO_TYPES)[number])
    ) {
      setPhotoError("Choose a JPEG, PNG or WebP photo.");
      return;
    }
    if (file.size > MAX_PET_PHOTO_BYTES) {
      setPhotoError("Choose a photo smaller than 4 MB.");
      return;
    }
    setPhoto(file);
  }

  const submit = handleSubmit(async (values) => {
    setServerError(undefined);
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined) formData.set(key, value.toString());
    });
    if (photo) formData.set("photo", photo);

    try {
      const response = await fetch(`/api/v1/pets/${pet.id}`, {
        body: formData,
        method: "PATCH",
      });
      if (response.status === 401) {
        router.replace(
          `/auth/sign-in?next=${encodeURIComponent(`/pets/${pet.id}/edit`)}`,
        );
        return;
      }
      const body: unknown = await response.json();
      if (!response.ok) {
        setServerError(
          typeof body === "object" &&
            body !== null &&
            "message" in body &&
            typeof body.message === "string"
            ? body.message
            : "We could not update your pet. Try again.",
        );
        return;
      }
      router.replace(`/pets/${pet.id}`);
      router.refresh();
    } catch {
      setServerError(
        "Check your connection and try again. Your details are still here.",
      );
    }
  });

  const inputClass =
    "min-h-[52px] w-full rounded-xl border border-[#f0e6d8] bg-white/60 px-4 text-base text-[#2d2d2d] outline-none transition-[border-color,box-shadow] focus:border-[#ed802a] focus:ring-4 focus:ring-[#ed802a]/10";

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md bg-[#fdf8f2] px-6 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] text-[#2d2d2d] shadow-xl shadow-stone-900/5">
      <form id="edit-pet-form" noValidate onSubmit={submit}>
        <header className="flex min-h-11 items-center justify-between">
          <Link
            aria-label="Back to pet profile"
            className="grid size-11 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-[#ed802a]"
            href={`/pets/${pet.id}`}
          >
            <ArrowLeft aria-hidden="true" className="size-6" />
          </Link>
          <button
            className="min-h-11 px-1 text-lg font-medium text-[#ed802a] disabled:cursor-not-allowed disabled:opacity-45"
            disabled={
              isSubmitting ||
              !isValid ||
              Boolean(photoError) ||
              Boolean(birthDateFormatError)
            }
            type="submit"
          >
            {isSubmitting ? "Saving…" : "Save"}
          </button>
        </header>

        <h1 className="mt-5 text-2xl font-bold">Edit Pet Profile</h1>

        <div className="mt-6 text-center">
          <label
            className="relative mx-auto block size-24 cursor-pointer rounded-full border-2 border-[#ed802a] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#ed802a]"
            htmlFor="edit-pet-photo"
          >
            <span className="absolute inset-1 overflow-hidden rounded-full bg-[#fff0e1]">
              {photoPreview ? (
                <Image
                  alt={`${pet.name}'s profile photo preview`}
                  className="object-cover"
                  fill
                  sizes="88px"
                  src={photoPreview}
                  unoptimized
                />
              ) : (
                <span className="grid size-full place-items-center text-[#ed802a]">
                  <Camera aria-hidden="true" className="size-8" />
                </span>
              )}
            </span>
            <span className="absolute right-[-2px] bottom-[-2px] grid size-8 place-items-center rounded-full bg-[#fdf8f2] text-[#ed802a] shadow-sm">
              <Camera aria-hidden="true" className="size-4" strokeWidth={2} />
            </span>
            <input
              accept={PET_PHOTO_TYPES.join(",")}
              className="sr-only"
              id="edit-pet-photo"
              onChange={(event) => selectPhoto(event.target.files?.[0])}
              type="file"
            />
          </label>
          <label
            className="mt-3 inline-flex min-h-11 cursor-pointer items-center text-sm text-[#ed802a]"
            htmlFor="edit-pet-photo"
          >
            Change photo
          </label>
          {photoError ? (
            <p className="text-sm text-red-600" role="alert">
              {photoError}
            </p>
          ) : null}
        </div>

        <div className="mt-5 space-y-5">
          <Field label="Pet’s name" error={errors.name?.message} id="edit-name">
            <input
              {...register("name")}
              className={inputClass}
              id="edit-name"
            />
          </Field>

          <Field label="Breed" error={errors.breed?.message} id="edit-breed">
            <Controller
              control={control}
              name="breed"
              render={({ field }) => (
                <BreedSelect
                  disabled={false}
                  id="edit-breed"
                  onChange={field.onChange}
                  species={pet.species}
                  value={field.value ?? ""}
                />
              )}
            />
          </Field>

          <Field
            label="Date of birth"
            error={birthDateFormatError ?? errors.birthDate?.message}
            id="edit-birth-date"
          >
            <div className="relative">
              <CalendarDays
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#7a7a7a]"
              />
              <input
                className={`${inputClass} pl-12`}
                id="edit-birth-date"
                inputMode="numeric"
                onChange={(e) => {
                  const display = e.target.value;
                  setBirthDateDisplay(display);
                  if (display === "") {
                    setBirthDateFormatError(undefined);
                    setValue("birthDate", "", { shouldValidate: true });
                    return;
                  }
                  const match = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
                  if (match) {
                    setBirthDateFormatError(undefined);
                    setValue(
                      "birthDate",
                      `${match[3]}-${match[2]}-${match[1]}`,
                      { shouldValidate: true },
                    );
                    setValue("approximateAge", "");
                  } else {
                    setBirthDateFormatError(
                      "Please enter the correct format DD/MM/YYYY",
                    );
                    setValue("birthDate", "", { shouldValidate: false });
                  }
                }}
                pattern="\d{2}/\d{2}/\d{4}"
                placeholder="DD/MM/YYYY"
                type="text"
                value={birthDateDisplay}
              />
            </div>
          </Field>

          <ChoiceGroup<PetSex>
            label="Gender"
            onChange={(value) =>
              setValue("sex", value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            options={[
              ["male", "Male"],
              ["female", "Female"],
              ["unknown", "Not sure"],
            ]}
            value={sex}
          />

          <ChoiceGroup<PetDesexedStatus>
            label="Desexed"
            onChange={(value) =>
              setValue("desexedStatus", value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            options={[
              ["yes", "Yes"],
              ["no", "No"],
              ["unknown", "Not sure"],
            ]}
            value={desexedStatus}
          />
        </div>

        <input {...register("approximateAge")} type="hidden" />
        <input {...register("species")} type="hidden" />

        {serverError ? (
          <p
            className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {serverError}
          </p>
        ) : null}
      </form>
    </main>
  );
}

function Field({
  children,
  error,
  id,
  label,
}: {
  children: React.ReactNode;
  error: string | undefined;
  id: string;
  label: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ChoiceGroup<T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: T) => void;
  options: ReadonlyArray<readonly [T, string]>;
  value: string;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">{label}</legend>
      <div className="mt-2 grid grid-cols-3 gap-2.5">
        {options.map(([optionValue, optionLabel]) => {
          const selected = value === optionValue;
          return (
            <button
              aria-pressed={selected}
              className={`min-h-11 rounded-full border px-2 text-sm transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.98] ${selected ? "border-[#ed802a] bg-[#ed802a] font-medium text-white" : "border-[#f0e6d8] bg-[#fdf8f2] text-[#7a7a7a]"}`}
              key={optionValue}
              onClick={() => onChange(optionValue)}
              type="button"
            >
              {optionLabel}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
