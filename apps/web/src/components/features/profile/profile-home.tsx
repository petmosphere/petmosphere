import {
  Bell,
  ChevronRight,
  CircleHelp,
  FileText,
  Mail,
  Pencil,
  Plus,
  Scale,
} from "lucide-react";
import Link from "next/link";

import { SignOutButton } from "@/components/features/auth/sign-out-button";
import { AppNav } from "@/components/features/pets/app-nav";
import { PetAvatar } from "@/components/features/pets/pet-avatar";
import type { Pet } from "@petmosphere/domain";

import { UserAvatar } from "./user-avatar";

type ProfilePet = { pet: Pet; photoUrl: string | null };

function MenuLink({
  href,
  icon: Icon,
  label,
  value,
}: {
  href: string;
  icon: typeof Bell;
  label: string;
  value?: string;
}) {
  return (
    <Link
      className="focus-visible:outline-inset flex min-h-14 items-center gap-3 border-b border-[#eadfd2] px-4 last:border-b-0 focus-visible:outline-2 focus-visible:outline-[#ed802a]"
      href={href}
    >
      <Icon aria-hidden="true" className="size-5 text-[#ed802a]" />
      <span className="flex-1 font-medium">{label}</span>
      {value ? <span className="text-sm text-[#7a7a7a]">{value}</span> : null}
      <ChevronRight aria-hidden="true" className="size-5 text-[#8a837c]" />
    </Link>
  );
}

export function ProfileHome({
  avatarUrl,
  displayName,
  email,
  pets,
  weightUnit,
}: {
  avatarUrl: string | null;
  displayName: string;
  email: string;
  pets: ProfilePet[];
  weightUnit: "kg" | "lb";
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[393px] flex-col bg-[#fdf8f2] pb-24 text-[#2d2d2d] shadow-xl shadow-stone-900/5">
      <div className="px-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <h1 className="text-2xl font-bold tracking-[-0.02em]">Profile</h1>

        <section className="mt-5 rounded-3xl bg-white/45 px-5 py-6 text-center shadow-[0_8px_24px_rgba(205,146,85,0.06)]">
          <UserAvatar
            avatarUrl={avatarUrl}
            className="mx-auto size-24 text-2xl"
            displayName={displayName}
          />
          <h2 className="mt-4 text-xl font-bold">{displayName}</h2>
          <p className="mt-1 text-sm break-all text-[#7a7a7a]">{email}</p>
          <Link
            className="mx-auto mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#ead9c7] bg-white/45 px-4 font-semibold text-[#ed802a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a]"
            href="/profile/edit"
          >
            <Pencil aria-hidden="true" className="size-4" /> Edit
          </Link>
        </section>

        <section className="mt-6">
          <h2 className="px-1 text-xs font-bold tracking-wide text-[#7a7a7a] uppercase">
            My pets
          </h2>
          {pets.length > 0 ? (
            <div className="mt-2 flex gap-3 overflow-x-auto pb-1">
              {pets.map(({ pet, photoUrl }) => (
                <Link
                  className="min-h-32 w-36 shrink-0 rounded-2xl border border-[#ead9c7] bg-white/45 p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a]"
                  href={`/pets/${pet.id}`}
                  key={pet.id}
                >
                  <PetAvatar
                    className="size-14"
                    name={pet.name}
                    photoUrl={photoUrl}
                    species={pet.species}
                  />
                  <span className="mt-3 block truncate font-semibold">
                    {pet.name}
                  </span>
                  <span className="block truncate text-sm text-[#7a7a7a]">
                    {pet.breed ||
                      pet.species[0]?.toUpperCase() + pet.species.slice(1)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <Link
              className="mt-2 flex min-h-24 items-center gap-4 rounded-2xl border border-dashed border-[#e5b98d] bg-white/45 px-4 transition-transform duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a] active:scale-[0.98]"
              href="/onboarding/pet"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#fff0df] text-[#ed802a]">
                <Plus aria-hidden="true" className="size-5" />
              </span>
              <span className="flex-1">
                <span className="block font-semibold">Add your first pet</span>
                <span className="mt-1 block text-sm text-[#7a7a7a]">
                  Create a profile to start tracking their care.
                </span>
              </span>
              <ChevronRight
                aria-hidden="true"
                className="size-5 text-[#9b948d]"
              />
            </Link>
          )}
        </section>

        <Link
          className="mt-6 flex min-h-20 items-center justify-between rounded-2xl border border-[#b9dedb] bg-[#65bcb5]/15 px-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#318783]"
          href="/profile/premium"
        >
          <span>
            <span className="block font-semibold">Upgrade to Premium</span>
            <span className="mt-1 block text-sm text-[#5e7775]">
              Unlock more helpful pet care tools
            </span>
          </span>
          <span className="rounded-full bg-white/65 px-3 py-2 text-sm font-semibold text-[#318783]">
            Upgrade
          </span>
        </Link>

        <section className="mt-6">
          <h2 className="px-1 text-xs font-bold tracking-wide text-[#7a7a7a] uppercase">
            Preferences
          </h2>
          <div className="mt-2 overflow-hidden rounded-2xl border border-[#ead9c7] bg-white/45">
            <MenuLink
              href="/profile/notifications"
              icon={Bell}
              label="Notification Settings"
            />
            <MenuLink
              href="/profile/units"
              icon={Scale}
              label="Units"
              value={weightUnit}
            />
          </div>
        </section>

        <section className="mt-6">
          <h2 className="px-1 text-xs font-bold tracking-wide text-[#7a7a7a] uppercase">
            Support
          </h2>
          <div className="mt-2 overflow-hidden rounded-2xl border border-[#ead9c7] bg-white/45">
            <MenuLink
              href="/profile/help"
              icon={CircleHelp}
              label="Help & FAQ"
            />
            <MenuLink href="/profile/contact" icon={Mail} label="Contact us" />
            <MenuLink
              href="/profile/privacy"
              icon={FileText}
              label="Privacy Policy"
            />
            <MenuLink
              href="/profile/terms"
              icon={FileText}
              label="Terms of Service"
            />
          </div>
        </section>

        <div className="mt-6 text-center">
          <SignOutButton appearance="profile" />
          <p className="mt-1 text-xs text-[#b5aea7]">v1.0.0</p>
        </div>
      </div>
      <AppNav
        active="profile"
        diaryHref={pets[0] ? `/pets/${pets[0].pet.id}/health-logs` : undefined}
        fixed
        reminderHref="/reminders"
      />
    </main>
  );
}
