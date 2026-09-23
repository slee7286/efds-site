import { NextResponse } from "next/server";
import { z } from "zod";
import { GENERIC_EXTERNAL_EMAIL_MESSAGE, requestExternalEmail } from "@/lib/auth/external-email";
import { EMAIL_FLOW_COOKIE, emailFlowCookieOptions } from "@/lib/auth/email-flow";

const emailSchema = z.object({ email: z.string().trim().email().max(320) });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = emailSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: GENERIC_EXTERNAL_EMAIL_MESSAGE });

  const result = await requestExternalEmail(parsed.data.email, "magic_link");
  if (result.kind === "error") return NextResponse.json({ message: result.error.message, code: result.error.code }, { status: result.error.status });
  const response = NextResponse.json({ message: "If this email is approved for EFDS access, a sign-in link is on its way." });
  if (result.kind === "sent") response.cookies.set(EMAIL_FLOW_COOKIE, "magic_link", emailFlowCookieOptions());
  return response;
}
