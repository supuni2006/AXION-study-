import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Bot, Send, Sparkles, User, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/assistant")({
  head: () => ({
    meta: [{ title: "AI Assistant — AXION" }],
  }),
  component: Assistant,
});

type Msg = { role: "user" | "assistant"; content: string };

const suggestions = [
  "Explain recursion with an example",
  "Generate 5 MCQs on photosynthesis",
  "Summarize Newton's laws of motion",
  "Quiz me on JavaScript closures",
];

function Assistant() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I'm your AXION tutor. Ask me anything — concepts, summaries, or practice quizzes." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;
    let accum = "";
    const upsert = (chunk: string) => {
      accum += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last !== userMsg) {
          // replace the streaming assistant msg
          if (prev[prev.length - 1] === userMsg) {
            return [...prev, { role: "assistant", content: accum }];
          }
          // already streaming
          return prev.map((m, i) => (i === prev.length - 1 && m.role === "assistant" ? { ...m, content: accum } : m));
        }
        return [...prev, { role: "assistant", content: accum }];
      });
    };

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) }),
        signal: controller.signal,
      });

      if (resp.status === 429) { toast.error("Rate limited. Try again shortly."); setLoading(false); return; }
      if (resp.status === 402) { toast.error("AI credits exhausted. Add funds in workspace settings."); setLoading(false); return; }
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

  return (
    <div className="grid gap-6 pb-10 lg:grid-cols-[280px_1fr]">
      <aside className="glass rounded-3xl p-5">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-hero text-primary-foreground"><Sparkles className="h-4 w-4" /></span>
          <div>
            <p className="text-sm font-semibold">AI Study Assistant</p>
            <p className="text-xs text-muted-foreground">Powered by Lovable AI</p>
          </div>
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Try asking</p>
        <div className="mt-3 space-y-2">
          {suggestions.map((s) => (
            <button key={s} onClick={() => send(s)} disabled={loading}
              className="w-full rounded-2xl border bg-card/60 p-3 text-left text-sm transition hover:border-primary/40 hover:bg-primary/5 disabled:opacity-60">
              {s}
            </button>
          ))}
        </div>
      </aside>

      <section className="glass flex h-[70vh] flex-col rounded-3xl">
        <header className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <div className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /><h1 className="font-semibold">Tutor Chat</h1></div>
          <span className="rounded-full bg-accent/50 px-3 py-1 text-xs font-medium text-accent-foreground">{loading ? "Thinking…" : "Online"}</span>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {messages.map((m, i) => <Bubble key={i} m={m} />)}
          {loading && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> generating…</div>}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-2 border-t border-border/60 p-4">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything…"
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
        {m.content}
      </div>
    </div>
  );
}
