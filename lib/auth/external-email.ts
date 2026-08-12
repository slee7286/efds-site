import "server-only";

import { normalizeEmail } from "@/lib/auth/access";
import { mapSupabaseEmailError } from "@/lib/auth/email-errors";
import { getExternalAuthRedirect, type ExternalEmailAuthIntent } from "@/lib/auth/external";
import { config, isSupabaseConfigured } from "@/lib/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const GENERIC_EXTERNAL_EMAIL_MESSAGE = "If this email is eligible for EFDS access, you will receive an email with the next step.";

export async function requestExternalEmail(rawEmail: string, intent: ExternalEmailAuthIntent) {
  if (!isSupabaseConfigured || !config.siteUrl) return { kind: "generic" as const };

  let email: string;
  try {
    email = normalizeEmail(rawEmail);
  } catch {
    return { kind: "generic" as const };
  }

  const supabase = await createServerSupabaseClient();
  const { data: eligible, error: eligibilityError } = await supabase.rpc(
    "is_external_email_eligible",
    { candidate_email: email },
  );
  if (eligibilityError || eligible !== true) return { kind: "generic" as const };

  try {
    const redirect = getExternalAuthRedirect(config.siteUrl, intent);
    let error: unknown = null;
    if (intent === "setup") {
      ({ error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect } }));
    } else if (intent === "reset") {
      ({ error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirect }));
    } else {
      ({ error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect } }));
    }
    if (error) return { kind: "error" as const, error: mapSupabaseEmailError(error) };
  } catch (error) {
    return { kind: "error" as const, error: mapSupabaseEmailError(error) };
  }

  return { kind: "sent" as const };
}
