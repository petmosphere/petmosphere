"use server";

import {
  CURRENT_TERMS_VERSION,
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  verifyEmailCodeSchema,
} from "@petmosphere/api-contracts";
import { getSafeNextPath } from "@petmosphere/services";
import { redirect } from "next/navigation";

import {
  clearPendingSignUp,
  getPendingSignUp,
  getResendWaitSeconds,
  markVerificationCodeSent,
  rememberPendingSignUp,
} from "@/lib/auth/pending-sign-up";
import { getAppUrl, getPublicConfigurationError } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  message?: string;
  status: "idle" | "error" | "success";
};

const invalidCredentials = "The email address or password is incorrect.";
const providerFailure =
  "We could not reach account services. Check your connection and try again.";

function readForm(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function publicError(error: unknown) {
  return getPublicConfigurationError(error) ?? providerFailure;
}

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? "Check the details and try again.",
    };
  }

  let hasSession = false;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          display_name: parsed.data.displayName,
          terms_accepted: true,
          terms_version: CURRENT_TERMS_VERSION,
        },
        emailRedirectTo: `${getAppUrl()}/auth/callback?next=/onboarding`,
      },
    });

    if (error) {
      return {
        status: "error",
        message: "We could not create that account. It may already exist.",
      };
    }

    hasSession = Boolean(data.session);
  } catch (error) {
    return { status: "error", message: publicError(error) };
  }

  await rememberPendingSignUp(parsed.data.email);

  if (hasSession) {
    await clearPendingSignUp();
    redirect("/auth/welcome");
  }
  redirect("/auth/verify-email");
}

export async function verifyEmailCodeAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = verifyEmailCodeSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? "Enter the verification code.",
    };
  }

  const { email } = await getPendingSignUp();
  if (!email) {
    return {
      status: "error",
      message:
        "Your verification session has expired. Create your account again.",
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: parsed.data.code,
      type: "signup",
    });

    if (error || !data.session) {
      return {
        status: "error",
        message:
          "That code is incorrect or has expired. Check it and try again.",
      };
    }
  } catch (error) {
    return { status: "error", message: publicError(error) };
  }

  await clearPendingSignUp();
  redirect("/auth/welcome");
}

export async function resendVerificationCodeAction(): Promise<AuthActionState> {
  const pendingSignUp = await getPendingSignUp();
  if (!pendingSignUp.email) {
    return {
      status: "error",
      message:
        "Your verification session has expired. Create your account again.",
    };
  }

  const waitSeconds = getResendWaitSeconds(pendingSignUp.sentAt);
  if (waitSeconds > 0) {
    return {
      status: "error",
      message: `Wait ${waitSeconds} seconds before requesting another code.`,
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resend({
      email: pendingSignUp.email,
      type: "signup",
    });

    if (error) {
      return {
        status: "error",
        message: "We could not send another code. Wait a moment and try again.",
      };
    }
  } catch (error) {
    return { status: "error", message: publicError(error) };
  }

  await markVerificationCodeSent();
  return {
    status: "success",
    message: "A new verification code has been sent.",
  };
}

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return { status: "error", message: invalidCredentials };
  }

  const next = getSafeNextPath(formData.get("next")?.toString());
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) {
      return { status: "error", message: invalidCredentials };
    }
  } catch (error) {
    return { status: "error", message: publicError(error) };
  }

  redirect(next);
}

export async function forgotPasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? "Check the details and try again.",
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(
      parsed.data.email,
      {
        redirectTo: `${getAppUrl()}/auth/callback?next=/auth/reset-password`,
      },
    );
    if (error) {
      return {
        status: "error",
        message: "We could not send the reset email. Wait and try again.",
      };
    }
  } catch (error) {
    return { status: "error", message: publicError(error) };
  }

  return {
    status: "success",
    message: "If an account exists, a password reset link is on its way.",
  };
}

export async function resetPasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? "Check the details and try again.",
    };
  }

  try {
    const supabase = await createClient();
    const { data, error: userError } = await supabase.auth.getUser();
    if (userError || !data.user) {
      return {
        status: "error",
        message: "This reset link has expired. Request a new one.",
      };
    }
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });
    if (error) {
      return { status: "error", message: "Password could not be updated." };
    }
  } catch (error) {
    return { status: "error", message: publicError(error) };
  }

  redirect("/auth/sign-in?notice=password-updated");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/sign-in");
}
