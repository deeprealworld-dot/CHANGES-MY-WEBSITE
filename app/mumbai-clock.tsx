"use client";

import { useSyncExternalStore } from "react";

// Shows the current time in Mumbai, so overseas visitors can see at a glance whether we are likely awake.
const formatter = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });

const subscribe = (onChange: () => void) => {
  const id = window.setInterval(onChange, 10_000);
  return () => window.clearInterval(id);
};
const getTime = () => formatter.format(new Date());

export function MumbaiClock() {
  // The server renders an empty value, so there is never a hydration mismatch.
  const time = useSyncExternalStore(subscribe, getTime, () => "");
  return (
    <span className="mumbai-clock">
      <b>{time || "--:--"}</b> in Mumbai <i>(IST, UTC+5:30)</i>
    </span>
  );
}
