import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import { Brand } from "@/components/public/brand";

export const metadata: Metadata = { title: "Email change confirmation" };

export default function EmailChangePendingPage() {
  return <main className="auth-page" id="main-content"><section className="auth-aside"><Brand /><div><div className="eyebrow">Account security</div><h1 className="display">Confirm both<br /><em>addresses.</em></h1><p>A secure email change can require a confirmation at your current address and your new one.</p></div><Link className="button button-quiet" style={{ color: "rgba(247,247,243,.7)" }} href="/"><ArrowLeft size={14} /> Return to EFDS</Link></section><section className="auth-panel"><div className="auth-box"><MailCheck size={29} color="var(--cobalt-dark)" /><div className="eyebrow" style={{ marginTop: 22 }}>One address confirmed</div><h2>Check your other inbox.</h2><p>We confirmed this address. If EFDS sent a second email to your other address, open its newest link and press Confirm this address there too. Your email change finishes after all required confirmations.</p><Link className="button button-dark" href="/dashboard/profile">Return to your profile</Link><p className="auth-footnote">Need help? <Link href="/contact">Contact the society</Link>.</p></div></section></main>;
}
