import { cookies } from "next/headers";

const pendingEmailCookie = "petmosphere_pending_sign_up_email";
const codeSentAtCookie = "petmosphere_verification_code_sent_at";
function cookieName(name: string, purpose: string) {
  return purpose === "signup" ? name : `${name}_${purpose}`;
}

const pendingSignUpLifetimeSeconds = 60 * 60;
export const resendCooldownSeconds = 60;

const cookieOptions = {
  httpOnly: true,
  maxAge: pendingSignUpLifetimeSeconds,
  path: "/auth",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export async function rememberPendingSignUp(email: string, purpose = "signup") {
  const cookieStore = await cookies();
  cookieStore.set(
    cookieName(pendingEmailCookie, purpose),
    email,
    cookieOptions,
  );
  cookieStore.set(
    cookieName(codeSentAtCookie, purpose),
    Date.now().toString(),
    cookieOptions,
  );
}

export async function getPendingSignUp(purpose = "signup") {
  const cookieStore = await cookies();
  const email = cookieStore.get(cookieName(pendingEmailCookie, purpose))?.value;
  const sentAtValue = cookieStore.get(
    cookieName(codeSentAtCookie, purpose),
  )?.value;
  const sentAt = sentAtValue ? Number(sentAtValue) : Number.NaN;

  return {
    email,
    sentAt: Number.isFinite(sentAt) ? sentAt : undefined,
  };
}

export async function markVerificationCodeSent(purpose = "signup") {
  const cookieStore = await cookies();
  cookieStore.set(
    cookieName(codeSentAtCookie, purpose),
    Date.now().toString(),
    cookieOptions,
  );
}

export async function clearPendingSignUp(purpose = "signup") {
  const cookieStore = await cookies();
  const expiredCookieOptions = { ...cookieOptions, maxAge: 0 };
  cookieStore.set(
    cookieName(pendingEmailCookie, purpose),
    "",
    expiredCookieOptions,
  );
  cookieStore.set(
    cookieName(codeSentAtCookie, purpose),
    "",
    expiredCookieOptions,
  );
}

export function getResendWaitSeconds(sentAt?: number) {
  if (!sentAt) return 0;

  const elapsedSeconds = Math.floor((Date.now() - sentAt) / 1000);
  return Math.min(
    resendCooldownSeconds,
    Math.max(0, resendCooldownSeconds - elapsedSeconds),
  );
}

export function maskEmail(email: string) {
  const separatorIndex = email.lastIndexOf("@");
  if (separatorIndex <= 0) return "your email address";

  const localPart = email.slice(0, separatorIndex);
  const domain = email.slice(separatorIndex + 1);
  const visibleStart = localPart.slice(0, Math.min(2, localPart.length));

  return `${visibleStart}${"•".repeat(Math.max(3, localPart.length - visibleStart.length))}@${domain}`;
}
