import { ChevronLeft, MailCheck, PawPrint } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function AuthEntryShell({
  children,
  description,
  title,
  variant,
}: Readonly<{
  children: React.ReactNode;
  description: string;
  title: string;
  variant: "forgot" | "sign-in" | "verify";
}>) {
  const isForgotPassword = variant === "forgot";
  const showBack = variant !== "sign-in";

  return (
    <main className="min-h-dvh bg-[#fdf8f2] text-[#2d2d2d]">
      <section className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {showBack ? (
          <Link
            aria-label={
              isForgotPassword ? "Back to sign in" : "Back to create account"
            }
            className="grid size-10 place-items-center rounded-full border border-[#f0e6d8] bg-white text-[#2d2d2d] transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a] active:scale-[0.97] motion-reduce:transform-none"
            href={isForgotPassword ? "/auth/sign-in" : "/auth/sign-up"}
          >
            <ChevronLeft
              aria-hidden="true"
              className="size-5"
              strokeWidth={2}
            />
          </Link>
        ) : (
          <span aria-hidden="true" className="h-11" />
        )}

        <header
          className={`text-center ${isForgotPassword ? "mt-7" : variant === "verify" ? "mt-6" : "mt-5"}`}
        >
          {isForgotPassword ? (
            <div className="relative mx-auto grid size-32 place-items-center rounded-full bg-white/55 shadow-[0_14px_36px_rgba(116,77,41,0.05)]">
              <MailCheck
                aria-hidden="true"
                className="size-16 text-[#ed802a]"
                strokeWidth={1.5}
              />
              <span
                aria-hidden="true"
                className="absolute top-8 left-5 size-4 rounded-full bg-[#e9ceaf]"
              />
              <span
                aria-hidden="true"
                className="absolute top-10 right-5 h-5 w-2 rounded-full bg-[#f2b89e]"
              />
            </div>
          ) : variant === "verify" ? (
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#fdf8f2] text-[#ed802a] shadow-[0_6px_16px_rgba(205,146,85,0.1)]">
              <PawPrint
                aria-hidden="true"
                className="size-8"
                strokeWidth={2.5}
              />
            </span>
          ) : (
            <Link
              aria-label="Petmosphere home"
              className="mx-auto block w-fit transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a] active:scale-[0.97] motion-reduce:transform-none"
              href="/"
            >
              <Image
                alt="Petmosphere"
                className="rounded-[22%] shadow-[0_10px_30px_rgba(80,55,35,0.05)]"
                height={52}
                src="/app-icon.svg"
                width={52}
              />
            </Link>
          )}

          <h1
            className={`${isForgotPassword ? "mt-8 text-3xl font-bold" : "mt-5 text-[26px] leading-9 font-extrabold"} tracking-[-0.025em] text-balance`}
          >
            {title}
          </h1>
          <p
            className={`mx-auto max-w-sm text-balance text-[#7a7a7a] ${isForgotPassword ? "mt-2 text-lg leading-7" : variant === "verify" ? "mt-2 text-[15px] leading-[22px]" : "mt-1.5 text-sm leading-5"}`}
          >
            {description}
          </p>
        </header>

        {children}
      </section>
    </main>
  );
}
