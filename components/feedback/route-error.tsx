"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";

export function RouteError({ retry }: { retry: () => void }) {
  return <section className="route-feedback" role="alert">
    <div className="route-feedback-content">
      <div className="eyebrow">Something interrupted this page</div>
      <h1>Let’s try that again.</h1>
      <p>We couldn’t load this part of EFDS. Try again, or return to the homepage. If you were saving a change, check the record before submitting it again.</p>
      <div className="route-feedback-actions">
        <button className="button button-primary" onClick={retry}><RefreshCw size={16} /> Try again</button>
        <Link className="button button-quiet" href="/">Back to EFDS</Link>
      </div>
    </div>
  </section>;
}
