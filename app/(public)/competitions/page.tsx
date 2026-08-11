import Link from "next/link";

export default function CompetitionsPage() { return <main><section className="container page-intro"><div className="eyebrow">Competitions</div><h1 className="display">A good problem<br />is an invitation.</h1><p>Build teams, work with real data and practise making an argument that holds up when someone asks the next question.</p><Link className="button button-primary" href="/events" style={{ marginTop: 24 }}>See upcoming opportunities</Link></section></main>; }
