import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeEmail } from "@/lib/auth/access";
import { getExternalMagicLinkOptions } from "@/lib/auth/external";
import { config, isSupabaseConfigured } from "@/lib/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const emailSchema = z.object({ email: z.string().trim().email().max(320) });
const genericMessage = "If this email is approved for EFDS external access, a sign-in link is on its way.";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = emailSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: genericMessage });
  if (!isSupabaseConfigured || !config.siteUrl) return NextResponse.json({ message: genericMessage });

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

  await supabase.auth.signInWithOtp({ email, options: getExternalMagicLinkOptions(config.siteUrl) });
  return NextResponse.json({ message: genericMessage });
}
