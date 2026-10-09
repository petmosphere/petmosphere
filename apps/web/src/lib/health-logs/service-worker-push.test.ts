// @vitest-environment node
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { expect, it, vi } from "vitest";

it.each([
  "/reminders/one",
  "/pets/pet-one/health-logs/today",
  "/pets/pet-one/weight",
])("opens %s from a push when the app is closed", async (target) => {
  const handlers = new Map<string, (event: unknown) => void>();
  const showNotification = vi.fn(async () => undefined);
  const openWindow = vi.fn(async () => undefined);
  const pending: Promise<unknown>[] = [];
  const waitUntil = (promise: Promise<unknown>) => pending.push(promise);
  runInNewContext(readFileSync("public/sw.js", "utf8"), {
    URL,
    self: {
      location: { origin: "https://petmosphere.test" },
      addEventListener: (name: string, handler: (event: unknown) => void) =>
        handlers.set(name, handler),
      registration: { showNotification },
      clients: { matchAll: async () => [], openWindow },
    },
  });
  handlers.get("push")!({
    data: {
      json: () => ({
        body: "A pet care reminder is due.",
        tag: "reminder-one",
        url: target,
      }),
    },
    waitUntil,
  });
  await Promise.all(pending);
  expect(showNotification).toHaveBeenCalledWith(
    "Petmosphere",
    expect.objectContaining({ data: { url: target } }),
  );
  handlers.get("notificationclick")!({
    notification: { data: { url: target }, close: vi.fn() },
    waitUntil,
  });
  await Promise.all(pending);
  expect(openWindow).toHaveBeenCalledWith(`https://petmosphere.test${target}`);
});

it("navigates an existing app window to the tapped reminder", async () => {
  const handlers = new Map<string, (event: unknown) => void>();
  const navigate = vi.fn(async (url: string) => ({ focus: vi.fn(), url }));
  const openWindow = vi.fn();
  const pending: Promise<unknown>[] = [];
  runInNewContext(readFileSync("public/sw.js", "utf8"), {
    URL,
    self: {
      addEventListener: (name: string, handler: (event: unknown) => void) =>
        handlers.set(name, handler),
      location: { origin: "https://petmosphere.test" },
      clients: {
        matchAll: async () => [
          { url: "https://petmosphere.test/home", navigate },
        ],
        openWindow,
      },
    },
  });
  handlers.get("notificationclick")!({
    notification: {
      close: vi.fn(),
      data: { url: "/pets/pet-one/weight" },
    },
    waitUntil: (promise: Promise<unknown>) => pending.push(promise),
  });
  await Promise.all(pending);
  expect(navigate).toHaveBeenCalledWith(
    "https://petmosphere.test/pets/pet-one/weight",
  );
  expect(openWindow).not.toHaveBeenCalled();
});

it("does not open an external URL from notification data", async () => {
  const handlers = new Map<string, (event: unknown) => void>();
  const openWindow = vi.fn(async () => undefined);
  const pending: Promise<unknown>[] = [];
  runInNewContext(readFileSync("public/sw.js", "utf8"), {
    URL,
    self: {
      addEventListener: (name: string, handler: (event: unknown) => void) =>
        handlers.set(name, handler),
      location: { origin: "https://petmosphere.test" },
      clients: { matchAll: async () => [], openWindow },
    },
  });
  handlers.get("notificationclick")!({
    notification: { close: vi.fn(), data: { url: "/\\evil.test" } },
    waitUntil: (promise: Promise<unknown>) => pending.push(promise),
  });
  await Promise.all(pending);
  expect(openWindow).toHaveBeenCalledWith("https://petmosphere.test/home");
});
