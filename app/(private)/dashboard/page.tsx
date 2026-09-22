import Link from "next/link";
import { ArrowUpRight, BookOpen, BriefcaseBusiness, Search, MessagesSquare } from "lucide-react";
import { DisciplineGraphic } from "@/components/public/discipline-graphic";

export default function DashboardPage() {
  return <div className="app-content"><div className="eyebrow">Member workspace</div><h1>Welcome to your workspace.</h1><p className="app-subtitle">Society knowledge, resources and opportunities available to your account.</p><section className="workspace-welcome"><div><div className="eyebrow">Start with a search</div><h2>Find what<br /><em>you need.</em></h2><p>Search the society’s available sources, follow a reference or ask the EFDS assistant.</p><Link className="button button-paper" href="/dashboard/search">Search your workspace <ArrowUpRight size={16} /></Link></div><DisciplineGraphic type="data" /></section><section aria-label="Workspace shortcuts" className="workspace-shortcuts">{[
    { title: "Knowledge", text: "Explore the society guidance published for your access.", href: "/dashboard/knowledge", Icon: BookOpen },
    { title: "Search", text: "Find relevant information across your available sources.", href: "/dashboard/search", Icon: Search },
    { title: "Careers", text: "Find career resources and explore the available opportunities.", href: "/dashboard/careers", Icon: BriefcaseBusiness },
    { title: "Ask EFDS", text: "Ask a question and follow the evidence behind the answer.", href: "/dashboard/chat", Icon: MessagesSquare },
  ].map(({title,text,href,Icon}) => <Link className="surface workspace-shortcut" href={href} key={href}><Icon size={22} /><h2>{title}</h2><p>{text}</p><span>Explore <ArrowUpRight size={15} /></span></Link>)}</section><div className="surface workspace-note"><div><h2>Looking beyond the workspace?</h2><p>Explore society events and meet the people behind EFDS.</p></div><Link className="text-link" href="/events">See the society calendar <ArrowUpRight size={16} /></Link></div></div>;
}
