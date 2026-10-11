"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const serverSnapshot = () => "";
export function getDeviceTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
}

const browserSnapshot = getDeviceTimezone;

export function useDeviceTimezone() {
  return useSyncExternalStore(subscribe, browserSnapshot, serverSnapshot);
}
