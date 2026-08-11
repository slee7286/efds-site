import { redirect } from "next/navigation";
import { AppShell } from "@/components/dashboard/app-shell";
import { evaluateUserAccess, getAuthUser } from "@/lib/auth/server";
import { isSupabaseConfigured } from "@/lib/config";

export default async function PrivateLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (isSupabaseConfigured) {
    const user = await getAuthUser();
    const { allowed, profile } = await evaluateUserAccess(user);
    if (!user || !allowed) redirect("/access-denied");
    return <AppShell role={profile?.accessRole ?? "member"}>{children}</AppShell>;
  }
  if (process.env.NODE_ENV === "production") redirect("/access-denied");
  return <AppShell role="member">{children}</AppShell>;
}
