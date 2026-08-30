"use client";

import {
  deriveLocalDate,
  type WeightReminderFrequency,
} from "@petmosphere/domain";
import { ArrowLeft, Bell, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import {
  disablePushNotifications,
  enablePushNotifications,
  pushSetupErrorMessages,
} from "@/lib/health-logs/push-notifications";

type PushStatus =
  "checking" | "enabled" | "disabled" | "blocked" | "unsupported";
type Sheet = "frequency" | "time" | null;
type PetSettings = {
  healthReminder: { enabled: boolean; localTime: string } | null;
  id: string;
  name: string;
  weightReminder: {
    enabled: boolean;
    frequency: WeightReminderFrequency;
    localTime: string;
    scheduleDay: number;
  } | null;
};

const frequencyOptions: Array<{
  label: string;
  value: WeightReminderFrequency;
}> = [
  { label: "Weekly", value: "weekly" },
  { label: "Every 2 weeks", value: "fortnightly" },
  { label: "Monthly", value: "monthly" },
  { label: "Every 3 months", value: "quarterly" },
];

function formatTime(value: string) {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${period}`;
}

function Toggle({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean | undefined;
  label: string;
  onChange: () => void;
}) {
  return (
    <button
      aria-checked={checked}
      aria-label={label}
      className={`relative h-8 w-14 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a] ${checked ? "bg-[#65bcb5]" : "bg-[#d9d0c8]"} disabled:cursor-not-allowed`}
      disabled={disabled}
      onClick={onChange}
      role="switch"
      type="button"
    >
      <span
        className={`absolute top-1 left-1 size-6 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-6" : ""}`}
      />
    </button>
  );
}

function SettingCard({
  active,
  children,
  checked = active,
  description,
  disabled,
  label,
  onToggle,
}: {
  active: boolean;
  checked?: boolean;
  children?: ReactNode;
  description: string;
  disabled?: boolean | undefined;
  label: string;
  onToggle: () => void;
}) {
  return (
    <section className="rounded-3xl bg-white/70 px-4 py-5 shadow-[0_8px_24px_rgba(205,146,85,0.055)]">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold">{label}</h2>
          <p className="mt-0.5 text-sm leading-5 text-[#7a7a7a]">
            {description}
          </p>
        </div>
        <Toggle
          checked={checked}
          disabled={disabled}
          label={label}
          onChange={onToggle}
        />
      </div>
      {active ? children : null}
    </section>
  );
}

function ScheduleSettingCard({
  description,
  disabled,
  enabled,
  label,
  onSetup,
  onToggle,
}: {
  description: string;
  disabled?: boolean | undefined;
  enabled: boolean;
  label: string;
  onSetup: () => void;
  onToggle: () => void;
}) {
  return (
    <section className="rounded-3xl bg-white/70 px-4 py-5 shadow-[0_8px_24px_rgba(205,146,85,0.055)]">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold">{label}</h2>
          <p className="mt-0.5 text-sm leading-5 text-[#7a7a7a]">
            {description}
          </p>
        </div>
        <Toggle
          checked={enabled}
          disabled={disabled}
          label={label}
          onChange={onToggle}
        />
      </div>
      <button
        aria-label={`Set up ${label}`}
        className="mt-4 min-h-11 w-full rounded-full border border-[#ed802a] text-sm font-semibold text-[#ed802a] focus-visible:outline-2 focus-visible:outline-[#ed802a] disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled}
        onClick={onSetup}
        type="button"
      >
        Set up
      </button>
    </section>
  );
}

function SettingRow({
  label,
  onClick,
  value,
}: {
  label: string;
  onClick: () => void;
  value: string;
}) {
  return (
    <button
      aria-label={`${label}: ${value}`}
      className="mt-4 flex min-h-12 w-full items-center border-t border-[#eadfd2] pt-3 text-left focus-visible:outline-2 focus-visible:outline-[#ed802a]"
      onClick={onClick}
      type="button"
    >
      <span className="flex-1 font-medium">{label}</span>
      <span className="text-sm">{value}</span>
      <ChevronRight aria-hidden="true" className="ml-2 size-5 text-[#8a837c]" />
    </button>
  );
}

function SheetFrame({
  children,
  onDismiss,
}: {
  children: ReactNode;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", dismiss);
    return () => window.removeEventListener("keydown", dismiss);
  }, [onDismiss]);

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end bg-black/40"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onDismiss();
      }}
      role="dialog"
    >
      <div className="mx-auto w-full max-w-[393px] rounded-t-[28px] bg-white px-6 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(30,27,24,0.1)]">
        <span className="mx-auto block h-1 w-10 rounded-full bg-[#e0e0e0]" />
        {children}
      </div>
    </div>
  );
}

