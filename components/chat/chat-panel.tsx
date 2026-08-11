"use client";

import { FormEvent, useState } from "react";
import { ArrowUp, LockKeyhole, Sparkles } from "lucide-react";
import type { AgentScope } from "@/types/domain";

export function ChatPanel({ scope }: { scope: AgentScope }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([{ role: "assistant", text: scope === "public" ? "Hi — I’m the EFDS public assistant. Ask me about events, careers, research or public resources." : "Private EFDS knowledge is scoped to your access. Ask a question about committee operations, a process or your career workspace." }]);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!input.trim() || loading) return;
    const message = input.trim();
    setInput(""); setLoading(true); setMessages((current) => [...current, { role: "user", text: message }]);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, scope }) });
      const data = await response.json();
      setMessages((current) => [...current, { role: "assistant", text: data.message ?? "I’m not ready to answer that yet." }]);
    } catch { setMessages((current) => [...current, { role: "assistant", text: "The local assistant is unavailable right now. Try again in a moment." }]); }
    setLoading(false);
  }

  return (
    <div className="chat-panel surface">
      <div className="panel-heading"><h2><Sparkles size={15} /> Ask EFDS</h2><span className="badge badge-mint">{scope} scope</span></div>
      <div className="chat-messages">{messages.map((message, index) => <div className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>{message.text}</div>)}{loading && <div className="chat-message assistant">Thinking…</div>}</div>
      <form className="chat-composer" onSubmit={submit}><input aria-label="Ask EFDS" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask a question…" /><button type="submit" aria-label="Send question"><ArrowUp size={16} /></button></form>
    </div>
  );
}

export function ChatScopeCard({ scope }: { scope: AgentScope }) {
  return <div className="scope-card surface"><div className="scope-lock"><LockKeyhole size={16} /></div><h2>{scope === "public" ? "Public knowledge only" : "Private workspace scope"}</h2><p>{scope === "public" ? "This assistant only searches approved public EFDS content. It cannot see committee or ICU records." : "Your future retrieval scope will be resolved from your server-side profile and role, never from the browser."}</p></div>;
}
