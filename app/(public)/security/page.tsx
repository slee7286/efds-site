import type { Metadata } from "next";
import Link from "next/link";
import { InformationCard, InformationPage } from "../../../components/public/information-page";
import { config } from "../../../lib/config";

export const metadata: Metadata = { title: "Security", description: "EFDS Society authentication, authorization, database, and hosting architecture." };
const configuredSiteUrl = config.siteUrl || "the public EFDS site origin";

export default function SecurityPage() {
  return <InformationPage eyebrow="Security" title="Security & access." intro="This page gives users and reviewers a plain-language view of the current EFDS authentication, authorization, database, and hosting boundaries.">
    <InformationCard eyebrow="Authentication" title="Identity and access are separate"><p>Members sign in through Supabase Auth with a verified email address and password or a secure email link. Google sign-in is available when the society has configured its OAuth provider. EFDS makes a separate server-side authorization decision from the authenticated identity and EFDS profile.</p><pre className="security-diagram">{`EFDS member
    ↓
Email or Google identity
    ↓
Supabase Auth
    ↓
EFDS Next.js application on Vercel
    ↓
Supabase PostgreSQL`}</pre><p>Non-Imperial addresses require an approved EFDS access exception. Authentication never bypasses the same authorization boundary.</p></InformationCard>
    <InformationCard eyebrow="Authorization" title="Authentication is not privileged access"><p>EFDS supports the hierarchy:</p><p><strong>viewer → EFDS member → EFDS student → committee → admin</strong></p><p>Eligible new accounts start as EFDS members. EFDS student access requires verification of enrolment on Imperial’s BSc Economics, Finance and Data Science. EFDS Union society membership alone does not grant it.</p><ul><li>Access is checked server-side after authentication.</li><li>Imperial domains are checked case-insensitively; unauthorized domains require an approved exception.</li><li>Inactive profiles can be denied.</li><li>Private committee/admin knowledge is not public.</li><li>The browser does not supply a trusted role or authorization decision.</li></ul></InformationCard>
    <InformationCard eyebrow="Database security" title="Supabase PostgreSQL with RLS"><p>The EFDS backend uses Supabase PostgreSQL. The backend migration enables Row Level Security on profiles, access exceptions, officers, knowledge and operational tables, and uses role-aware policies. The Next.js server authorization layer applies the same separation before private reads.</p><p>Public content is kept separate from private records. The site does not publish RLS policy SQL, internal identifiers, database connection details, or secrets on this page.</p></InformationCard>
    <InformationCard eyebrow="Provider permissions" title="Sign-in identity only"><p>Google sign-in requests the basic OpenID Connect identity scopes needed by Supabase Auth: <code>openid</code>, email and profile. It does not request Google Drive, Gmail or Calendar permissions. Website sign-in does not use Microsoft Graph.</p></InformationCard>
    <InformationCard eyebrow="Application information" title="For an ICT or security review" dark><dl className="security-details"><div><dt>Application name</dt><dd>EFDS Society</dd></div><div><dt>Purpose</dt><dd>Authentication and member access for the Economics, Finance &amp; Data Science Society website.</dd></div><div><dt>Authentication</dt><dd>Supabase email and password or secure email link; Google OAuth when configured.</dd></div><div><dt>Production URL</dt><dd>{configuredSiteUrl}</dd></div><div><dt>Identity data</dt><dd>Authenticated user ID, email, confirmation state, and available name metadata used to link an EFDS profile.</dd></div><div><dt>Hosting</dt><dd>Vercel / Next.js application.</dd></div><div><dt>Database and auth</dt><dd>Supabase Auth and Supabase PostgreSQL.</dd></div><div><dt>Organisation</dt><dd>Economics, Finance &amp; Data Science Society, Imperial College London.</dd></div></dl></InformationCard>
    <InformationCard eyebrow="Secrets" title="Server-side boundaries"><p>Supabase service-role credentials, database credentials, and any OAuth client secrets are server-side configuration. They are not exposed through browser code or public <code>NEXT_PUBLIC_*</code> variables. This page intentionally does not display credentials or internal IDs.</p></InformationCard>
    <InformationCard eyebrow="Reporting" title="Please tell us about a concern"><p>To report a suspected security issue, unsafe disclosure, access problem, or privacy concern, use the current <Link href="/contact">contact route</Link>. EFDS does not claim to operate a formal bug bounty.</p></InformationCard>
  </InformationPage>;
}
