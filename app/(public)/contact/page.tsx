import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { InformationCard, InformationPage } from "../../../components/public/information-page";

export const metadata: Metadata = { title: "Contact", description: "Contact routes for EFDS Society members, partners, and privacy or security questions." };
const unionPage = "https://www.imperialcollegeunion.org/activities/a-to-z/efds-soc";

export default function ContactPage() {
  return <InformationPage eyebrow="Contact" title="Find the right route in." intro="Use the EFDS Society’s Imperial College Union activity page for current society contact and registration routes.">
    <InformationCard eyebrow="Current public route" title="EFDS Society on Imperial College Union" dark><p style={{ color: "rgba(247,247,243,.75)" }}>This repository does not define a public EFDS email address or a message-submission backend, so the site does not present a form that could silently discard your message.</p><p style={{ color: "rgba(247,247,243,.75)" }}>Use the official EFDS Society activity page for the current Union-managed contact and interest options.</p><p><a className="button button-primary" href={unionPage} target="_blank" rel="noreferrer">Open EFDS Society page <ExternalLink size={14} /></a></p></InformationCard>
    <InformationCard eyebrow="What to mention" title="A useful subject helps"><ul><li><strong>Prospective members:</strong> say that you are asking about joining or attending.</li><li><strong>Current members:</strong> include the relevant society or account context, but never send a password or sign-in link.</li><li><strong>Partners and sponsors:</strong> describe the collaboration briefly.</li><li><strong>Imperial staff or ICT/security:</strong> identify the EFDS Society website and the nature of the enquiry.</li><li><strong>Privacy or data requests:</strong> ask for account information, correction, deletion where applicable, or raise a concern.</li></ul></InformationCard>
    <InformationCard eyebrow="Safety" title="Keep sensitive details out of public forms"><p>Do not include passwords, Microsoft or Supabase tokens, database credentials, or private member information in a message. If you are reporting a security issue, describe the affected page or behavior and avoid publishing an exploit or personal data.</p><p>For privacy, security, and authentication architecture information, see <Link href="/privacy">Privacy</Link> and <Link href="/security">Security</Link>.</p></InformationCard>
  </InformationPage>;
}