function ChoiceSheet<T extends string | number>({
  description,
  onConfirm,
  onDismiss,
  options,
  title,
  value,
}: {
  description: string;
  onConfirm: (value: T) => void;
  onDismiss: () => void;
  options: Array<{ label: string; value: T }>;
  title: string;
  value: T;
}) {
  const [draft, setDraft] = useState(value);
  return (
    <SheetFrame onDismiss={onDismiss}>
      <h2 className="mt-6 text-xl font-bold">{title}</h2>
      <p className="mt-1 text-sm text-[#7a7a7a]">{description}</p>
      <div className="mt-5">
        {options.map((option) => (
          <label
            className="flex min-h-12 cursor-pointer items-center border-b border-[#eadfd2] last:border-b-0"
            key={option.value}
          >
            <span
              className={`flex-1 ${draft === option.value ? "font-semibold text-[#55b7b0]" : ""}`}
            >
              {option.label}
            </span>
            <input
              checked={draft === option.value}
              className="size-6 accent-[#65bcb5]"
              name={title}
              onChange={() => setDraft(option.value)}
              type="radio"
            />
          </label>
        ))}
      </div>
      <button
        className="mt-6 min-h-12 w-full rounded-full bg-[#ed802a] font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a]"
        onClick={() => onConfirm(draft)}
        type="button"
      >
        Confirm
      </button>
    </SheetFrame>
  );
}

