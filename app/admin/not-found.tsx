import Link from "next/link";

export default function RecordNotFound() {
  return <div className="app-content route-feedback"><div className="route-feedback-content"><div className="eyebrow">Record unavailable</div><h1>We couldn’t find that record.</h1><p>It may have moved, or it may not be available to your account.</p><Link className="button button-primary" href="/admin/search">Search the archive</Link></div></div>;
}
