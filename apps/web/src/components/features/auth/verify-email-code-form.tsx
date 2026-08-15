"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import {
  resendVerificationCodeAction,
  verifyEmailCodeAction,
  type AuthActionState,
} from "@/app/auth/actions";

const initialState: AuthActionState = { status: "idle" };

export function VerifyEmailCodeForm({
  initialResendWait,
  maskedEmail,
  resendCooldown,
}: {
  initialResendWait: number;
  maskedEmail: string;
  resendCooldown: number;
}) {
  const [code, setCode] = useState("");
  const [verifyState, setVerifyState] = useState(initialState);
  const [resendState, setResendState] = useState(initialState);
  const [resendWait, setResendWait] = useState(initialResendWait);
  const [verifying, startVerifying] = useTransition();
  const [resending, startResending] = useTransition();

  useEffect(() => {
    if (resendWait <= 0) return;

    const timer = window.setInterval(
      () => setResendWait((current) => Math.max(0, current - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [resendWait]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData();
    formData.set("code", code);
    startVerifying(async () =>
      setVerifyState(await verifyEmailCodeAction(initialState, formData)),
    );
  }

  function resend() {
    setResendState(initialState);
    startResending(async () => {
      const nextState = await resendVerificationCodeAction();
      setResendState(nextState);
      if (nextState.status === "success") {
        setResendWait(resendCooldown);
      }
    });
  }

  return (
    <div className="mt-8">
      <p className="text-center leading-6 text-stone-600">
        We sent a six-digit code to{" "}
        <strong className="font-semibold text-stone-800">{maskedEmail}</strong>
      </p>

      <form className="mt-6" noValidate onSubmit={submit}>
        <label
          className="block text-sm font-semibold text-stone-700"
          htmlFor="verificationCode"
        >
          Verification code
        </label>
        <input
          aria-describedby={
            verifyState.message ? "verification-error" : undefined
          }
          aria-invalid={verifyState.status === "error"}
          autoCapitalize="none"
          autoComplete="one-time-code"
          autoCorrect="off"
          autoFocus
          className="mt-2 min-h-16 w-full rounded-2xl border border-[#e8d0b3] bg-[#fffaf5] px-4 text-center font-mono text-2xl font-semibold tracking-[0.38em] text-stone-900 transition outline-none focus:border-[#cd9255] focus:ring-4 focus:ring-[#cd9255]/15"
          id="verificationCode"
          inputMode="numeric"
          name="code"
          onChange={(event) => {
            setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
            if (verifyState.status === "error") setVerifyState(initialState);
          }}
          pattern="[0-9]{6}"
          required
          type="text"
          value={code}
        />

        {verifyState.message ? (
          <p
            className="mt-2 text-sm text-red-600"
            id="verification-error"
            role="alert"
          >
            {verifyState.message}
          </p>
        ) : null}

        <button
          className="mt-5 min-h-13 w-full rounded-xl bg-[#cd9255] px-5 font-bold text-white transition hover:bg-[#b97f45] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a96527] disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
          disabled={code.length !== 6 || verifying}
          type="submit"
        >
          {verifying ? "Verifying…" : "Verify email"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-stone-600">
        <p>Didn’t receive the email? Check your spam folder.</p>
        <button
          className="mt-2 min-h-11 px-3 font-semibold text-[#a96527] underline underline-offset-4 disabled:text-stone-400 disabled:no-underline"
          disabled={resending || resendWait > 0}
          onClick={resend}
          type="button"
        >
          {resending
            ? "Sending…"
            : resendWait > 0
              ? `Resend code in ${resendWait}s`
              : "Resend code"}
        </button>
        {resendState.message ? (
          <p
            className={`mt-2 ${
              resendState.status === "success"
                ? "text-[#527d37]"
                : "text-red-600"
            }`}
            role="status"
          >
            {resendState.message}
          </p>
        ) : null}
      </div>

      <Link
        className="mx-auto mt-5 flex min-h-11 w-fit items-center px-3 font-semibold text-stone-600 underline underline-offset-4"
        href="/auth/sign-up"
      >
        Use a different email
      </Link>
    </div>
  );
}
