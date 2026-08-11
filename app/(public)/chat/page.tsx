import { ChatPanel, ChatScopeCard } from "@/components/chat/chat-panel";

export default function PublicChatPage() { return <main><section className="container page-intro"><div className="eyebrow">Public EFDS assistant</div><h1 className="display">Ask a better<br />starting question.</h1><p>Explore EFDS events, careers, research and public resources. This assistant stays inside approved public content.</p></section><section className="section-tight"><div className="container chat-shell"><ChatPanel scope="public" /><aside><ChatScopeCard scope="public" /></aside></div></section></main>; }
