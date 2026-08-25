"use client";

import { Clock } from "lucide-react";
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

  const filledCount = code.length;

  return (
    <div className="mt-8">
      <p className="text-center text-[15px] leading-[22px] text-[#7a7a7a]">
        We sent a six-digit code to{" "}
        <span className="font-semibold text-[#2d2d2d]">{maskedEmail}</span>
      </p>

      <form className="mt-8" noValidate onSubmit={submit}>
        <label className="sr-only" htmlFor="verificationCode">
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
          className="sr-only"
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
        <div
          className="flex justify-center gap-3"
          onClick={() => document.getElementById("verificationCode")?.focus()}
        >
          {Array.from({ length: 6 }, (_, index) => {
            const isCurrent = index === filledCount;
            return (
              <span
                aria-hidden="true"
                className={`grid size-16 place-items-center rounded-xl border text-2xl leading-8 font-bold text-[#2d2d2d] ${
                  isCurrent
                    ? "border-2 border-[#ed802a] bg-white shadow-[0_4px_12px_rgba(237,128,42,0.1)]"
                    : "border border-[#f0e6d8] bg-white/60"
                }`}
                key={index}
              >
                {code[index] ?? ""}
              </span>
            );
          })}
        </div>

        {verifyState.message ? (
          <p
            className="mt-3 text-center text-xs leading-4 text-[#e64033]"
            id="verification-error"
            role="alert"
          >
            {verifyState.message}
          </p>
        ) : null}

        <button
          className="mt-8 min-h-13 w-full rounded-xl bg-[#ED802A] px-5 text-base font-semibold text-[#fdf8f2] shadow-[0_4px_16px_rgba(205,146,85,0.14)] transition hover:bg-[#df6d16] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a94e0c] disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 disabled:shadow-none"
          disabled={code.length !== 6 || verifying}
          type="submit"
        >
          {verifying ? "Verifying…" : "Verify email"}
        </button>
      </form>

      <div className="mt-6 flex flex-col items-center gap-2 text-sm text-[#7a7a7a]">
        <p>Didn’t receive the email? Check your spam folder.</p>
        {resendWait > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fdefe2] px-3 py-1 text-xs leading-4 font-semibold text-[#ed802a]">
            <Clock aria-hidden="true" className="size-3.5" strokeWidth={2.5} />
            Resend available in {resendWait}s
          </span>
        ) : (
          <button
            className="min-h-11 px-3 font-semibold text-[#ED802A] underline underline-offset-4 disabled:text-stone-400 disabled:no-underline"
            disabled={resending}
            onClick={resend}
            type="button"
          >
            {resending ? "Sending…" : "Resend code"}
          </button>
        )}
        {resendState.message ? (
          <p
            className={`text-xs ${
              resendState.status === "success"
                ? "text-[#527d37]"
                : "text-[#e64033]"
            }`}
            role="status"
          >
            {resendState.message}
          </p>
        ) : null}
      </div>

      <Link
        className="mx-auto mt-6 flex min-h-11 w-fit items-center px-3 text-sm font-semibold text-[#7a7a7a] underline underline-offset-4"
        href="/auth/sign-up"
      >
        Use a different email
      </Link>
    </div>
  );
}
