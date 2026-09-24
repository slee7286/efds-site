"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Check, CircleAlert, X } from "lucide-react";
import { useEffect, useState } from "react";

type Toast = { text: string; warning?: boolean };
const eventName = "efds:action-feedback";

export function showActionToast(text: string, warning = false) {
  window.dispatchEvent(new CustomEvent<Toast>(eventName, { detail: { text, warning } }));
}

export function actionToastMessage(path: string, query: URLSearchParams): Toast | null {
  if (path.startsWith("/dashboard/tickets/")) {
    if (query.has("error") || query.has("progressError")) return { text: "Your changes could not be saved. Review the message on this page.", warning: true };
    if (query.has("reminderError")) return { text: "The reminder could not be sent. Review the message on this page.", warning: true };
    if (query.has("progressSaved")) return { text: "Individual ticket progress saved." };
    if (query.has("saved")) return { text: query.get("saved") === "create" || query.get("saved") === "suggestion" ? "Ticket created." : query.get("saved") === "assign" ? "Ticket assignments saved." : query.get("saved") === "status" ? "Ticket status updated." : "Ticket details saved." };
    if (query.has("reminded")) return { text: Number(query.get("reminded")) > 0 ? "Reminder emails queued." : "No reminder emails were queued.", warning: Number(query.get("reminded")) === 0 };
  }
  if (path === "/admin/accounts") {
    if (query.has("error")) return { text: "The account decision could not be saved. Review the error on this page.", warning: true };
    if (query.has("notice")) {
      const notice = query.get("notice");
      if (notice === "attention" || notice === "unavailable") return { text: "Decision saved; check account email delivery.", warning: true };
      return { text: notice === "unchanged" ? "Account access was already up to date." : "Account decision saved." };
    }
  }
  if (path === "/admin/committee") {
    if (query.has("error")) return { text: "The officer link could not be saved. Review the error on this page.", warning: true };
    if (query.get("notice") === "linked") return { text: "Officer account linked." };
    if (query.get("notice") === "unlinked") return { text: "Officer account link removed." };
    if (query.get("notice") === "already_linked") return { text: "This account is already linked." };
  }
  if (path === "/dashboard/profile") {
    if (query.get("membership") === "saved") return { text: "Student verification details saved for review." };
    if (query.has("membership")) return { text: "Your review details could not be saved. Check the message on this page.", warning: true };
  }
  if (path.startsWith("/admin/operations/") && query.has("saved")) return { text: query.get("saved") === "create" ? "Operational record created." : "Operational record saved." };
  if (path.startsWith("/admin/knowledge/review/") && query.has("saved")) return { text: "Knowledge change saved." };
  return null;
}

export function ActionToast() {
  const path = usePathname();
  const search = useSearchParams();
  const [custom, setCustom] = useState<{ key: string; toast: Toast } | null>(null);
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const queryString = search.toString();
  const routeKey = `${path}?${queryString}`;
  const toast = custom?.key === routeKey ? custom.toast : dismissedKey === routeKey ? null : actionToastMessage(path, new URLSearchParams(queryString));

  useEffect(() => {
    const handle = (event: Event) => {
      setDismissedKey(routeKey);
      setCustom({ key: routeKey, toast: (event as CustomEvent<Toast>).detail });
    };
    window.addEventListener(eventName, handle);
    return () => window.removeEventListener(eventName, handle);
  }, [routeKey]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => { setCustom(null); setDismissedKey(routeKey); }, 6000);
    return () => window.clearTimeout(timer);
  }, [toast, routeKey]);

  if (!toast) return null;
  return <div className={`action-toast${toast.warning ? " action-toast-warning" : ""}`} role="status" aria-live="polite"><span className="action-toast-mark">{toast.warning ? <CircleAlert size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}</span><span>{toast.text}</span><button type="button" onClick={() => { setCustom(null); setDismissedKey(routeKey); }} aria-label="Dismiss notification"><X size={17} aria-hidden="true" /></button></div>;
}
