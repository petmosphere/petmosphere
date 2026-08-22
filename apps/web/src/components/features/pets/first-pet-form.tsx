"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  createPetSchema,
  MAX_PET_PHOTO_BYTES,
  PET_PHOTO_TYPES,
  type CreatePetFormInput,
  type CreatePetInput,
} from "@petmosphere/api-contracts";
import type {
  PetAgeBand,
  PetDesexedStatus,
  PetSex,
  PetSpecies,
} from "@petmosphere/domain";
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  Cat,
  Dog,
  PawPrint,
  Scale,
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
  const [step, setStep] = useState<1 | 2>(1);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string>();
  const [unknownBirthDate, setUnknownBirthDate] = useState(false);
  const [serverError, setServerError] = useState<string>();
  const {
    clearErrors,
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setValue,
    trigger,
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
  const [name, species, sex, desexedStatus] = useWatch({
    control,
    name: ["name", "species", "sex", "desexedStatus"],
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

  async function goToDetails() {
    if (await trigger(["name", "species"])) {
      setStep(2);
    }
  }

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
    "min-h-13 w-full rounded-xl border border-[#ead9c7] bg-[#fffaf5] px-12 text-base text-stone-900 outline-none transition-[border-color,box-shadow] focus:border-[#ed802a] focus:ring-4 focus:ring-[#ed802a]/10";

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md bg-[#fdf8f2] px-6 pt-7 pb-10 text-[#2d2d2d] shadow-xl shadow-stone-900/5">
      <div className="h-1 overflow-hidden rounded-full bg-[#e8d0b3]">
        <div
          className="h-full rounded-full bg-[#ed802a] transition-[width] duration-200 ease-out motion-reduce:transition-none"
          style={{ width: step === 1 ? "50%" : "100%" }}
        />
      </div>

      <div className="mt-7 flex min-h-11 items-center justify-between">
        {step === 2 ? (
          <button
            aria-label="Back to step one"
            className="grid min-h-11 min-w-11 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-[#ed802a]"
            onClick={() => setStep(1)}
            type="button"
          >
            <ArrowLeft aria-hidden="true" className="size-6" />
          </button>
        ) : (
          <span />
        )}
        <p className="text-sm text-stone-500">Step {step} of 2</p>
      </div>

      <form className="mt-3" noValidate onSubmit={submit}>
        {step === 1 ? (
          <section aria-labelledby="pet-basics-heading">
            <h1 className="text-2xl font-bold" id="pet-basics-heading">
              Let’s meet your pet!
            </h1>

            <div className="mt-6 text-center">
              <label
                className="relative mx-auto grid size-28 cursor-pointer place-items-center overflow-hidden rounded-full border-2 border-dashed border-[#ed802a] bg-[#fffaf5] text-[#ed802a] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#b45309]"
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
                Pet’s name <RequiredMark />
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
                  placeholder="Pet’s name"
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
                      className={`flex min-h-28 flex-col items-center justify-center rounded-2xl border bg-[#fffaf5] transition-[border-color,background-color,transform] duration-150 ease-out active:scale-[0.97] ${selected ? "border-2 border-[#ed802a] bg-[#fff0e1] text-[#d8640d]" : "border-[#ead9c7]"}`}
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

            <button
              className="mt-10 min-h-13 w-full rounded-xl bg-[#f47b20] px-5 font-bold text-white transition-transform duration-150 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
              disabled={!name.trim() || !species}
              onClick={goToDetails}
              type="button"
            >
              Next
            </button>
            <Link
              className="mx-auto mt-3 flex min-h-11 w-fit items-center px-4 text-sm text-stone-500 underline-offset-4 hover:underline"
              href="/onboarding"
            >
              Skip for now
            </Link>
          </section>
        ) : (
          <section aria-labelledby="pet-details-heading">
            <h1 className="text-2xl font-bold" id="pet-details-heading">
              A bit more about {name.trim() || "your pet"}
            </h1>

            <div className="mt-6">
              <label
                className="mb-2 block text-sm font-medium"
                htmlFor="birth-date"
              >
                Date of birth{" "}
                <span className="font-normal text-stone-500">(optional)</span>
              </label>
              <div className="relative">
                <CalendarDays
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-stone-500"
                />
                <input
                  {...register("birthDate")}
                  aria-describedby={
                    errors.birthDate ? "birth-date-error" : undefined
                  }
                  aria-invalid={Boolean(errors.birthDate)}
                  className={inputClass}
                  disabled={unknownBirthDate}
                  id="birth-date"
                  type="date"
                />
              </div>
              {errors.birthDate ? (
                <p
                  className="mt-1.5 text-sm text-red-600"
                  id="birth-date-error"
                  role="alert"
                >
                  {errors.birthDate.message}
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
                      setValue("birthDate", "");
                      clearErrors("birthDate");
                    } else {
                      setValue("approximateAge", "");
                      clearErrors("approximateAge");
                    }
                  }}
                  type="checkbox"
                />
                I don’t know the exact date
              </label>
              {unknownBirthDate ? (
                <select
                  {...register("approximateAge")}
                  className="mt-2 min-h-13 w-full rounded-xl border border-[#ead9c7] bg-[#fffaf5] px-4 text-base outline-none focus:border-[#ed802a] focus:ring-4 focus:ring-[#ed802a]/10"
                >
                  <option value="">Select approximate age</option>
                  {ageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>

            <ChoiceGroup<PetSex>
              label="Sex (optional)"
              onChange={(value) =>
                setValue("sex", value, { shouldDirty: true })
              }
              options={[
                ["male", "Male"],
                ["female", "Female"],
                ["unknown", "Unknown"],
              ]}
              value={sex}
            />

            <div className="mt-6">
              <label
                className="mb-2 block text-sm font-medium"
                htmlFor="weight"
              >
                Weight{" "}
                <span className="font-normal text-stone-500">(optional)</span>
              </label>
              <div className="relative">
                <Scale
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-stone-500"
                />
                <input
                  {...register("weightKg")}
                  aria-describedby={
                    errors.weightKg ? "weight-error" : undefined
                  }
                  aria-invalid={Boolean(errors.weightKg)}
                  className={`${inputClass} pr-12`}
                  id="weight"
                  inputMode="decimal"
                  min="0.1"
                  placeholder="0.0"
                  step="0.1"
                  type="number"
                />
                <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-stone-500">
                  kg
                </span>
              </div>
              {errors.weightKg ? (
                <p
                  className="mt-1.5 text-sm text-red-600"
                  id="weight-error"
                  role="alert"
                >
                  {errors.weightKg.message}
                </p>
              ) : null}
            </div>

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
              disabled={isSubmitting || Boolean(photoError)}
              type="submit"
            >
              {isSubmitting ? "Saving…" : "Done"}
            </button>
            <button
              className="mx-auto mt-3 flex min-h-11 items-center px-4 text-sm text-stone-500 underline-offset-4 hover:underline disabled:text-stone-300"
              disabled={isSubmitting}
              onClick={() => {
                setUnknownBirthDate(false);
                setValue("approximateAge", "");
                setValue("birthDate", "");
                setValue("desexedStatus", "");
                setValue("sex", "");
                setValue("weightKg", "");
                clearErrors();
              }}
              type="submit"
            >
              Skip optional details
            </button>
          </section>
        )}
      </form>
    </main>
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
