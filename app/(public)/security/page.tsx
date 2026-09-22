import type { Metadata } from "next";
import Link from "next/link";
import { InformationCard, InformationPage } from "../../../components/public/information-page";
import { config } from "../../../lib/config";

export const metadata: Metadata = { title: "Security", description: "EFDS Society authentication, authorization, database, and hosting architecture." };
const configuredSiteUrl = config.siteUrl || "the public EFDS site origin";

export default function SecurityPage() {
  return <InformationPage eyebrow="Security" title="Security & access." intro="This page gives users and reviewers a plain-language view of the current EFDS authentication, authorization, database, and hosting boundaries.">
    <InformationCard eyebrow="Authentication" title="Identity and access are separate"><p>Imperial users authenticate through Microsoft Entra ID and Supabase Auth. EFDS then makes its own server-side authorization decision from the authenticated identity and the EFDS profile.</p><pre className="security-diagram">{`Imperial user
    ↓
Microsoft Entra ID
    ↓
Supabase Auth
    ↓
EFDS Next.js application on Vercel
    ↓
Supabase PostgreSQL`}</pre><p>Approved external users follow a separate path: Supabase email magic link/OTP → EFDS authorization. External authentication does not bypass the same authorization boundary.</p></InformationCard>
    <InformationCard eyebrow="Authorization" title="Authentication is not privileged access"><p>EFDS supports the hierarchy:</p><p><strong>viewer → member → committee → admin</strong></p><ul><li>Access is checked server-side after authentication.</li><li>Imperial domains are checked case-insensitively; unauthorized domains require an approved exception.</li><li>Inactive profiles can be denied.</li><li>Private committee/admin knowledge is not public.</li><li>The browser does not supply a trusted role or authorization decision.</li></ul></InformationCard>
    <InformationCard eyebrow="Database security" title="Supabase PostgreSQL with RLS"><p>The EFDS backend uses Supabase PostgreSQL. The backend migration enables Row Level Security on profiles, access exceptions, officers, knowledge and operational tables, and uses role-aware policies. The Next.js server authorization layer applies the same separation before private reads.</p><p>Public content is kept separate from private records. The site does not publish RLS policy SQL, internal identifiers, database connection details, or secrets on this page.</p></InformationCard>
    <InformationCard eyebrow="Microsoft permissions" title="OpenID Connect identity only"><p><strong>EFDS does not use the Microsoft Graph API.</strong></p><p>The effective Microsoft OAuth/OIDC scopes are <code>openid profile email</code>. They are used for authentication, basic identity claims, and the authenticated email claim. EFDS does not request access to mail, calendars, files, OneDrive, SharePoint, Teams, contacts, groups, or directory-wide information.</p><p>Approved external email authentication uses Supabase Auth and does not request Microsoft permissions.</p></InformationCard>
    <InformationCard eyebrow="Application information" title="For an ICT or security review" dark><dl className="security-details"><div><dt>Application name</dt><dd>EFDS Society</dd></div><div><dt>Purpose</dt><dd>Authentication and member access for the Economics, Finance &amp; Data Science Society website.</dd></div><div><dt>Authentication</dt><dd>Microsoft Entra ID through Supabase Auth; approved external users may use Supabase email authentication.</dd></div><div><dt>Production URL</dt><dd>{configuredSiteUrl}</dd></div><div><dt>Microsoft Graph</dt><dd>Not used.</dd></div><div><dt>Scopes</dt><dd><code>openid profile email</code></dd></div><div><dt>Identity data</dt><dd>Authenticated user ID, email, confirmation state, and available name metadata used to link an EFDS profile.</dd></div><div><dt>Hosting</dt><dd>Vercel / Next.js application.</dd></div><div><dt>Database and auth</dt><dd>Supabase Auth and Supabase PostgreSQL.</dd></div><div><dt>Organisation</dt><dd>Economics, Finance &amp; Data Science Society, Imperial College London.</dd></div></dl></InformationCard>
    <InformationCard eyebrow="Secrets" title="Server-side boundaries"><p>Supabase service-role credentials, database credentials, and the Microsoft client secret are server-side configuration. They are not exposed through browser code or public <code>NEXT_PUBLIC_*</code> variables. This page intentionally does not display credentials or internal IDs.</p></InformationCard>
    <InformationCard eyebrow="Reporting" title="Please tell us about a concern"><p>To report a suspected security issue, unsafe disclosure, access problem, or privacy concern, use the current <Link href="/contact">contact route</Link>. EFDS does not claim to operate a formal bug bounty.</p></InformationCard>
  </InformationPage>;
}
