import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, User, Loader2, MessageCircle, Brain, Wand2, FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/assistant")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s.q === "string" ? s.q : undefined }),
  head: () => ({ meta: [{ title: "AI Assistant — AXION" }] }),
  component: Assistant,
});

type Msg = { role: "user" | "assistant"; content: string };
type Persona = "chatgpt" | "gemini" | "claude";

const TEACHERS: { id: Persona; name: string; tag: string; icon: typeof Bot; accent: string }[] = [
  { id: "chatgpt", name: "ChatGPT Tutor", tag: "Friendly · Step-by-step", icon: MessageCircle, accent: "from-emerald-400 to-teal-500" },
  { id: "gemini", name: "Gemini Tutor", tag: "Structured · Analytical", icon: Sparkles, accent: "from-sky-400 to-indigo-500" },
  { id: "claude", name: "Claude Tutor", tag: "Calm · Socratic", icon: Brain, accent: "from-amber-400 to-rose-500" },
];

const suggestions = [
  "Explain recursion with an example",
  "Generate 5 MCQs on photosynthesis",
  "Summarize Newton's laws of motion",
  "Quiz me on JavaScript closures",
];

function Assistant() {
  const [persona, setPersona] = useState<Persona>("chatgpt");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! Pick a teacher on the left, then ask anything — concepts, summaries, or practice quizzes." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;
    let accum = "";
    const upsert = (chunk: string) => {
      accum += chunk;
      setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: accum } : m)));
    };

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          persona,
          messages: next.map(({ role, content }) => ({ role, content })),
        }),
        signal: controller.signal,
      });

      if (resp.status === 429) { toast.error("Rate limited. Try again shortly."); return; }
      if (resp.status === 402) { toast.error("AI credits exhausted."); return; }
      if (!resp.ok || !resp.body) throw new Error("Stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;
      while (!done) {
        const { value, done: d } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(data);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        console.error(e);
        toast.error("AI request failed");
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  const active = TEACHERS.find((t) => t.id === persona)!;

  return (
    <div className="grid gap-6 pb-10 lg:grid-cols-[300px_1fr]">
      <aside className="glass space-y-5 rounded-3xl p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Teachers</p>
          <div className="mt-3 space-y-2">
            {TEACHERS.map((t) => {
              const Icon = t.icon;
              const isActive = t.id === persona;
              return (
                <button
                  key={t.id}
                  onClick={() => setPersona(t.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                    isActive ? "border-primary/60 bg-primary/5 ring-soft" : "bg-card/60 hover:border-primary/30 hover:bg-primary/5"
                  }`}
                >
                  <span className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${t.accent} text-white shadow-glow`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{t.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{t.tag}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Try asking</p>
          <div className="mt-3 space-y-2">
            {suggestions.map((s) => (
              <button key={s} onClick={() => send(s)} disabled={loading}
                className="w-full rounded-2xl border bg-card/60 p-3 text-left text-sm transition hover:border-primary/40 hover:bg-primary/5 disabled:opacity-60">
                {s}
              </button>
            ))}
          </div>
        </div>

        <Link to="/admin"
          className="flex items-center gap-2 rounded-2xl border bg-card/60 p-3 text-sm hover:border-primary/40 hover:bg-primary/5">
          <FileText className="h-4 w-4 text-primary" />
          <span>Upload PDF → AI quiz</span>
          <Wand2 className="ml-auto h-4 w-4 text-muted-foreground" />
        </Link>
      </aside>

      <section className="glass flex h-[72vh] flex-col rounded-3xl">
        <header className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${active.accent} text-white shadow-glow`}>
              <active.icon className="h-4 w-4" />
            </span>
            <div>
              <h1 className="font-semibold leading-tight">{active.name}</h1>
              <p className="text-xs text-muted-foreground">{active.tag}</p>
            </div>
          </div>
          <span className="rounded-full bg-accent/50 px-3 py-1 text-xs font-medium text-accent-foreground">{loading ? "Thinking…" : "Online"}</span>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {messages.map((m, i) => <Bubble key={i} m={m} />)}
          {loading && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> generating…</div>}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-2 border-t border-border/60 p-4">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Ask ${active.name}…`}
            className="flex-1 rounded-full border bg-card/70 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-soft" />
          <button type="submit" disabled={loading}
            className="grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow hover:scale-105 disabled:opacity-60">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </section>
    </div>
  );
}

function Bubble({ m }: { m: Msg }) {
  const isUser = m.role === "user";
  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${isUser ? "bg-accent text-accent-foreground" : "bg-hero text-primary-foreground"}`}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={`max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser ? "bg-primary text-primary-foreground" : "border bg-card/80"}`}>
        {m.content || (isUser ? "" : "…")}
      </div>
    </div>
  );
}
