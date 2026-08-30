"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  deleteAccountSchema,
  type DeleteAccountInput,
} from "@petmosphere/api-contracts";
import { TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { disablePushNotifications } from "@/lib/health-logs/push-notifications";

import { ProfileShell } from "./profile-shell";

export function DeleteAccountForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string>();
  const {
    formState: { errors, isSubmitting, isValid },
    handleSubmit,
    register,
  } = useForm<DeleteAccountInput>({
    defaultValues: { confirmation: "" as "DELETE", currentPassword: "" },
    mode: "onChange",
    resolver: zodResolver(deleteAccountSchema),
  });

  const submit = handleSubmit(async (values) => {
    setServerError(undefined);
    await disablePushNotifications();
    try {
      const response = await fetch("/api/v1/account", {
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
        method: "DELETE",
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        setServerError(
          typeof body === "object" &&
            body !== null &&
            "message" in body &&
            typeof body.message === "string"
            ? body.message
            : "We could not delete your account. Your account remains active.",
        );
        return;
      }
      router.replace("/auth/sign-in?notice=account-deleted");
      router.refresh();
    } catch {
      setServerError(
        "Check your connection and try again. Your account remains active.",
      );
    }
  });

  const inputClass =
    "min-h-13 w-full rounded-2xl border border-red-200 bg-white/55 px-4 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10";

  return (
    <ProfileShell backHref="/profile/edit" title="Delete account">
      <section className="mt-8 rounded-3xl bg-red-50 p-5 text-red-900">
        <TriangleAlert aria-hidden="true" className="size-7" />
        <h2 className="mt-3 text-lg font-bold">This is permanent</h2>
        <p className="mt-2 text-sm leading-6">
          Your profile, pets, health logs, reminders, weight records and private
          photos will be deleted immediately. They cannot be recovered.
        </p>
      </section>

      <form className="mt-6 space-y-5" noValidate onSubmit={submit}>
        <label className="block" htmlFor="delete-current-password">
          <span className="mb-2 block font-medium">Current password</span>
          <input
            {...register("currentPassword")}
            aria-invalid={Boolean(errors.currentPassword)}
            autoComplete="current-password"
            className={inputClass}
            id="delete-current-password"
            type="password"
          />
          {errors.currentPassword?.message ? (
            <span className="mt-2 block text-sm text-red-700" role="alert">
              {errors.currentPassword.message}
            </span>
          ) : null}
        </label>
        <label className="block" htmlFor="delete-confirmation">
          <span className="mb-2 block font-medium">
            Type <strong>DELETE</strong> to confirm
          </span>
          <input
            {...register("confirmation")}
            aria-invalid={Boolean(errors.confirmation)}
            autoComplete="off"
            className={inputClass}
            id="delete-confirmation"
          />
          {errors.confirmation?.message ? (
            <span className="mt-2 block text-sm text-red-700" role="alert">
              {errors.confirmation.message}
            </span>
          ) : null}
        </label>
        {serverError ? (
          <p
            className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {serverError}
          </p>
        ) : null}
        <button
          className="min-h-13 w-full rounded-2xl bg-red-600 font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
          disabled={isSubmitting || !isValid}
          type="submit"
        >
          {isSubmitting
            ? "Deleting permanently…"
            : "Delete account permanently"}
        </button>
      </form>
    </ProfileShell>
  );
}
