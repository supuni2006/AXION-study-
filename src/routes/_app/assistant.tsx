import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, User, Loader2, MessageCircle, Brain, Wand2, FileText, Settings } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/assistant")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s.q === "string" ? s.q : undefined }),
  head: () => ({ meta: [{ title: "AI Assistant — LearnSync AI" }] }),
  component: Assistant,
});

type Msg = { role: "user" | "assistant"; content: string };
type Persona = "chatgpt" | "gemini" | "claude";

const TEACHERS: { id: Persona; name: string; tag: string; icon: typeof Bot; accent: string }[] = [
  { id: "chatgpt", name: "ChatGPT Tutor", tag: "Friendly · Step-by-step", icon: MessageCircle, accent: "from-emerald-400 to-teal-500" },
  { id: "gemini", name: "Gemini Tutor", tag: "Structured · Analytical", icon: Sparkles, accent: "from-sky-400 to-indigo-500" },
  { id: "claude", name: "Claude Tutor", tag: "Calm · Socratic", icon: Brain, accent: "from-amber-400 to-rose-500" },
];

const SYSTEM_PROMPTS: Record<Persona, string> = {
  chatgpt: `You are ChatGPT Tutor, an upbeat and clear study coach.
- Explain concepts step by step with simple analogies.
- Use markdown headings, bullets, and short code blocks.
- When asked, generate practice MCQs with answers + brief explanations.
- Keep answers tight and encouraging.`,
  gemini: `You are Gemini Tutor, a thoughtful, structured tutor with strong reasoning.
- Lead with a one-line summary, then a structured breakdown.
- Use tables when comparing things. Use code blocks for code.
- For practice: generate MCQs with the correct answer flagged and a quick rationale.`,
  claude: `You are Claude Tutor — calm, careful, and warm. Prioritize accuracy and nuance.
- Think out loud briefly before answering hard questions.
- Use markdown and Socratic prompts ("Try this first…") when appropriate.
- For practice: produce MCQs grouped by difficulty with brief explanations.`,
};

const suggestions = [
  "Explain recursion with an example",
  "Generate 5 MCQs on photosynthesis",
  "Summarize Newton's laws of motion",
  "Quiz me on JavaScript closures",
];

function Assistant() {
  const { q } = Route.useSearch();
  const [persona, setPersona] = useState<Persona>("chatgpt");
  const [openAiKey, setOpenAiKey] = useState(() => localStorage.getItem("learnsync_openai_key") || "");
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem("learnsync_gemini_key") || "");
  const [showKeys, setShowKeys] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! Pick a teacher on the left, then ask anything — concepts, summaries, or practice quizzes." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const sentRef = useRef<string | null>(null);

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
      const activeKey = persona === "chatgpt" ? openAiKey : persona === "gemini" ? geminiKey : "";
      const isDirectAPI = !!(activeKey.trim() && (persona === "chatgpt" || persona === "gemini"));

      let url = "";
      let headers: Record<string, string> = { "Content-Type": "application/json" };
      let body: any = null;

      if (isDirectAPI) {
        if (persona === "chatgpt") {
          url = "https://api.openai.com/v1/chat/completions";
          body = {
            model: "gpt-4o-mini",
            messages: [{ role: "system", content: SYSTEM_PROMPTS.chatgpt }, ...next.map(({ role, content }) => ({ role, content }))],
            stream: true,
          };
        } else {
          url = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
          body = {
            model: "gemini-2.5-flash",
            messages: [{ role: "system", content: SYSTEM_PROMPTS.gemini }, ...next.map(({ role, content }) => ({ role, content }))],
            stream: true,
          };
        }
        headers["Authorization"] = `Bearer ${activeKey.trim()}`;
      } else {
        url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
        headers["Authorization"] = `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`;
        body = {
          persona,
          messages: next.map(({ role, content }) => ({ role, content })),
        };
      }

      const resp = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (resp.status === 429) { toast.error("Rate limited. Try again shortly."); return; }
      if (resp.status === 402) { toast.error("AI credits exhausted."); return; }
      if (!resp.ok) {
        if (isDirectAPI && resp.status === 401) {
          toast.error("Unauthorized: Invalid API key.");
          return;
        }
        throw new Error("Stream failed");
      }
      if (!resp.body) throw new Error("Stream failed");

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
        toast.error("AI request failed. Please check your API key, connection, or quota.");
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  useEffect(() => {
    if (q && sentRef.current !== q) {
      sentRef.current = q;
      send(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

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

        <div className="border-t border-border/60 pt-4">
          <button
            type="button"
            onClick={() => setShowKeys(!showKeys)}
            className="flex w-full items-center gap-2 rounded-2xl border bg-card/60 p-3 text-sm hover:border-primary/40 hover:bg-primary/5"
          >
            <Settings className="h-4 w-4 text-primary" />
            <span className="font-semibold">API Keys Settings</span>
            <span className="ml-auto text-xs text-muted-foreground">{showKeys ? "Hide" : "Edit"}</span>
          </button>
          {showKeys && (
            <div className="mt-3 space-y-3 rounded-2xl border bg-card/40 p-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">OpenAI Key (ChatGPT)</label>
                <input
                  type="password"
                  placeholder="sk-..."
                  value={openAiKey}
                  onChange={(e) => {
                    setOpenAiKey(e.target.value);
                    localStorage.setItem("learnsync_openai_key", e.target.value);
                  }}
                  className="w-full rounded-xl border bg-card px-3 py-2 outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Gemini Key (Google)</label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={geminiKey}
                  onChange={(e) => {
                    setGeminiKey(e.target.value);
                    localStorage.setItem("learnsync_gemini_key", e.target.value);
                  }}
                  className="w-full rounded-xl border bg-card px-3 py-2 outline-none focus:border-primary"
                />
              </div>
              <p className="text-[10px] leading-snug text-muted-foreground">
                Saved locally. If empty, the system defaults to the pre-configured server API.
              </p>
            </div>
          )}
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
