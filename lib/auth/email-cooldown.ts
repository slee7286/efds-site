"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export const EMAIL_COOLDOWN_SECONDS = 60;
export type EmailAuthIntent = "setup" | "reset" | "magic_link";

function stableEmailKey(email: string) {
  let hash = 2166136261;
  for (const character of email.trim().toLowerCase()) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function useEmailCooldown(intent: EmailAuthIntent | null, email: string) {
  const key = useMemo(() => intent && email.trim() ? `efds-email-cooldown:${intent}:${stableEmailKey(email)}` : null, [intent, email]);
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!key) {
      const timer = window.setTimeout(() => setUntil(0), 0);
      return () => window.clearTimeout(timer);
    }
    const stored = Number(window.sessionStorage.getItem(key) ?? 0);
    const timer = window.setTimeout(() => setUntil(Number.isFinite(stored) ? stored : 0), 0);
    return () => window.clearTimeout(timer);
  }, [key]);

  useEffect(() => {
    if (!until) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [until]);

  const start = useCallback(() => {
    if (!key) return;
    const timestamp = Date.now() + EMAIL_COOLDOWN_SECONDS * 1000;
    window.sessionStorage.setItem(key, String(timestamp));
    setUntil(timestamp);
    setNow(Date.now());
  }, [key]);

  const seconds = Math.max(0, Math.ceil((until - now) / 1000));
  return { active: seconds > 0, seconds, start };
}
