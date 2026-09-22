import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageIntro } from "@/components/public/page-intro";
import { ChatPanel, ChatScopeCard } from "@/components/chat/chat-panel";
export const metadata: Metadata = { title: "Ask EFDS", description: "Ask a question about EFDS using the society’s public knowledge assistant." };
export default function PublicChatPage() {
  return <main id="main-content"><PageIntro eyebrow="Public assistant" title="Ask EFDS." description="Ask about the society, resources or opportunities. This assistant answers from information the society has approved for public sharing." /><section className="section-tight"><div className="container chat-shell"><ChatPanel scope="public" /><aside><ChatScopeCard scope="public" /><div className="scope-card"><h2>Explore the site</h2><p>Read about EFDS or browse the resource directory.</p><Link className="text-link" href="/about">About EFDS <ArrowUpRight size={15} /></Link><br /><Link className="text-link" href="/resources">Browse resources <ArrowUpRight size={15} /></Link></div></aside></div></section></main>;
}
