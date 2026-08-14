import { ChatPanel, ChatScopeCard } from "@/components/chat/chat-panel";
import { evaluateUserAccess, getAuthUser } from "@/lib/auth/server";
import { scopeForRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/config";

export default async function PrivateChatPage() {
  const user = isSupabaseConfigured ? await getAuthUser() : null;
  const access = isSupabaseConfigured ? await evaluateUserAccess(user) : null;
  const scope = access?.profile ? scopeForRole(access.profile.accessRole) : "member";
  return <div className="app-content"><div className="eyebrow">Private assistant</div><h1>Ask the<br />workspace.</h1><p className="app-subtitle">Ask about authorised ICU knowledge, committee documents and your EFDS workspace.</p><div className="chat-shell"><ChatPanel scope={scope} /><aside><ChatScopeCard scope={scope} /></aside></div></div>;
}
