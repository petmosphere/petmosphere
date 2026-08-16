"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@petmosphere/api-contracts";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { type Resolver, useForm } from "react-hook-form";

import type { AuthActionState } from "@/app/auth/actions";

type FormValues = {
  confirmPassword: string;
  email: string;
  password: string;
};

type AuthFormProps = {
  action: (
    previousState: AuthActionState,
    formData: FormData,
  ) => Promise<AuthActionState>;
  fields: Array<{
    autoComplete: string;
    label: string;
    name: keyof FormValues;
    type: "email" | "password";
  }>;
  footer?: { href: string; label: string; prompt: string };
  hiddenNext?: string | undefined;
  submitLabel: string;
  variant: "forgot" | "reset" | "sign-in" | "sign-up";
};

const initialState: AuthActionState = { status: "idle" };
const schemas = {
  forgot: forgotPasswordSchema,
  reset: resetPasswordSchema,
  "sign-in": signInSchema,
  "sign-up": signUpSchema,
};

export function AuthForm({
  action,
  fields,
  footer,
  hiddenNext,
  submitLabel,
  variant,
}: AuthFormProps) {
  const [state, setState] = useState(initialState);
  const [pending, startTransition] = useTransition();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const {
    formState: { errors, isValid },
    handleSubmit,
    register,
  } = useForm<FormValues>({
    mode: "onChange",
    resolver: zodResolver(schemas[variant]) as Resolver<FormValues>,
  });

  const submit = handleSubmit((values) => {
    const formData = new FormData();
    fields.forEach(({ name }) => formData.set(name, values[name]));
    if (hiddenNext) formData.set("next", hiddenNext);

    startTransition(async () => {
      setState(await action(initialState, formData));
    });
  });

  const isEntryForm = variant === "forgot" || variant === "sign-in";

  return (
    <form
      className={
        variant === "sign-in"
          ? "mt-28 flex flex-1 flex-col"
          : variant === "forgot"
            ? "mt-28"
            : "mt-8 space-y-5"
      }
      noValidate
      onSubmit={submit}
    >
      <div className={isEntryForm ? "space-y-4" : "space-y-5"}>
        {fields.map((field) => {
          const errorId = `${field.name}-error`;
          const describedBy = [
            errors[field.name] ? errorId : undefined,
            state.message ? "auth-message" : undefined,
          ]
            .filter(Boolean)
            .join(" ");
          const isPassword = field.type === "password";
          const FieldIcon = isPassword ? LockKeyhole : Mail;

          return (
            <div className="block" key={field.name}>
              <label
                className={
                  isEntryForm
                    ? "sr-only"
                    : "mb-2 block text-sm font-semibold text-stone-800"
                }
                htmlFor={field.name}
              >
                {field.label} <span aria-hidden="true">*</span>
              </label>
              <div className="relative">
                {isEntryForm ? (
                  <FieldIcon
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#7a7a7a]"
                    strokeWidth={1.8}
                  />
                ) : null}
                <input
                  aria-describedby={describedBy || undefined}
                  aria-invalid={Boolean(errors[field.name])}
                  aria-required="true"
                  autoComplete={field.autoComplete}
                  className={
                    isEntryForm
                      ? "min-h-13 w-full rounded-xl border border-[#f0e6d8] bg-transparent py-3 pr-12 pl-12 text-base text-[#2d2d2d] transition-[border-color,box-shadow] duration-150 outline-none placeholder:text-[#aaaaaa] focus:border-[#ED802A] focus:ring-4 focus:ring-[#ED802A]/12"
                      : "min-h-12 w-full rounded-2xl border border-stone-300 bg-white px-4 text-base text-stone-950 transition outline-none focus:border-[#87b35c] focus:ring-4 focus:ring-[#87b35c]/20"
                  }
                  id={field.name}
                  placeholder={isEntryForm ? field.label : undefined}
                  required
                  {...register(field.name)}
                  type={isPassword && passwordVisible ? "text" : field.type}
                />
                {isEntryForm && isPassword ? (
                  <button
                    aria-label={`${passwordVisible ? "Hide" : "Show"} password`}
                    className="absolute top-1 right-1 grid size-11 place-items-center rounded-lg text-[#7a7a7a] transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-[#ed802a] active:scale-[0.97] motion-reduce:transform-none"
                    onClick={() => setPasswordVisible((visible) => !visible)}
                    type="button"
                  >
                    {passwordVisible ? (
                      <EyeOff aria-hidden="true" className="size-5" />
                    ) : (
                      <Eye aria-hidden="true" className="size-5" />
                    )}
                  </button>
                ) : null}
              </div>
              {errors[field.name]?.message ? (
                <span
                  className="mt-2 block text-sm text-red-700"
                  id={errorId}
                  role="alert"
                >
                  {errors[field.name]?.message}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      {variant === "sign-in" ? (
        <Link
          className="ml-auto flex min-h-11 w-fit items-center text-sm font-medium text-[#ed802a] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a]"
          href="/auth/forgot-password"
        >
          Forgot password?
        </Link>
      ) : null}

      {state.message ? (
        <p
          aria-live="polite"
          className={`${isEntryForm ? "mt-4" : ""} rounded-2xl px-4 py-3 text-sm ${
            state.status === "success"
              ? "bg-[#87b35c]/15 text-green-900"
              : "bg-red-50 text-red-800"
          }`}
          id="auth-message"
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}

      <button
        className={
          isEntryForm
            ? `${variant === "sign-in" ? "mt-auto" : "mt-6"} min-h-13 w-full rounded-xl bg-[#f47d21] px-5 text-base font-semibold text-white shadow-[0_10px_24px_rgba(237,128,42,0.08)] transition-[background-color,transform] duration-150 ease-out hover:bg-[#df6d16] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a94e0c] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none motion-reduce:transform-none`
            : "min-h-12 w-full rounded-2xl bg-[#87b35c] px-5 font-bold text-stone-950 shadow-sm transition hover:bg-[#79a750] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5d843b] disabled:cursor-not-allowed disabled:opacity-65"
        }
        disabled={pending || !isValid || state.status === "success"}
        type="submit"
      >
        {pending ? "Please wait…" : submitLabel}
      </button>

      {footer ? (
        <p
          className={
            variant === "sign-in"
              ? "mt-24 text-center text-sm text-[#7a7a7a]"
              : "text-center text-sm text-stone-600"
          }
        >
          {footer.prompt}{" "}
          <Link
            className={
              variant === "sign-in"
                ? "font-semibold text-[#ED802A]"
                : "font-semibold text-[#8b5b30] underline"
            }
            href={footer.href}
          >
            {footer.label}
          </Link>
        </p>
      ) : null}
    </form>
  );
}
