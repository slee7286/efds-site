import { AppSidebar } from "@/components/dashboard/sidebar";
import type { AccessRole } from "@/types/domain";

export function AppShell({ children, role = "member" }: { children: React.ReactNode; role?: AccessRole }) {
  return (
    <div className="app-layout">
      <div className="app-frame">
        <AppSidebar role={role} />
        <main className="app-main">
          <div className="app-topbar"><span className="breadcrumb">EFDS platform <span className="muted">/ 2026–27</span></span><div className="profile-chip"><span>Preview workspace</span><span className="avatar">EF</span></div></div>
          {children}
        </main>
      </div>
    </div>
  );
}
