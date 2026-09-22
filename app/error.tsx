"use client";

import { Brand } from "@/components/public/brand";
import { RouteError } from "@/components/feedback/route-error";

export default function ErrorPage({ retry }: { retry: () => void }) {
  return <main id="main-content" className="container" style={{ paddingTop: 36 }}><Brand /><RouteError retry={retry} /></main>;
}
