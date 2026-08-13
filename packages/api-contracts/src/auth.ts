import { z } from "zod";

const email = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .email("Enter a valid email address.")
  .max(254, "Email address is too long.");

const password = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(72, "Use no more than 72 characters.");

const displayName = z
  .string()
  .trim()
  .min(1, "Enter your name.")
  .max(100, "Use no more than 100 characters.");

export const CURRENT_TERMS_VERSION = "2026-08-12";

export const signUpSchema = z
  .object({
    displayName,
    email,
    password,
    confirmPassword: z.string(),
    acceptedTerms: z.preprocess(
      (value) => value === true || value === "on",
      z.literal(true, {
        error: "You must accept the Terms of Service to create an account.",
      }),
    ),
  })
  .refine(({ confirmPassword, password }) => confirmPassword === password, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const signInSchema = z.object({ email, password: z.string().min(1) });

export const verifyEmailCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the six-digit verification code."),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string(),
  })
  .refine(({ confirmPassword, password }) => confirmPassword === password, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignUpFormInput = z.input<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type VerifyEmailCodeInput = z.infer<typeof verifyEmailCodeSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
