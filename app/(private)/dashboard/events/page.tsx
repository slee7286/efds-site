import Link from "next/link";

export default function PrivateEventsPage() { return <div className="app-content"><div className="eyebrow">Your calendar</div><h1>Stay in the<br />conversation.</h1><p className="app-subtitle">Find your next conversation in the society calendar.</p><div className="surface empty-state"><h2>Explore the society calendar.</h2><p>Confirmed dates and details are shared on the public events page.</p><Link className="button button-primary" href="/events" style={{ marginTop: 20 }}>Browse events</Link></div></div>; }
