import { ChatPanel, ChatScopeCard } from "@/components/chat/chat-panel";

export default function PrivateChatPage() { return <div className="app-content"><div className="eyebrow">Private assistant</div><h1>Ask the<br />workspace.</h1><p className="app-subtitle">A future retrieval layer for authorised ICU knowledge, committee documents and your EFDS workspace.</p><div className="chat-shell"><ChatPanel scope="member" /><aside><ChatScopeCard scope="member" /></aside></div></div>; }
