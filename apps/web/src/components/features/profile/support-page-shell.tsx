import { AppNav } from "@/components/features/pets/app-nav";
import { BackButton } from "@/components/ui/back-button";

export function SupportPageShell({
  backHref = "/profile",
  children,
  diaryHref,
  lastUpdated,
  showNavigation = true,
  title,
}: {
  backHref?: string;
  children: React.ReactNode;
  diaryHref?: string | undefined;
  lastUpdated?: string;
  showNavigation?: boolean;
  title: string;
}) {
  return (
    <main
      className={`mx-auto flex min-h-dvh w-full max-w-[393px] flex-col bg-[#fdf8f2] px-6 pt-[max(1.5rem,env(safe-area-inset-top))] text-[#2d2d2d] shadow-xl shadow-stone-900/5 ${
        showNavigation
          ? "pb-[calc(7rem+env(safe-area-inset-bottom))]"
          : "pb-[max(2rem,env(safe-area-inset-bottom))]"
      }`}
    >
      <header className="flex items-center gap-4">
        <BackButton
          className="grid size-11 shrink-0 place-items-center rounded-full border border-[#ead9c7] bg-white/55 text-[#ed802a] transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a] active:scale-[0.96] motion-reduce:transform-none"
          fallbackHref={backHref}
          iconClassName="size-5"
          label="Back to profile"
        />
        <h1 className="text-2xl font-bold tracking-[-0.02em]">{title}</h1>
      </header>

      {lastUpdated ? (
        <p className="mt-7 text-sm font-medium text-[#7a7a7a]">
          Last updated: {lastUpdated}
        </p>
      ) : null}

      <div className={lastUpdated ? "mt-4" : "mt-7"}>{children}</div>

      {showNavigation ? (
        <AppNav
          active="profile"
          diaryHref={diaryHref}
          fixed
          reminderHref="/reminders"
        />
      ) : null}
    </main>
  );
}
