"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const slides = [
  {
    description: "A simple daily check-in helps you spot changes early",
    image: "/illustrations/onboarding-wellness.svg",
    title: "Track your pet’s wellness in 10 seconds a day",
  },
  {
    description: "Smart reminders for medications, vaccines, and appointments",
    image: "/illustrations/onboarding-reminders.svg",
    title: "Never miss a vaccination or vet visit",
  },
  {
    description:
      "Tick season alerts, C3/C5 vaccine schedules, and local health advice",
    image: "/illustrations/onboarding-australia.svg",
    title: "Made for Aussie pets",
  },
] as const;

export function LandingOnboarding() {
  const [activeSlide, setActiveSlide] = useState(0);
  const slide = slides[activeSlide] ?? slides[0];
  const isLastSlide = activeSlide === slides.length - 1;

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#fdf8f2] text-[#2d2d2d]">
      <section
        aria-labelledby="onboarding-title"
        className="mx-auto grid min-h-dvh w-full max-w-2xl grid-rows-[minmax(18rem,1fr)_auto] md:px-8 md:py-8"
      >
        <div className="grid place-items-center px-8 py-10">
          <Image
            alt=""
            className="h-auto w-full max-w-70"
            height={280}
            priority
            src={slide.image}
            width={280}
          />
        </div>

        <div className="rounded-t-[2rem] bg-white/55 px-6 pt-9 pb-[max(2rem,env(safe-area-inset-bottom))] text-center shadow-[0_-10px_30px_rgba(80,55,35,0.05)] backdrop-blur-sm md:rounded-[2rem] md:px-10">
          <h1
            className="mx-auto max-w-lg text-2xl leading-tight font-bold tracking-[-0.025em] text-balance"
            id="onboarding-title"
          >
            {slide.title}
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-base leading-6 text-balance text-[#7e7a77]">
            {slide.description}
          </p>

          <div
            aria-label={`Step ${activeSlide + 1} of ${slides.length}`}
            className="mt-7 flex justify-center gap-2"
            role="status"
          >
            {slides.map(({ title }, index) => (
              <span
                aria-hidden="true"
                className={`h-2 rounded-full transition-[width,background-color] duration-200 motion-reduce:transition-none ${
                  index === activeSlide
                    ? "w-6 bg-[#ed802a]"
                    : "w-2 bg-[#e9ceaf]"
                }`}
                key={title}
              />
            ))}
          </div>

          {isLastSlide ? (
            <Link
              className="mt-7 flex min-h-13 w-full items-center justify-center rounded-xl bg-[#65bcb5] px-5 font-semibold text-white transition-colors hover:bg-[#50aaa4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#347c78] active:scale-[0.98] motion-reduce:transform-none"
              href="/auth/sign-up"
            >
              Get Started
            </Link>
          ) : (
            <button
              className="mt-7 min-h-13 w-full rounded-xl bg-[#f47d21] px-5 font-semibold text-white transition-colors hover:bg-[#df6d16] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a94e0c] active:scale-[0.98] motion-reduce:transform-none"
              onClick={() => setActiveSlide((current) => current + 1)}
              type="button"
            >
              Next
            </button>
          )}

          {!isLastSlide ? (
            <Link
              className="mx-auto mt-2 flex min-h-11 w-fit items-center px-4 text-[#77716d] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a94e0c]"
              href="/auth/sign-up"
            >
              Skip
            </Link>
          ) : null}
        </div>
      </section>

      <div
        aria-hidden="true"
        className="petmosphere-splash absolute inset-0 z-10 grid min-h-dvh place-items-center bg-[#fdf8f2] px-6"
      >
        <div className="-mt-12 text-center">
          <div className="mx-auto size-30 overflow-hidden rounded-[22%]">
            <Image
              alt="Petmosphere"
              className="size-full object-cover"
              height={120}
              src="/app-icon.svg"
              width={120}
            />
          </div>
          <p className="mt-8 text-3xl font-bold tracking-[-0.025em]">
            Petmosphere
          </p>
          <p className="mt-2 text-[#7e7a77]">Your pet’s health companion</p>
        </div>
        <div className="absolute bottom-[max(4.5rem,env(safe-area-inset-bottom))] flex gap-2">
          <span className="size-2 rounded-full bg-[#f2bd8e]" />
          <span className="size-2 rounded-full bg-[#ed802a]" />
          <span className="size-2 rounded-full bg-[#f2bd8e]" />
        </div>
      </div>
    </main>
  );
}
