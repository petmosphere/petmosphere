"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@petmosphere/api-contracts";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter";

const FIELDS = [
  {
    autoComplete: "current-password",
    key: "currentPassword",
    label: "Current Password",
  },
  { autoComplete: "new-password", key: "password", label: "New Password" },
  {
    autoComplete: "new-password",
    key: "confirmPassword",
    label: "Confirm New Password",
  },
] as const;

export function ChangePasswordForm() {
  const router = useRouter();
  const [show, setShow] = useState({
    confirmPassword: false,
    currentPassword: false,
    password: false,
  });
  const [serverError, setServerError] = useState<string>();

  const {
    control,
    formState: { errors, isSubmitting, isValid },
    handleSubmit,
    register,
    setError,
  } = useForm<ChangePasswordInput>({
    defaultValues: { confirmPassword: "", currentPassword: "", password: "" },
    mode: "onChange",
    resolver: zodResolver(changePasswordSchema),
  });

  const newPassword = useWatch({ control, name: "password" });

  const submit = handleSubmit(async (values) => {
    setServerError(undefined);
    try {
      const response = await fetch("/api/v1/account/password", {
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof body === "object" &&
          body !== null &&
          "message" in body &&
          typeof body.message === "string"
            ? body.message
            : "We could not change your password. Try again.";
        if (message.toLowerCase().includes("current")) {
          setError("currentPassword", { message });
        } else {
          setServerError(message);
        }
        return;
      }
      router.push("/profile/edit?passwordUpdated=1");
    } catch {
      setServerError("Check your connection and try again.");
    }
  });

  function fieldClass(hasError: boolean) {
    return `min-h-[52px] w-full rounded-xl border bg-white/60 pl-4 pr-12 text-[15px] outline-none transition-colors focus:ring-4 ${
      hasError
        ? "border-red-400 focus:border-red-400 focus:ring-red-400/10"
        : "border-[#F0E6D8] focus:border-[#ed802a] focus:ring-[#ed802a]/10"
    }`;
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[393px] flex-col bg-[#fdf8f2] px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] text-[#2d2d2d] shadow-xl shadow-stone-900/5">
      <div>
        <Link
          aria-label="Back"
          className="grid size-11 place-items-center rounded-full border border-[#ead9c7] bg-white/55 text-[#ed802a] transition-transform duration-150 active:scale-[0.96]"
          href="/profile/edit"
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
        </Link>
      </div>

      <h1 className="mt-6 text-[22px] font-bold tracking-tight">
        Change Password
      </h1>

      <form className="mt-8 flex flex-1 flex-col" noValidate onSubmit={submit}>
        <div className="space-y-4">
          {FIELDS.map(({ autoComplete, key, label }) => (
            <div key={key}>
              <label className="block" htmlFor={key}>
                <span className="mb-2 block text-sm font-medium">{label}</span>
                <div className="relative">
                  <input
                    {...register(key)}
                    aria-invalid={Boolean(errors[key])}
                    autoComplete={autoComplete}
                    className={fieldClass(Boolean(errors[key]))}
                    id={key}
                    type={show[key] ? "text" : "password"}
                  />
                  <button
                    aria-label={
                      show[key]
                        ? `Hide ${label.toLowerCase()}`
                        : `Show ${label.toLowerCase()}`
                    }
                    className="absolute top-0 right-0 grid h-full w-12 place-items-center text-[#7a7a7a]"
                    onClick={() => setShow((s) => ({ ...s, [key]: !s[key] }))}
                    type="button"
                  >
                    {show[key] ? (
                      <EyeOff aria-hidden="true" className="size-5" />
                    ) : (
                      <Eye aria-hidden="true" className="size-5" />
                    )}
                  </button>
                </div>
                {errors[key]?.message ? (
                  <span
                    className="mt-1.5 block text-xs text-red-600"
                    role="alert"
                  >
                    {errors[key].message}
                  </span>
                ) : null}
              </label>

              {key === "password" ? (
                <PasswordStrengthMeter password={newPassword ?? ""} />
              ) : null}
            </div>
          ))}
        </div>

        {serverError ? (
          <p
            className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {serverError}
          </p>
        ) : null}

        <div className="mt-8">
          <button
            className="min-h-[52px] w-full rounded-xl bg-[#65bcb5] text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSubmitting || !isValid}
            type="submit"
          >
            {isSubmitting ? "Updating…" : "Update Password"}
          </button>
        </div>
      </form>
    </main>
  );
}
