export const EMAIL_FLOW_COOKIE = "efds-email-flow";

export type EmailFlow = "setup" | "reset" | "magic_link";

export function emailFlowCookieOptions() {
  return { path: "/", httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, maxAge: 60 * 60 };
}
