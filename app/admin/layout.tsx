import { redirect } from "next/navigation";
import { AppShell } from "@/components/dashboard/app-shell";
import { evaluateUserAccess, getAuthUser } from "@/lib/auth/server";
import { isSupabaseConfigured } from "@/lib/config";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (isSupabaseConfigured) {
    const user = await getAuthUser();
    const { profile } = await evaluateUserAccess(user);
    if (!user || profile?.accessRole !== "admin") redirect("/access-denied");
    return <AppShell role="admin" profile={profile}>{children}</AppShell>;
  }
  if (process.env.NODE_ENV === "production") redirect("/access-denied");
  return <AppShell role="admin">{children}</AppShell>;
}
