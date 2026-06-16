import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, User, Loader2, MessageCircle, Brain, Wand2, FileText, Settings, X } from "lucide-react";
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
  chatgpt: `You are ChatGPT Tutor, an upbeat and clear study coach for LearnSync AI.
- Explain concepts step by step with simple analogies.
- Use markdown: headings, bullets, bold key terms, and code blocks when needed.
- When asked, generate practice MCQs with answers and brief explanations.
- Keep answers encouraging and concise.`,
  gemini: `You are Gemini Tutor, a structured and analytical tutor for LearnSync AI.
- Lead with a one-line summary, then a structured breakdown.
- Use tables when comparing. Use code blocks for code.
- For practice: generate MCQs with the correct answer flagged and a quick rationale.`,
  claude: `You are Claude Tutor — calm, careful, and warm. You work for LearnSync AI.
- Think briefly before answering hard questions.
- Use Socratic prompts ("Try this first…") when appropriate.
- Use markdown for clarity. Produce MCQs grouped by difficulty with explanations.`,
};

const suggestions = [
  "Explain recursion with an example",
  "Generate 5 MCQs on photosynthesis",
  "Summarize Newton's laws of motion",
  "Quiz me on JavaScript closures",
];

// ── Calls Supabase Edge Function (ai-chat) ──
async function callClaude(
  messages: Msg[],
  persona: Persona,
  onChunk: (chunk: string) => void,
  signal: AbortSignal
) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const response = await fetch(`${supabaseUrl}/functions/v1/ai-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({ persona, messages }),
    signal,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const parsed = JSON.parse(data);
        const chunk = parsed.choices?.[0]?.delta?.content;
        if (chunk) onChunk(chunk);
      } catch { /* ignore */ }
    }
  }
}

// ── Calls OpenAI or Gemini directly with user's own key ──
async function callOpenAICompat(
  url: string,
  apiKey: string,
  model: string,
  messages: Msg[],
  systemPrompt: string,
  onChunk: (chunk: string) => void,
  signal: AbortSignal
) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map(({ role, content }) => ({ role, content })),
      ],
    }),
    signal,
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error("Invalid API key");
    if (response.status === 429) throw new Error("Rate limited — try again shortly");
    throw new Error(`API error ${response.status}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const parsed = JSON.parse(data);
        const chunk = parsed.choices?.[0]?.delta?.content;
        if (chunk) onChunk(chunk);
      } catch { /* ignore */ }
    }
  }
}

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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const history = [...messages, userMsg];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;
    let accum = "";

    const onChunk = (chunk: string) => {
      accum += chunk;
      setMessages((prev) => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: accum } : m));
    };

    try {
      const systemPrompt = SYSTEM_PROMPTS[persona];

      if (persona === "chatgpt" && openAiKey.trim()) {
        await callOpenAICompat(
          "https://api.openai.com/v1/chat/completions",
          openAiKey.trim(), "gpt-4o-mini",
          history, systemPrompt, onChunk, controller.signal
        );
      } else if (persona === "gemini" && geminiKey.trim()) {
        await callOpenAICompat(
          "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
          geminiKey.trim(), "gemini-2.5-flash",
          history, systemPrompt, onChunk, controller.signal
        );
      } else {
        // Default: Supabase Edge Function
        await callClaude(history, persona, onChunk, controller.signal);
      }

      if (!accum.trim()) {
        setMessages((prev) => prev.map((m, i) =>
          i === prev.length - 1 ? { ...m, content: "Sorry, I didn't get a response. Please try again." } : m
        ));
      }
    } catch (e: any) {
      if (e.name === "AbortError") {
        setMessages((prev) => prev.map((m, i) =>
          i === prev.length - 1 ? { ...m, content: accum || "_(stopped)_" } : m
        ));
      } else {
        console.error(e);
        toast.error(e.message || "AI request failed. Please try again.");
        setMessages((prev) => prev.filter((_, i) => i !== prev.length - 1));
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function stop() { abortRef.current?.abort(); }
  function clearChat() {
    setMessages([{ role: "assistant", content: "Chat cleared! Ask me anything. 🎓" }]);
  }

  useEffect(() => {
    if (q && sentRef.current !== q) {
      sentRef.current = q;
      send(q);
    }
  }, [q]);

  const active = TEACHERS.find((t) => t.id === persona)!;

  return (
    <div className="grid gap-6 pb-10 lg:grid-cols-[300px_1fr]">

      {/* ── Sidebar ── */}
      <aside className="glass space-y-5 rounded-3xl p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Teachers</p>
          <div className="mt-3 space-y-2">
            {TEACHERS.map((t) => {
              const Icon = t.icon;
              const isActive = t.id === persona;
              const hasKey = t.id === "chatgpt" ? !!openAiKey.trim() : t.id === "gemini" ? !!geminiKey.trim() : true;
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
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{t.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{t.tag}</p>
                  </div>
                  <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-medium ${hasKey && t.id !== "claude" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                    {hasKey && t.id !== "claude" ? "Own key" : "Default"}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground leading-snug">
            All tutors use Claude by default. Add your own OpenAI/Gemini key below to use those models directly.
          </p>
        </div>

        {/* Suggestions */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Try asking</p>
          <div className="mt-3 space-y-2">
            {suggestions.map((s) => (
              <button key={s} onClick={() => send(s)} disabled={loading}
                className="w-full rounded-2xl border bg-card/60 p-3 text-left text-sm transition hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50">
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* API Keys */}
        <div className="border-t border-border/60 pt-4">
          <button
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
                <label className="font-semibold text-muted-foreground">OpenAI Key (for ChatGPT)</label>
                <input type="password" placeholder="sk-..." value={openAiKey}
                  onChange={(e) => { setOpenAiKey(e.target.value); localStorage.setItem("learnsync_openai_key", e.target.value); }}
                  className="w-full rounded-xl border bg-card px-3 py-2 outline-none focus:border-primary" />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Gemini Key (for Gemini)</label>
                <input type="password" placeholder="AIzaSy..." value={geminiKey}
                  onChange={(e) => { setGeminiKey(e.target.value); localStorage.setItem("learnsync_gemini_key", e.target.value); }}
                  className="w-full rounded-xl border bg-card px-3 py-2 outline-none focus:border-primary" />
              </div>
              <p className="text-[10px] leading-snug text-muted-foreground">
                Keys are saved in your browser only. If empty, Claude powers all tutors automatically.
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

      {/* ── Chat ── */}
      <section className="glass flex h-[78vh] flex-col rounded-3xl">
        <header className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${active.accent} text-white shadow-glow`}>
              <active.icon className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-bold leading-tight">{active.name}</h1>
              <p className="text-xs text-muted-foreground">{active.tag}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${loading ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
              {loading ? "Thinking…" : "Online"}
            </span>
            <button onClick={clearChat} title="Clear chat"
              className="rounded-full border p-1.5 text-muted-foreground hover:bg-accent/40 hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {messages.map((m, i) => <Bubble key={i} m={m} persona={active} />)}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              <span>{active.name} is thinking…</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="flex items-center gap-2 border-t border-border/60 p-4"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask ${active.name}…`}
            disabled={loading}
            className="flex-1 rounded-full border bg-card/70 px-5 py-3 text-sm outline-none focus:border-primary disabled:opacity-60"
          />
          {loading ? (
            <button type="button" onClick={stop}
              className="grid h-11 w-11 place-items-center rounded-full bg-destructive text-destructive-foreground hover:scale-105">
              <X className="h-4 w-4" />
            </button>
          ) : (
            <button type="submit" disabled={!input.trim()}
              className="grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow hover:scale-105 disabled:opacity-50">
              <Send className="h-4 w-4" />
            </button>
          )}
        </form>
      </section>
    </div>
  );
}

function Bubble({ m, persona }: { m: Msg; persona: typeof TEACHERS[0] }) {
  const isUser = m.role === "user";
  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-white ${isUser ? "bg-accent" : `bg-gradient-to-br ${persona.accent}`} shadow-glow`}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
        isUser ? "bg-primary text-primary-foreground" : "border bg-card/80"
      }`}>
        {m.content || (isUser ? "" : <span className="text-muted-foreground italic">…</span>)}
      </div>
    </div>
  );
}