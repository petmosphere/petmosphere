"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@petmosphere/api-contracts";
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
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<FormValues>({
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

  return (
    <form className="mt-8 space-y-5" noValidate onSubmit={submit}>
      {fields.map((field) => (
        <label className="block" key={field.name}>
          <span className="mb-2 block text-sm font-semibold text-stone-800">
            {field.label}
          </span>
          <input
            aria-describedby={state.message ? "auth-message" : undefined}
            autoComplete={field.autoComplete}
            className="min-h-12 w-full rounded-2xl border border-stone-300 bg-white px-4 text-base text-stone-950 transition outline-none focus:border-[#87b35c] focus:ring-4 focus:ring-[#87b35c]/20"
            {...register(field.name)}
            type={field.type}
          />
          {errors[field.name]?.message ? (
            <span className="mt-2 block text-sm text-red-700" role="alert">
              {errors[field.name]?.message}
            </span>
          ) : null}
        </label>
      ))}

      {state.message ? (
        <p
          aria-live="polite"
          className={`rounded-2xl px-4 py-3 text-sm ${
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
        className="min-h-12 w-full rounded-2xl bg-[#87b35c] px-5 font-bold text-stone-950 shadow-sm transition hover:bg-[#79a750] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5d843b] disabled:cursor-wait disabled:opacity-65"
        disabled={pending}
        type="submit"
      >
        {pending ? "Please wait…" : submitLabel}
      </button>

      {footer ? (
        <p className="text-center text-sm text-stone-600">
          {footer.prompt}{" "}
          <Link
            className="font-semibold text-[#8b5b30] underline"
            href={footer.href}
          >
            {footer.label}
          </Link>
        </p>
      ) : null}
    </form>
  );
}
