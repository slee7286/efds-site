import { redirect } from "next/navigation";
import { AppShell } from "@/components/dashboard/app-shell";
import { evaluateUserAccess, getAuthUser } from "@/lib/auth/server";
import { isSupabaseConfigured } from "@/lib/config";

// Every route under this layout renders per request. Without this, a page whose only
// dynamic input is the auth lookup is prerendered as static HTML at build time, because
// the auth helpers return early (without touching `cookies()`) when the Supabase
// environment is absent during the build. The built page then carries the signed-out
// branch - or a baked-in redirect - and is served to signed-in members too.
export const dynamic = "force-dynamic";

export default async function PrivateLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (isSupabaseConfigured) {
    const user = await getAuthUser();
    const { allowed, profile } = await evaluateUserAccess(user);
    if (!user || !allowed) redirect("/access-denied");
    return <AppShell role={profile?.accessRole ?? "member"} profile={profile}>{children}</AppShell>;
  }
  if (process.env.NODE_ENV === "production") redirect("/access-denied");
  return <AppShell role="member">{children}</AppShell>;
}
