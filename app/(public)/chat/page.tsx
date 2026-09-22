import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageIntro } from "@/components/public/page-intro";
import { ChatPanel, ChatScopeCard } from "@/components/chat/chat-panel";
export const metadata: Metadata = { title: "Ask EFDS", description: "Ask a question about EFDS using the society’s public knowledge assistant." };
export default function PublicChatPage() {
  return <main id="main-content"><PageIntro eyebrow="Ask EFDS" title={<>Curiosity starts<br /><em>with a question.</em></>} description="Find a starting point for society life, resources and opportunities. The EFDS assistant uses the society’s approved public information." graphic="data" /><section className="section-tight"><div className="container chat-shell"><ChatPanel scope="public" /><aside><ChatScopeCard scope="public" /><div className="scope-card"><h2>Prefer to explore?</h2><p>Start with the society or go straight to the resources.</p><Link className="text-link" href="/about">About EFDS <ArrowUpRight size={15} /></Link><br /><Link className="text-link" href="/resources">Browse resources <ArrowUpRight size={15} /></Link></div></aside></div></section></main>;
}
