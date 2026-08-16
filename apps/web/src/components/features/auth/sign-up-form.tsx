"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  signUpSchema,
  type SignUpFormInput,
  type SignUpInput,
} from "@petmosphere/api-contracts";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";

import { signUpAction, type AuthActionState } from "@/app/auth/actions";

const initialState: AuthActionState = { status: "idle" };

type FieldName = "displayName" | "email" | "password" | "confirmPassword";

const fields: Array<{
  autoComplete: string;
  icon: LucideIcon;
  label: string;
  name: FieldName;
  type: "email" | "password" | "text";
}> = [
  {
    autoComplete: "name",
    icon: UserRound,
    label: "Name",
    name: "displayName",
    type: "text",
  },
  {
    autoComplete: "email",
    icon: Mail,
    label: "Email address",
    name: "email",
    type: "email",
  },
  {
    autoComplete: "new-password",
    icon: LockKeyhole,
    label: "Password",
    name: "password",
    type: "password",
  },
  {
    autoComplete: "new-password",
    icon: LockKeyhole,
    label: "Confirm password",
    name: "confirmPassword",
    type: "password",
  },
];

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
    defaultValues: {
      acceptedTerms: false,
      confirmPassword: "",
      displayName: "",
      email: "",
      password: "",
    },
    mode: "onChange",
    resolver: zodResolver(signUpSchema),
  });
  const [displayName, email, password, confirmPassword, acceptedTerms] =
    useWatch({
      control,
      name: [
        "displayName",
        "email",
        "password",
        "confirmPassword",
        "acceptedTerms",
      ],
    });
  const canSubmit =
    Boolean(displayName?.trim()) &&
    Boolean(email?.trim()) &&
    Boolean(password) &&
    password.length >= 10 &&
    password === confirmPassword &&
    (acceptedTerms === true || acceptedTerms === "on");
  const passwordsMismatch =
    Boolean(confirmPassword) && password !== confirmPassword;

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
    <form className="mt-6 space-y-3" noValidate onSubmit={submit}>
      {fields.map((field) => {
        const Icon = field.icon;
        const isPassword = field.type === "password";
        const isVisible = Boolean(visiblePasswords[field.name]);
        const errorMessage =
          errors[field.name]?.message ??
          (field.name === "confirmPassword" && passwordsMismatch
            ? "Passwords do not match."
            : undefined);
        return (
          <div key={field.name}>
            <label className="sr-only" htmlFor={field.name}>
              {field.label}
            </label>
            <div className="relative">
              <Icon
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[#7a7a7a]"
                strokeWidth={1.8}
              />
              <input
                {...register(field.name)}
                aria-describedby={
                  errorMessage ? `${field.name}-error` : undefined
                }
                aria-invalid={Boolean(errorMessage)}
                aria-required="true"
                autoComplete={field.autoComplete}
                className="min-h-13 w-full rounded-xl border border-[#f0e6d8] bg-transparent py-3 pr-12 pl-12 text-base text-[#2d2d2d] transition-[border-color,box-shadow] duration-150 outline-none placeholder:text-[#aaaaaa] focus:border-[#ED802A] focus:ring-4 focus:ring-[#ED802A]/12"
                id={field.name}
                placeholder={field.label}
                required
                type={isPassword && isVisible ? "text" : field.type}
              />
              {isPassword ? (
                <button
                  aria-label={`${isVisible ? "Hide" : "Show"} ${field.label.toLowerCase()}`}
                  className="absolute top-1 right-1 grid size-11 place-items-center rounded-lg text-[#7a7a7a] transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-[#ed802a] active:scale-[0.97] motion-reduce:transform-none"
                  onClick={() =>
                    setVisiblePasswords((current) => ({
                      ...current,
                      [field.name]: !current[field.name],
                    }))
                  }
                  type="button"
                >
                  {isVisible ? (
                    <EyeOff aria-hidden="true" className="size-5" />
                  ) : (
                    <Eye aria-hidden="true" className="size-5" />
                  )}
                </button>
              ) : null}
            </div>
            {errorMessage ? (
              <p
                className="mt-1.5 text-xs leading-4 text-[#e64033]"
                id={`${field.name}-error`}
                role="alert"
              >
                {errorMessage}
              </p>
            ) : null}
          </div>
        );
      })}

      <div className="pt-2">
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-[#7a7a7a]">
          <input
            {...register("acceptedTerms")}
            aria-required="true"
            className="mt-0.5 h-5 w-5 shrink-0 accent-[#ED802A]"
            required
            type="checkbox"
          />
          <span>
            I have read and agree to the{" "}
            <Link
              className="font-semibold text-[#ED802A] underline underline-offset-2"
              href="/terms"
              target="_blank"
            >
              Terms of Service
            </Link>
            .
          </span>
        </label>
        {errors.acceptedTerms?.message ? (
          <p className="mt-1.5 text-xs text-[#e64033]" role="alert">
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
        className="mt-3 min-h-13 w-full rounded-xl bg-[#ED802A] px-5 text-base font-semibold text-[#fdf8f2] shadow-[0_4px_16px_rgba(205,146,85,0.08)] transition hover:bg-[#df6d16] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a94e0c] disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none"
        disabled={pending || !canSubmit}
        type="submit"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>

      <p className="pt-2 text-center text-sm text-[#7a7a7a]">
        Already have an account?{" "}
        <Link className="font-semibold text-[#ED802A]" href="/auth/sign-in">
          Log in
        </Link>
      </p>
    </form>
  );
}
