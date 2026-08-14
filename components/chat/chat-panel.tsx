"use client";

import { FormEvent, useState } from "react";
import { ArrowUp, LockKeyhole, Sparkles } from "lucide-react";
import type { AgentScope } from "@/types/domain";

type Citation = { id: string; title: string; source_type?: string; channel?: string | null; url?: string | null; path?: string | null; route?: string | null };
type ChatMessage = { role: "user" | "assistant"; text: string; citations?: Citation[] };

function citationLabel(citation: Citation) {
  if (citation.source_type === "slack_message") return `Slack — #${citation.channel ?? "channel"}`;
  if (citation.source_type === "document") return `Governance — ${citation.title}`;
  if (citation.source_type?.startsWith("operational_")) return `Decision — ${citation.title}`;
  if (citation.source_type?.startsWith("meeting_")) return `Committee meeting — ${citation.title}`;
  if (citation.source_type?.startsWith("knowledge_")) return `EFDS knowledge — ${citation.title}`;
  return `ICU — ${citation.title}`;
}

export function ChatPanel({ scope }: { scope: AgentScope }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", text: scope === "public" ? "Hi — I’m the EFDS public assistant. Ask me about events, careers, research or public resources." : "Private EFDS knowledge is scoped to your access. Ask a question about committee operations, a process or your career workspace." }]);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!input.trim() || loading) return;
    const message = input.trim();
    setInput(""); setLoading(true); setMessages((current) => [...current, { role: "user", text: message }]);
    try {
      const conversation = [...messages, { role: "user" as const, text: message }].slice(-4).map((item) => ({ role: item.role, content: item.text.slice(0, 2000) }));
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, scope, source_mode: "preterm_knowledge", conversation }) });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(typeof errorData.error === "string" ? errorData.error : "The assistant is unavailable right now.");
      }
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("text/event-stream")) {
        const data = await response.json();
        setMessages((current) => [...current, { role: "assistant", text: data.message ?? "I’m not ready to answer that yet." }]);
      } else {
        const reader = response.body?.getReader();
        if (!reader) throw new Error("The assistant returned an empty stream.");
        const decoder = new TextDecoder();
        let buffer = "";
        let answer = "";
        let citations: Citation[] = [];
        const append = () => setMessages((current) => {
          const next = [...current];
          const last = next[next.length - 1];
          if (last?.role === "assistant") next[next.length - 1] = { role: "assistant", text: answer, citations };
          else next.push({ role: "assistant", text: answer, citations });
          return next;
        });
        for (;;) {
          const { value, done } = await reader.read();
          buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";
          for (const event of events) {
            const dataLine = event.split("\n").find((line) => line.startsWith("data: "));
            if (!dataLine) continue;
            const data = JSON.parse(dataLine.slice(6));
            if (data.event === "token") answer += data.token ?? "";
            if (data.event === "citations") citations = data.citations ?? [];
            if (data.event === "done" && typeof data.answer === "string") answer = data.answer;
            if (data.event === "error") answer = data.error ?? "The assistant could not complete that request.";
            if (data.event !== "meta") append();
          }
          if (done) break;
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "The assistant is unavailable right now.";
      setMessages((current) => [...current, { role: "assistant", text: message }]);
    }
    setLoading(false);
  }

  return (
    <div className="chat-panel surface">
      <div className="panel-heading"><h2><Sparkles size={15} /> Ask EFDS</h2><span className="badge badge-mint">{scope} scope</span></div>
      <div className="chat-messages">{messages.map((message, index) => <div className={`chat-message ${message.role}`} key={`${message.role}-${index}`}><div>{message.text}</div>{message.citations?.length ? <div className="chat-citations">{message.citations.map((citation) => <small key={citation.id}>[{citation.id}] {citation.url ? <a href={citation.url} target="_blank" rel="noreferrer">{citationLabel(citation)}</a> : citation.route ? <a href={citation.route}>{citationLabel(citation)}</a> : <span>{citationLabel(citation)}{citation.path ? ` · ${citation.path}` : ""}</span>}</small>)}</div> : null}</div>)}{loading && <div className="chat-message assistant">Thinking…</div>}</div>
      <form className="chat-composer" onSubmit={submit}><input aria-label="Ask EFDS" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask a question…" /><button type="submit" aria-label="Send question"><ArrowUp size={16} /></button></form>
    </div>
  );
}

export function ChatScopeCard({ scope }: { scope: AgentScope }) {
  return <div className="scope-card surface"><div className="scope-lock"><LockKeyhole size={16} /></div><h2>{scope === "public" ? "Public knowledge only" : "Private workspace scope"}</h2><p>{scope === "public" ? "This assistant only searches approved public EFDS content. It cannot see committee or ICU records." : "Your retrieval scope is resolved from your server-side profile and role, never from the browser."}</p></div>;
}
