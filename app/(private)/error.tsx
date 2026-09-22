"use client";

import { RouteError } from "@/components/feedback/route-error";

export default function WorkspaceError({ retry }: { retry: () => void }) {
  return <div className="app-content"><RouteError retry={retry} /></div>;
}
