import { redirect } from "next/navigation";
import { AuthorizationError, requireRole } from "@/lib/auth/server";

export default async function KnowledgeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  try {
    await requireRole("committee");
  } catch (error) {
    if (error instanceof AuthorizationError) redirect("/access-denied");
    throw error;
  }
  return children;
}
