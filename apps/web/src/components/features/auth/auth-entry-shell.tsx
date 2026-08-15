import { ArrowLeft, MailCheck, PawPrint } from "lucide-react";
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
  variant: "forgot" | "sign-in";
}>) {
  const isForgotPassword = variant === "forgot";

  return (
    <main className="min-h-dvh bg-[#fdf8f2] text-[#2d2d2d]">
      <section className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {isForgotPassword ? (
          <Link
            aria-label="Back to sign in"
            className="grid size-11 place-items-center rounded-full text-[#2d2d2d] transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a] active:scale-[0.97] motion-reduce:transform-none"
            href="/auth/sign-in"
          >
            <ArrowLeft aria-hidden="true" className="size-7" strokeWidth={2} />
          </Link>
        ) : (
          <span aria-hidden="true" className="h-11" />
        )}

        <header
          className={isForgotPassword ? "mt-7 text-center" : "mt-5 text-center"}
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
          ) : (
            <Link
              aria-label="Petmosphere home"
              className="mx-auto grid size-13 place-items-center rounded-full bg-white/60 text-[#ed802a] shadow-[0_10px_30px_rgba(80,55,35,0.05)] transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a] active:scale-[0.97] motion-reduce:transform-none"
              href="/"
            >
              <PawPrint
                aria-hidden="true"
                className="size-7"
                strokeWidth={1.6}
              />
            </Link>
          )}

          <h1
            className={`${isForgotPassword ? "mt-8 text-3xl" : "mt-7 text-[2rem]"} font-bold tracking-[-0.025em] text-balance`}
          >
            {title}
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-lg leading-7 text-balance text-[#7a7a7a]">
            {description}
          </p>
        </header>

        {children}
      </section>
    </main>
  );
}
