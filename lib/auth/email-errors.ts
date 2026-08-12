export const AUTH_EMAIL_RATE_LIMIT_MESSAGE = "Too many authentication emails have been requested. Please wait before requesting another email.";

export type AuthEmailErrorCode = "AUTH_RATE_LIMITED" | "AUTH_EMAIL_FAILED";

export function mapSupabaseEmailError(error: unknown): { code: AuthEmailErrorCode; message: string; status: number } {
  const candidate = error as { status?: unknown; message?: unknown } | null;
  const status = typeof candidate?.status === "number" ? candidate.status : 0;
  const message = typeof candidate?.message === "string" ? candidate.message.toLowerCase() : "";
  if (status === 429 || message.includes("rate limit") || message.includes("too many") || message.includes("email rate")) {
    return { code: "AUTH_RATE_LIMITED", message: AUTH_EMAIL_RATE_LIMIT_MESSAGE, status: 429 };
  }
  return { code: "AUTH_EMAIL_FAILED", message: "We could not send the email. Please try again later.", status: 503 };
}
