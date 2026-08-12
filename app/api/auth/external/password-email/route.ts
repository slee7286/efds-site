import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeEmail } from "@/lib/auth/access";
import { config, isSupabaseConfigured } from "@/lib/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  email: z.string().trim().email().max(320),
  flow: z.enum(["setup", "reset"]),
});

const genericMessage = "If this email is eligible for EFDS access, you will receive an email with the next step.";

function recoveryRedirect(flow: "setup" | "reset") {
  const redirect = new URL("/auth/recovery", config.siteUrl);
  redirect.searchParams.set("flow", flow);
  return redirect.toString();
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success || !isSupabaseConfigured || !config.siteUrl) return NextResponse.json({ message: genericMessage });

  let email: string;
  try {
    email = normalizeEmail(parsed.data.email);
  } catch {
    return NextResponse.json({ message: genericMessage });
  }

  const supabase = await createServerSupabaseClient();
  const { data: eligible, error: eligibilityError } = await supabase.rpc(
    "is_external_email_eligible",
    { candidate_email: email },
  );
  if (eligibilityError || eligible !== true) return NextResponse.json({ message: genericMessage });

  if (parsed.data.flow === "setup") {
    // Supabase recovery cannot create a first-time Auth identity. The
    // allowlisted magic link proves email ownership and creates the identity
    // only for an approved exception; the recovery page then sets the password.
    await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: recoveryRedirect("setup") } });
  } else {
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: recoveryRedirect("reset") });
  }
  return NextResponse.json({ message: genericMessage });
}
