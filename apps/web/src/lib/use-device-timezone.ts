"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const serverSnapshot = () => "";
const browserSnapshot = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || "";

export function useDeviceTimezone() {
  return useSyncExternalStore(subscribe, browserSnapshot, serverSnapshot);
}
