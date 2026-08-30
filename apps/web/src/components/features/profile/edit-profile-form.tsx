"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  MAX_PROFILE_PHOTO_BYTES,
  PROFILE_PHOTO_TYPES,
  updateProfileSchema,
  type UpdateProfileInput,
} from "@petmosphere/api-contracts";
import { Camera } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { ProfileShell } from "./profile-shell";
import { getInitials } from "./user-avatar";

export function EditProfileForm({
  avatarUrl,
  displayName,
  email,
}: {
  avatarUrl: string | null;
  displayName: string;
  email: string;
}) {
  const router = useRouter();
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string>();
  const [serverError, setServerError] = useState<string>();
  const {
    formState: { errors, isSubmitting, isValid },
    handleSubmit,
    register,
  } = useForm<UpdateProfileInput>({
    defaultValues: { displayName },
    mode: "onChange",
    resolver: zodResolver(updateProfileSchema),
  });
  const photoPreview = useMemo(
    () => (photo ? URL.createObjectURL(photo) : (avatarUrl ?? undefined)),
    [avatarUrl, photo],
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
      !PROFILE_PHOTO_TYPES.includes(
        file.type as (typeof PROFILE_PHOTO_TYPES)[number],
      )
    ) {
      setPhotoError("Choose a JPEG, PNG or WebP photo.");
      return;
    }
    if (file.size > MAX_PROFILE_PHOTO_BYTES) {
      setPhotoError("Choose a photo smaller than 4 MB.");
      return;
    }
    setPhoto(file);
  }

  const submit = handleSubmit(async ({ displayName: name }) => {
    setServerError(undefined);
    const formData = new FormData();
    formData.set("displayName", name);
    if (photo) formData.set("photo", photo);

    try {
      const response = await fetch("/api/v1/profile", {
        body: formData,
        method: "PATCH",
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        setServerError(
          typeof body === "object" &&
            body !== null &&
            "message" in body &&
            typeof body.message === "string"
            ? body.message
            : "We could not update your profile. Try again.",
        );
        return;
      }
      router.replace("/profile");
      router.refresh();
    } catch {
      setServerError(
        "Check your connection and try again. Your details are still here.",
      );
    }
  });

  const inputClass =
    "min-h-13 w-full rounded-2xl border border-[#ead9c7] bg-white/55 px-4 text-base outline-none focus:border-[#ed802a] focus:ring-4 focus:ring-[#ed802a]/10";

  return (
    <ProfileShell title="Edit Profile">
      <form className="flex flex-1 flex-col" noValidate onSubmit={submit}>
        <div className="mt-7 text-center">
          <label
            className="relative mx-auto grid size-28 cursor-pointer place-items-center rounded-full bg-[#ed802a] text-3xl font-bold text-[#ffe2c8] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#ed802a]"
            htmlFor="profile-photo"
          >
            {photoPreview ? (
              <span className="absolute inset-0 overflow-hidden rounded-full">
                <Image
                  alt="Profile photo preview"
                  className="object-cover"
                  fill
                  sizes="112px"
                  src={photoPreview}
                  unoptimized
                />
              </span>
            ) : (
              <span aria-hidden="true">{getInitials(displayName)}</span>
            )}
            <span className="absolute right-0 bottom-0 grid size-9 place-items-center rounded-full bg-white text-[#ed802a] shadow-md">
              <Camera aria-hidden="true" className="size-5" />
            </span>
            <input
              accept={PROFILE_PHOTO_TYPES.join(",")}
              className="sr-only"
              id="profile-photo"
              onChange={(event) => selectPhoto(event.target.files?.[0])}
              type="file"
            />
          </label>
          <label
            className="mt-2 inline-flex min-h-11 cursor-pointer items-center text-sm font-medium text-[#ed802a]"
            htmlFor="profile-photo"
          >
            Change photo
          </label>
          {photoError ? (
            <p className="text-sm text-red-700" role="alert">
              {photoError}
            </p>
          ) : null}
        </div>

        <div className="mt-5 space-y-5">
          <label className="block" htmlFor="display-name">
            <span className="mb-2 block font-medium">Name</span>
            <input
              {...register("displayName")}
              aria-invalid={Boolean(errors.displayName)}
              className={inputClass}
              id="display-name"
            />
            {errors.displayName?.message ? (
              <span className="mt-2 block text-sm text-red-700" role="alert">
                {errors.displayName.message}
              </span>
            ) : null}
          </label>

          <label className="block" htmlFor="profile-email">
            <span className="mb-2 block font-medium">Email</span>
            <input
              className={`${inputClass} cursor-not-allowed text-[#7a7a7a]`}
              id="profile-email"
              readOnly
              type="email"
              value={email}
            />
            <span className="mt-2 block text-xs text-[#7a7a7a]">
              Email changes are not available yet.
            </span>
          </label>
        </div>

        {serverError ? (
          <p
            className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {serverError}
          </p>
        ) : null}

        <button
          className="mt-6 min-h-13 rounded-2xl bg-[#ed802a] px-5 font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
          disabled={isSubmitting || !isValid || Boolean(photoError)}
          type="submit"
        >
          {isSubmitting ? "Saving…" : "Save profile"}
        </button>

        <Link
          className="mt-4 flex min-h-12 items-center justify-center rounded-2xl border-2 border-[#ed802a] font-semibold text-[#ed802a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a]"
          href="/profile/change-password"
        >
          Change password
        </Link>

        <div className="mt-auto pt-16 text-center">
          <Link
            className="inline-flex min-h-11 items-center text-sm font-medium text-red-600"
            href="/profile/delete-account"
          >
            Delete account
          </Link>
          <p className="text-xs text-[#aaa29a]">This action cannot be undone</p>
        </div>
      </form>
    </ProfileShell>
  );
}
