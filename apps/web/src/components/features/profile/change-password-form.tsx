"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@petmosphere/api-contracts";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { ProfileShell } from "./profile-shell";

export function ChangePasswordForm() {
  const [status, setStatus] = useState<{
    message?: string;
    type: "idle" | "error" | "success";
  }>({ type: "idle" });
  const {
    formState: { errors, isSubmitting, isValid },
    handleSubmit,
    register,
    reset,
  } = useForm<ChangePasswordInput>({
    defaultValues: {
      confirmPassword: "",
      currentPassword: "",
      password: "",
    },
    mode: "onChange",
    resolver: zodResolver(changePasswordSchema),
  });

  const submit = handleSubmit(async (values) => {
    setStatus({ type: "idle" });
    try {
      const response = await fetch("/api/v1/account/password", {
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        setStatus({
          message:
            typeof body === "object" &&
            body !== null &&
            "message" in body &&
            typeof body.message === "string"
              ? body.message
              : "We could not change your password. Try again.",
          type: "error",
        });
        return;
      }
      reset();
      setStatus({
        message: "Your password has been changed.",
        type: "success",
      });
    } catch {
      setStatus({
        message: "Check your connection and try again.",
        type: "error",
      });
    }
  });

  return (
    <ProfileShell backHref="/profile/edit" title="Change password">
      <form className="mt-8 space-y-5" noValidate onSubmit={submit}>
        {(
          [
            ["currentPassword", "Current password", "current-password"],
            ["password", "New password", "new-password"],
            ["confirmPassword", "Confirm new password", "new-password"],
          ] as const
        ).map(([name, label, autoComplete]) => (
          <label className="block" htmlFor={name} key={name}>
            <span className="mb-2 block font-medium">{label}</span>
            <input
              {...register(name)}
              aria-invalid={Boolean(errors[name])}
              autoComplete={autoComplete}
              className="min-h-13 w-full rounded-2xl border border-[#ead9c7] bg-white/55 px-4 outline-none focus:border-[#ed802a] focus:ring-4 focus:ring-[#ed802a]/10"
              id={name}
              type="password"
            />
            {errors[name]?.message ? (
              <span className="mt-2 block text-sm text-red-700" role="alert">
                {errors[name].message}
              </span>
            ) : null}
          </label>
        ))}
        <p className="text-sm text-[#7a7a7a]">
          Use at least 10 characters for your new password.
        </p>
        {status.message ? (
          <p
            className={`rounded-2xl px-4 py-3 text-sm ${status.type === "success" ? "bg-[#65bcb5]/15 text-[#246865]" : "bg-red-50 text-red-800"}`}
            role={status.type === "error" ? "alert" : "status"}
          >
            {status.message}
          </p>
        ) : null}
        <button
          className="min-h-13 w-full rounded-2xl bg-[#ed802a] font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
          disabled={isSubmitting || !isValid || status.type === "success"}
          type="submit"
        >
          {isSubmitting ? "Changing…" : "Change password"}
        </button>
      </form>
    </ProfileShell>
  );
}