function TimeSheet({
  onConfirm,
  onDismiss,
  value,
}: {
  onConfirm: (value: string) => void;
  onDismiss: () => void;
  value: string;
}) {
  const [initialHour = 19, initialMinute = 0] = value.split(":").map(Number);
  const [hour, setHour] = useState(initialHour % 12 || 12);
  const [minute, setMinute] = useState(initialMinute);
  const [period, setPeriod] = useState<"AM" | "PM">(
    initialHour >= 12 ? "PM" : "AM",
  );
  const hours = Array.from({ length: 12 }, (_, index) => index + 1);
  const minutes = Array.from({ length: 60 }, (_, index) => index);
  const selectedHour = (hour % 12) + (period === "PM" ? 12 : 0);

  return (
    <SheetFrame onDismiss={onDismiss}>
      <h2 className="mt-6 text-xl font-bold">Set Reminder Time</h2>
      <div className="mt-6 grid grid-cols-[1fr_auto_1fr_1fr] items-center gap-3 border-y border-[#ed802a]/20 py-3">
        <select
          aria-label="Hour"
          className="min-h-12 bg-transparent text-center text-2xl font-bold outline-none"
          onChange={(event) => setHour(Number(event.target.value))}
          value={hour}
        >
          {hours.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <span className="text-2xl font-bold">:</span>
        <select
          aria-label="Minute"
          className="min-h-12 bg-transparent text-center text-2xl font-bold outline-none"
          onChange={(event) => setMinute(Number(event.target.value))}
          value={minute}
        >
          {minutes.map((item) => (
            <option key={item} value={item}>
              {String(item).padStart(2, "0")}
            </option>
          ))}
        </select>
        <select
          aria-label="AM or PM"
          className="min-h-12 bg-transparent text-center text-2xl font-bold outline-none"
          onChange={(event) => setPeriod(event.target.value as "AM" | "PM")}
          value={period}
        >
          <option>AM</option>
          <option>PM</option>
        </select>
      </div>
      <button
        className="mt-7 min-h-12 w-full rounded-full bg-[#ed802a] font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed802a]"
        onClick={() =>
          onConfirm(
            `${String(selectedHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
          )
        }
        type="button"
      >
        Confirm
      </button>
    </SheetFrame>
  );
}

export function NotificationSettings({
  backHref = "/profile",
  pets,
  reminderNotificationsEnabled,
}: {
  backHref?: string;
  pets: PetSettings[];
  reminderNotificationsEnabled: boolean;
}) {
  const firstHealth = pets.find(
    ({ healthReminder }) => healthReminder,
  )?.healthReminder;
  const firstWeight = pets.find(
    ({ weightReminder }) => weightReminder,
  )?.weightReminder;
  const [dailyConfigured, setDailyConfigured] = useState(
    pets.some(({ healthReminder }) => healthReminder !== null),
  );
  const [weightConfigured, setWeightConfigured] = useState(
    pets.some(({ weightReminder }) => weightReminder !== null),
  );
  const [pushStatus, setPushStatus] = useState<PushStatus>("checking");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [daily, setDaily] = useState({
    enabled: pets.some(({ healthReminder }) => healthReminder?.enabled),
    localTime: firstHealth?.localTime ?? "19:00",
  });
  const [upcoming, setUpcoming] = useState({
    enabled: reminderNotificationsEnabled,
  });
  const [weight, setWeight] = useState({
    enabled: pets.some(({ weightReminder }) => weightReminder?.enabled),
    frequency: firstWeight?.frequency ?? ("weekly" as const),
    localTime: firstWeight?.localTime ?? "20:00",
  });

  useEffect(() => {
    let active = true;
    async function inspect() {
      if (
        !("Notification" in window) ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      ) {
        if (active) setPushStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (active) setPushStatus("blocked");
        return;
      }
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (active) setPushStatus(subscription ? "enabled" : "disabled");
    }
    void inspect();
    return () => {
      active = false;
    };
  }, []);

  const masterEnabled = pushStatus === "enabled";

  async function toggleMaster() {
    if (busy || pushStatus === "checking" || pushStatus === "unsupported")
      return;
    setBusy(true);
    setMessage("");
    if (masterEnabled) {
      await disablePushNotifications();
      setPushStatus("disabled");
    } else {
      const result = await enablePushNotifications();
      if (result.ok) setPushStatus("enabled");
      else {
        setPushStatus(result.reason === "denied" ? "blocked" : "disabled");
        setMessage(pushSetupErrorMessages[result.reason]);
      }
    }
    setBusy(false);
  }

  async function saveDaily(next: typeof daily) {
    if (pets.length === 0) return;
    const previous = daily;
    setDaily(next);
    setBusy(true);
    setMessage("");
    try {
      const responses = await Promise.all(
        pets.map(({ id }) =>
          fetch("/api/v1/health-log-reminders", {
            body: JSON.stringify({
              ...next,
              petId: id,
              timezone: "Australia/Melbourne",
            }),
            headers: { "Content-Type": "application/json" },
            method: "PUT",
          }),
        ),
      );
      if (responses.some((response) => !response.ok)) throw new Error();
      setDailyConfigured(true);
      setMessage("Settings saved automatically.");
    } catch {
      setDaily(previous);
      setMessage("We could not save the daily reminder. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function saveUpcoming(enabled: boolean) {
    const previous = upcoming;
    setUpcoming({ enabled });
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/v1/profile/notification-preferences", {
        body: JSON.stringify({ enabled }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!response.ok) throw new Error();
      setMessage("Settings saved automatically.");
    } catch {
      setUpcoming(previous);
      setMessage("We could not save reminder notifications. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function saveWeight(next: typeof weight) {
    if (pets.length === 0) return;
    const previous = weight;
    setWeight(next);
    setBusy(true);
    setMessage("");
    const localDate = deriveLocalDate(new Date(), "Australia/Melbourne");
    const melbourneToday = new Date(`${localDate}T12:00:00Z`);
    const weekly =
      next.frequency === "weekly" || next.frequency === "fortnightly";
    const scheduleDay = weekly
      ? melbourneToday.getUTCDay()
      : melbourneToday.getUTCDate();
    try {
      const responses = await Promise.all(
        pets.map(({ id }) =>
          fetch(`/api/v1/pets/${id}/weight-reminder`, {
            body: JSON.stringify({
              ...next,
              scheduleDay,
              timezone: "Australia/Melbourne",
            }),
            headers: { "Content-Type": "application/json" },
            method: "PUT",
          }),
        ),
      );
      if (responses.some((response) => !response.ok)) throw new Error();
      setWeightConfigured(true);
      setMessage("Settings saved automatically.");
    } catch {
      setWeight(previous);
      setMessage("We could not save the weight reminder. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const scheduleControlsDisabled =
    !masterEnabled || busy || pets.length === 0;
  return (
    <main className="mx-auto min-h-dvh w-full max-w-[393px] bg-[#fdf8f2] px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-10 text-[#2d2d2d]">
      <header>
        <Link
          aria-label={
            backHref === "/notifications"
              ? "Back to notifications"
              : "Back to profile"
          }
          className="grid size-11 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-[#ed802a]"
          href={backHref}
        >
          <ArrowLeft aria-hidden="true" className="size-6" />
        </Link>
        <h1 className="mt-5 text-2xl font-bold tracking-[-0.02em]">
          Notification Settings
        </h1>
      </header>

      <section className="mt-7 flex items-center gap-4 rounded-3xl bg-white/70 p-4 shadow-[0_8px_24px_rgba(205,146,85,0.055)]">
        <span
          className={`grid size-12 place-items-center rounded-2xl ${masterEnabled ? "bg-[#65bcb5]/15 text-[#55aaa5]" : "bg-[#e9e3dd] text-[#aaa29b]"}`}
        >
          <Bell aria-hidden="true" className="size-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold">All Notifications</span>
          <span className="mt-0.5 block text-sm text-[#7a7a7a]">
            {pushStatus === "checking"
              ? "Checking this device…"
              : "Manage all alerts"}
          </span>
        </span>
        <Toggle
          checked={masterEnabled}
          disabled={
            busy || pushStatus === "checking" || pushStatus === "unsupported"
          }
          label="All notifications"
          onChange={() => void toggleMaster()}
        />
      </section>
      <p className="mt-4 px-2 text-sm leading-5 text-[#aaa39c]">
        Controls push notifications. In-app alerts are always shown.
      </p>

      <div className="mt-5 space-y-3">
        {dailyConfigured ? (
          <SettingCard
            active={false}
            checked={masterEnabled && daily.enabled}
            description="Daily check-in notifications"
            disabled={!masterEnabled || busy}
            label="Daily check-in"
            onToggle={() =>
              void saveDaily({ ...daily, enabled: !daily.enabled })
            }
          />
        ) : (
          <ScheduleSettingCard
            description="Reminds you to log your pet’s daily mood"
            disabled={scheduleControlsDisabled}
            enabled={false}
            label="Daily check-in"
            onSetup={() => setSheet("time")}
            onToggle={() => setSheet("time")}
          />
        )}

        <SettingCard
          active={false}
          checked={masterEnabled && upcoming.enabled}
          description="Notifications follow each reminder’s settings"
          disabled={!masterEnabled || busy}
          label="Reminders"
          onToggle={() => void saveUpcoming(!upcoming.enabled)}
        />

        {weightConfigured ? (
          <SettingCard
            active={false}
            checked={masterEnabled && weight.enabled}
            description="Weight log notifications"
            disabled={!masterEnabled || busy}
            label="Weight log"
            onToggle={() =>
              void saveWeight({ ...weight, enabled: !weight.enabled })
            }
          />
        ) : (
          <ScheduleSettingCard
            description="Track your pet’s weight trends over time"
            disabled={scheduleControlsDisabled}
            enabled={false}
            label="Weight log"
            onSetup={() => setSheet("frequency")}
            onToggle={() => setSheet("frequency")}
          />
        )}
      </div>

      {!masterEnabled && pushStatus !== "checking" ? (
        <p className="mt-7 text-center text-sm leading-5 text-[#7a7a7a]">
          {pushStatus === "blocked"
            ? "Allow notifications in your browser settings, then return here."
            : "Turn on notifications to never miss a reminder for your furry friend."}
        </p>
      ) : null}
      {masterEnabled && pets.length === 0 ? (
        <p className="mt-7 text-center text-sm text-[#7a7a7a]">
          Add a pet before setting daily or weight reminders.
        </p>
      ) : null}
      <p
        className={`mt-7 text-center text-sm ${message.includes("could not") ? "text-red-600" : "text-[#aaa39c]"}`}
        role={message.includes("could not") ? "alert" : "status"}
      >
        {busy ? "Saving…" : message || "Settings are saved automatically"}
      </p>

      {sheet === "time" ? (
        <TimeSheet
          onConfirm={(localTime) => {
            setSheet(null);
            void saveDaily({
              ...daily,
              enabled: dailyConfigured ? daily.enabled : true,
              localTime,
            });
          }}
          onDismiss={() => setSheet(null)}
          value={daily.localTime}
        />
      ) : null}
      {sheet === "frequency" ? (
        <ChoiceSheet
          description="How often to remind you to weigh your pet"
          onConfirm={(frequency) => {
            setSheet(null);
            void saveWeight({
              ...weight,
              enabled: weightConfigured ? weight.enabled : true,
              frequency,
            });
          }}
          onDismiss={() => setSheet(null)}
          options={frequencyOptions}
          title="Log Frequency"
          value={weight.frequency}
        />
      ) : null}
    </main>
  );
}
