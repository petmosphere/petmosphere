// @vitest-environment node
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { expect, it, vi } from "vitest";

it("shows a push without an open app and opens the reminder when tapped", async () => {
  const handlers = new Map<string, (event: unknown) => void>();
  const showNotification = vi.fn(async () => undefined);
  const openWindow = vi.fn(async () => undefined);
  const pending: Promise<unknown>[] = [];
  const waitUntil = (promise: Promise<unknown>) => pending.push(promise);
  runInNewContext(readFileSync("public/sw.js", "utf8"), {
    URL,
    self: {
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
        url: "/reminders/one",
      }),
    },
    waitUntil,
  });
  await Promise.all(pending);
  expect(showNotification).toHaveBeenCalledWith(
    "Petmosphere",
    expect.objectContaining({ data: { url: "/reminders/one" } }),
  );
  handlers.get("notificationclick")!({
    notification: { data: { url: "/reminders/one" }, close: vi.fn() },
    waitUntil,
  });
  await Promise.all(pending);
  expect(openWindow).toHaveBeenCalledWith("/reminders/one");
});
