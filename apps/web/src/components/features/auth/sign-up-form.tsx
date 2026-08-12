"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  signUpSchema,
  type SignUpFormInput,
  type SignUpInput,
} from "@petmosphere/api-contracts";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";

import { signUpAction, type AuthActionState } from "@/app/auth/actions";

const initialState: AuthActionState = { status: "idle" };

type FieldName = "displayName" | "email" | "password" | "confirmPassword";

const fields: Array<{
  autoComplete: string;
  label: string;
  name: FieldName;
  type: "email" | "password" | "text";
}> = [
  { autoComplete: "name", label: "Name", name: "displayName", type: "text" },
  {
    autoComplete: "email",
    label: "Email address",
    name: "email",
    type: "email",
  },
  {
    autoComplete: "new-password",
    label: "Password",
    name: "password",
    type: "password",
  },
  {
    autoComplete: "new-password",
    label: "Confirm password",
    name: "confirmPassword",
    type: "password",
  },
];

function FieldIcon({ name }: { name: FieldName }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute top-4 left-4 text-stone-500"
    >
      {name === "displayName" ? "♙" : name === "email" ? "✉" : "▢"}
    </span>
  );
}

export function SignUpForm() {
  const [state, setState] = useState(initialState);
  const [pending, startTransition] = useTransition();
  const [visiblePasswords, setVisiblePasswords] = useState<
    Record<string, boolean>
  >({});
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<SignUpFormInput, unknown, SignUpInput>({
    resolver: zodResolver(signUpSchema),
  });
  const acceptedTerms = useWatch({ control, name: "acceptedTerms" });

  const submit = handleSubmit((values) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) =>
      formData.set(key, value === true ? "on" : value),
    );
    startTransition(async () =>
      setState(await signUpAction(initialState, formData)),
    );
  });

  return (
    <form className="mt-7 space-y-3" noValidate onSubmit={submit}>
      {fields.map((field) => {
        const isPassword = field.type === "password";
        const isVisible = Boolean(visiblePasswords[field.name]);
        return (
          <div key={field.name}>
            <label className="sr-only" htmlFor={field.name}>
              {field.label}
            </label>
            <div className="relative">
              <FieldIcon name={field.name} />
              <input
                {...register(field.name)}
                aria-invalid={Boolean(errors[field.name])}
                autoComplete={field.autoComplete}
                className="min-h-13 w-full rounded-xl border border-[#ead9c7] bg-[#fffaf5] py-3 pr-12 pl-12 text-base text-stone-900 transition outline-none focus:border-[#cd9255] focus:ring-4 focus:ring-[#cd9255]/15"
                id={field.name}
                placeholder={field.label}
                type={isPassword && isVisible ? "text" : field.type}
              />
              {isPassword ? (
                <button
                  aria-label={`${isVisible ? "Hide" : "Show"} ${field.label.toLowerCase()}`}
                  className="absolute top-1 right-1 grid min-h-11 min-w-11 place-items-center rounded-lg text-stone-500 focus-visible:outline-2 focus-visible:outline-[#cd9255]"
                  onClick={() =>
                    setVisiblePasswords((current) => ({
                      ...current,
                      [field.name]: !current[field.name],
                    }))
                  }
                  type="button"
                >
                  <span aria-hidden="true">◉</span>
                </button>
              ) : null}
            </div>
            {errors[field.name]?.message ? (
              <p className="mt-1.5 text-sm text-red-600" role="alert">
                {errors[field.name]?.message}
              </p>
            ) : null}
          </div>
        );
      })}

      <div className="pt-2">
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-stone-600">
          <input
            {...register("acceptedTerms")}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[#cd9255]"
            type="checkbox"
          />
          <span>
            I have read and agree to the{" "}
            <Link
              className="font-semibold text-[#a96527] underline underline-offset-2"
              href="/terms"
              target="_blank"
            >
              Terms of Service
            </Link>
            .
          </span>
        </label>
        {errors.acceptedTerms?.message ? (
          <p className="mt-1.5 text-sm text-red-600" role="alert">
            {errors.acceptedTerms.message}
          </p>
        ) : null}
      </div>

      {state.message ? (
        <p
          className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}

      <button
        className="mt-3 min-h-13 w-full rounded-xl bg-[#efb985] px-5 text-base font-bold text-white transition hover:bg-[#e5a86e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a96527] disabled:cursor-not-allowed disabled:opacity-55"
        disabled={pending || acceptedTerms !== true}
        type="submit"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>

      <p className="pt-5 text-center text-base text-stone-500">
        Already have an account?{" "}
        <Link className="font-semibold text-[#c87331]" href="/auth/sign-in">
          Log in
        </Link>
      </p>
    </form>
  );
}
