"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton({
  className,
  fallbackHref,
  iconClassName,
  label = "Back",
}: {
  className?: string;
  fallbackHref: string;
  iconClassName?: string;
  label?: string;
}) {
  const router = useRouter();
  return (
    <button
      aria-label={label}
      className={className}
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.replace(fallbackHref);
      }}
      type="button"
    >
      <ArrowLeft aria-hidden="true" className={iconClassName} />
    </button>
  );
}
