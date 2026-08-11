import Link from "next/link";

export default function PrivateEventsPage() { return <div className="app-content"><div className="eyebrow">Your calendar</div><h1>Stay in the<br />conversation.</h1><p className="app-subtitle">Member events and your saved places to show up next.</p><div className="surface empty-state"><h2>Nothing saved yet.</h2><p>Browse the public calendar and save an event when something catches your attention.</p><Link className="button button-primary" href="/events" style={{ marginTop: 20 }}>Browse events</Link></div></div>; }
