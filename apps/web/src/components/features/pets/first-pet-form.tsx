"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  createPetSchema,
  MAX_PET_PHOTO_BYTES,
  PET_PHOTO_TYPES,
  type CreatePetFormInput,
  type CreatePetInput,
} from "@petmosphere/api-contracts";
import type { PetAgeBand, PetDesexedStatus, PetSex } from "@petmosphere/domain";
import {
  CalendarDays,
  Camera,
  Cat,
  Check,
  ChevronDown,
  Dog,
  PawPrint,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { BreedSelect } from "./breed-select";

const ageOptions: Array<{ label: string; value: PetAgeBand }> = [
  { label: "Puppy / kitten", value: "baby" },
  { label: "Young", value: "young" },
  { label: "Adult", value: "adult" },
  { label: "Senior", value: "senior" },
];

function RequiredMark() {
  return (
    <span aria-hidden="true" className="ml-1 text-red-600">
      *
    </span>
  );
}

export function FirstPetForm() {
  const router = useRouter();
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string>();
  const [birthDateDisplay, setBirthDateDisplay] = useState("");
  const [birthDateFormatError, setBirthDateFormatError] = useState<
    string | undefined
  >();
  const [serverError, setServerError] = useState<string>();
  const [unknownBirthDate, setUnknownBirthDate] = useState(false);
  const {
    clearErrors,
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setValue,
  } = useForm<CreatePetFormInput, unknown, CreatePetInput>({
    defaultValues: {
      approximateAge: "",
      birthDate: "",
      breed: "",
      creationRequestId: "",
      desexedStatus: "",
      name: "",
      sex: "",
      weightKg: "",
    },
    mode: "onChange",
    resolver: zodResolver(createPetSchema),
  });
  const [species, sex, desexedStatus, approximateAge] = useWatch({
    control,
    name: ["species", "sex", "desexedStatus", "approximateAge"],
  });

  useEffect(() => {
    setValue("creationRequestId", crypto.randomUUID());
  }, [setValue]);

  const photoPreview = useMemo(
    () => (photo ? URL.createObjectURL(photo) : undefined),
    [photo],
  );

  useEffect(
    () => () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    },
    [photoPreview],
  );

  function selectPhoto(file: File | undefined) {
    setPhotoError(undefined);
    if (!file) {
      setPhoto(null);
      return;
    }
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
      const response = await fetch("/api/v1/pets", {
        body: formData,
        method: "POST",
      });
      if (response.status === 401) {
        router.replace("/auth/sign-in?next=/onboarding/pet");
        return;
      }
      const body: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof body === "object" &&
          body !== null &&
          "message" in body &&
          typeof body.message === "string"
            ? body.message
            : "We could not save your pet. Try again.";
        setServerError(message);
        return;
      }
      router.replace("/home");
      router.refresh();
    } catch {
      setServerError(
        "Check your connection and try again. Your details are still here.",
      );
    }
  });

  const inputClass =
    "min-h-13 w-full rounded-xl border border-[#ead9c7] bg-white/60 px-12 text-base text-stone-900 outline-none transition-[border-color,box-shadow] focus:border-[#ed802a] focus:ring-4 focus:ring-[#ed802a]/10";

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md bg-[#fdf8f2] px-6 pt-7 pb-10 text-[#2d2d2d] shadow-xl shadow-stone-900/5">
      <form className="mt-3" noValidate onSubmit={submit}>
        <section aria-labelledby="pet-basics-heading">
          <h1 className="text-2xl font-bold" id="pet-basics-heading">
            Let&apos;s meet your pet!
          </h1>

          <div className="mt-6 text-center">
            <label
              className="relative mx-auto grid size-28 cursor-pointer place-items-center overflow-hidden rounded-full border-2 border-dashed border-[#ed802a] bg-white/60 text-[#ed802a] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#b45309]"
              htmlFor="pet-photo"
            >
              {photoPreview ? (
                <Image
                  alt="Selected pet preview"
                  className="object-cover"
                  fill
                  sizes="112px"
                  src={photoPreview}
                  unoptimized
                />
              ) : (
                <Camera
                  aria-hidden="true"
                  className="size-8"
                  strokeWidth={1.6}
                />
              )}
              <span className="sr-only">Choose an optional pet photo</span>
              <input
                accept={PET_PHOTO_TYPES.join(",")}
                className="sr-only"
                id="pet-photo"
                onChange={(event) => selectPhoto(event.target.files?.[0])}
                type="file"
              />
            </label>
            <p className="mt-2 text-sm text-stone-500">
              Photo optional · max 4 MB
            </p>
            {photoError ? (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {photoError}
              </p>
            ) : null}
          </div>

          <div className="mt-6">
            <label
              className="mb-2 block text-sm font-medium"
              htmlFor="pet-name"
            >
              Pet&apos;s name <RequiredMark />
            </label>
            <div className="relative">
              <PawPrint
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-stone-500"
              />
              <input
                {...register("name")}
                aria-describedby={errors.name ? "pet-name-error" : undefined}
                aria-invalid={Boolean(errors.name)}
                className={inputClass}
                id="pet-name"
                placeholder="Pet's name"
              />
            </div>
            {errors.name ? (
              <p
                className="mt-1.5 text-sm text-red-600"
                id="pet-name-error"
                role="alert"
              >
                {errors.name.message}
              </p>
            ) : null}
          </div>

          <fieldset className="mt-5">
            <legend className="text-sm font-medium">
              Species <RequiredMark />
            </legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(
                [
                  ["dog", "Dog", Dog],
                  ["cat", "Cat", Cat],
                  ["other", "Other", PawPrint],
                ] as const
              ).map(([value, label, Icon]) => {
                const selected = species === value;
                return (
                  <button
                    aria-pressed={selected}
                    className={`flex min-h-28 flex-col items-center justify-center rounded-2xl border bg-white/60 transition-[border-color,background-color,transform] duration-150 ease-out active:scale-[0.97] ${selected ? "border-2 border-[#ed802a] bg-[#fff0e1] text-[#d8640d]" : "border-[#ead9c7]"}`}
                    key={value}
                    onClick={() => {
                      setValue("species", value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      setValue("breed", "");
                    }}
                    type="button"
                  >
                    <Icon
                      aria-hidden="true"
                      className="size-9"
                      strokeWidth={1.5}
                    />
                    <span className="mt-2 text-sm font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
            {errors.species ? (
              <p className="mt-1.5 text-sm text-red-600" role="alert">
                {errors.species.message}
              </p>
            ) : null}
          </fieldset>

          <div className="mt-5">
            <span
              className="mb-2 block text-sm font-medium"
              id="pet-breed-label"
            >
              Breed{" "}
              <span className="font-normal text-stone-500">(optional)</span>
            </span>
            <Controller
              control={control}
              name="breed"
              render={({ field }) => (
                <BreedSelect
                  disabled={!species}
                  id="pet-breed"
                  onChange={field.onChange}
                  species={species}
                  value={field.value ?? ""}
                />
              )}
            />
          </div>

          <div className="mt-5">
            <label
              className="mb-2 block text-sm font-medium"
              htmlFor="birth-date"
            >
              Date of birth <RequiredMark />
            </label>
            <div className="relative">
              <CalendarDays
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-stone-500"
              />
              <input
                aria-describedby={
                  birthDateFormatError || errors.birthDate
                    ? "birth-date-error"
                    : undefined
                }
                aria-invalid={Boolean(birthDateFormatError || errors.birthDate)}
                className={inputClass}
                disabled={unknownBirthDate}
                id="birth-date"
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
                  } else {
                    setBirthDateFormatError(
                      "Please enter the correct format DD/MM/YYYY",
                    );
                    setValue("birthDate", "", { shouldValidate: false });
                  }
                }}
                placeholder="DD/MM/YYYY"
                type="text"
                value={birthDateDisplay}
              />
            </div>
            {birthDateFormatError || errors.birthDate ? (
              <p
                className="mt-1.5 text-sm text-red-600"
                id="birth-date-error"
                role="alert"
              >
                {birthDateFormatError ?? errors.birthDate?.message}
              </p>
            ) : null}
            <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 text-sm text-stone-600">
              <input
                checked={unknownBirthDate}
                className="size-5 accent-[#ed802a]"
                onChange={(event) => {
                  const checked = event.target.checked;
                  setUnknownBirthDate(checked);
                  if (checked) {
                    setBirthDateDisplay("");
                    setBirthDateFormatError(undefined);
                    setValue("birthDate", "");
                    clearErrors("birthDate");
                  } else {
                    setValue("approximateAge", "");
                    clearErrors("approximateAge");
                  }
                }}
                type="checkbox"
              />
              I don&apos;t know the exact date
            </label>
            {unknownBirthDate ? (
              <AgeSelect
                value={approximateAge ?? ""}
                onChange={(val) =>
                  setValue("approximateAge", val, { shouldValidate: true })
                }
              />
            ) : null}
          </div>

          <ChoiceGroup<PetSex>
            label="Sex (optional)"
            onChange={(value) => setValue("sex", value, { shouldDirty: true })}
            options={[
              ["male", "Male"],
              ["female", "Female"],
              ["unknown", "Unknown"],
            ]}
            value={sex}
          />

          <ChoiceGroup<PetDesexedStatus>
            label="Desexed (optional)"
            onChange={(value) =>
              setValue("desexedStatus", value, { shouldDirty: true })
            }
            options={[
              ["yes", "Yes"],
              ["no", "No"],
              ["unknown", "Not sure"],
            ]}
            value={desexedStatus}
          />

          {serverError ? (
            <p
              className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {serverError}
            </p>
          ) : null}

          <button
            className="mt-10 min-h-13 w-full rounded-xl bg-[#66bbb6] px-5 font-bold text-white transition-transform duration-150 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-stone-300"
            disabled={
              isSubmitting ||
              Boolean(photoError) ||
              Boolean(birthDateFormatError)
            }
            type="submit"
          >
            {isSubmitting ? "Saving…" : "Done"}
          </button>
          <Link
            className="mx-auto mt-3 flex min-h-11 w-fit items-center px-4 text-sm text-stone-500 underline-offset-4 hover:underline"
            href="/home"
          >
            Skip for now
          </Link>
        </section>
      </form>
    </main>
  );
}

function AgeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: PetAgeBand) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = ageOptions.find((o) => o.value === value);

  return (
    <div className="relative mt-2">
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex min-h-13 w-full items-center gap-3 rounded-xl border border-[#f0e6d8] bg-[#fdf8f2] px-4 text-left transition-[border-color,box-shadow] focus:border-[#ed802a] focus:ring-4 focus:ring-[#ed802a]/10 focus:outline-none"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <span
          className={`flex-1 truncate text-[15px] font-medium ${value ? "text-[#2d2d2d]" : "text-stone-400"}`}
        >
          {selected ? selected.label : "Select approximate age"}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`size-5 shrink-0 text-stone-500 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>
      {open ? (
        <>
          <div
            aria-hidden="true"
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-2xl border border-[#f0e6d8] bg-white shadow-[0px_16px_32px_-10px_rgba(0,0,0,0.078),0px_2px_8px_rgba(0,0,0,0.05)]"
            role="listbox"
          >
            {ageOptions.map((option) => {
              const active = option.value === value;
              return (
                <button
                  aria-selected={active}
                  className={`flex w-full items-center justify-between px-4 py-3.5 text-left text-[15px] transition-[background-color,color] ${active ? "bg-[#ed802a]/[0.078] font-bold text-[#ed802a]" : "text-[#2d2d2d] hover:bg-stone-50"}`}
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  role="option"
                  type="button"
                >
                  <span>{option.label}</span>
                  {active ? (
                    <Check
                      aria-hidden="true"
                      className="size-3.5 shrink-0 text-[#ed802a]"
                      strokeWidth={2.5}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </>
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
    <fieldset className="mt-6">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {options.map(([optionValue, optionLabel]) => {
          const selected = value === optionValue;
          return (
            <button
              aria-pressed={selected}
              className={`min-h-11 rounded-full border px-2 text-sm transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.97] ${selected ? "border-[#f47b20] bg-[#f47b20] font-medium text-white" : "border-[#ead9c7] bg-[#fffaf5] text-stone-600"}`}
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
