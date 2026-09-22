import Link from "next/link";
import { ArrowUpRight, BookOpen, BriefcaseBusiness, Search, MessagesSquare } from "lucide-react";
import { DisciplineGraphic } from "@/components/public/discipline-graphic";

export default function DashboardPage() {
  return <div className="app-content"><div className="eyebrow">Your society, connected</div><h1>Welcome to your workspace.</h1><p className="app-subtitle">A useful starting point for knowledge, opportunities and your next question.</p><section className="workspace-welcome"><div><div className="eyebrow">Think across boundaries</div><h2>Keep your<br /><em>curiosity moving.</em></h2><p>Find the information you need, explore a new direction or pick up a conversation.</p><Link className="button button-paper" href="/dashboard/search">Search your workspace <ArrowUpRight size={16} /></Link></div><DisciplineGraphic type="data" /></section><section aria-label="Workspace shortcuts" className="workspace-shortcuts">{[
    { title: "Knowledge", text: "Explore the society guidance published for your access.", href: "/dashboard/knowledge", Icon: BookOpen },
    { title: "Search", text: "Find relevant information across your available sources.", href: "/dashboard/search", Icon: Search },
    { title: "Careers", text: "Make a connection between your interests and your next step.", href: "/dashboard/careers", Icon: BriefcaseBusiness },
    { title: "Ask EFDS", text: "Ask a question and follow the evidence behind the answer.", href: "/dashboard/chat", Icon: MessagesSquare },
  ].map(({title,text,href,Icon}) => <Link className="surface workspace-shortcut" href={href} key={href}><Icon size={22} /><h2>{title}</h2><p>{text}</p><span>Explore <ArrowUpRight size={15} /></span></Link>)}</section><div className="surface workspace-note"><div><h2>Looking beyond the workspace?</h2><p>Explore society events and meet the people behind EFDS.</p></div><Link className="text-link" href="/events">See the society calendar <ArrowUpRight size={16} /></Link></div></div>;
}
