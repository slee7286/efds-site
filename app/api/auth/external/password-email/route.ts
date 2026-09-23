import { NextResponse } from "next/server";
import { z } from "zod";
import { GENERIC_EXTERNAL_EMAIL_MESSAGE, requestExternalEmail } from "@/lib/auth/external-email";
import { EMAIL_FLOW_COOKIE, emailFlowCookieOptions } from "@/lib/auth/email-flow";

const requestSchema = z.object({
  email: z.string().trim().email().max(320),
  flow: z.enum(["setup", "reset"]),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: GENERIC_EXTERNAL_EMAIL_MESSAGE });

  const result = await requestExternalEmail(parsed.data.email, parsed.data.flow);
  if (result.kind === "error") return NextResponse.json({ message: result.error.message, code: result.error.code }, { status: result.error.status });
  const response = NextResponse.json({ message: GENERIC_EXTERNAL_EMAIL_MESSAGE });
  if (result.kind === "sent") response.cookies.set(EMAIL_FLOW_COOKIE, parsed.data.flow, emailFlowCookieOptions());
  return response;
}
