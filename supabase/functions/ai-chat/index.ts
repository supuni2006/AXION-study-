// Streaming AI tutor — Lovable AI Gateway. Supports model + persona switching.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PERSONAS: Record<string, { model: string; system: string; label: string }> = {
  chatgpt: {
    label: "ChatGPT Tutor",
    model: "openai/gpt-5-mini",
    system: `You are ChatGPT Tutor, an upbeat and clear study coach.
- Explain concepts step by step with simple analogies.
- Use markdown headings, bullets, and short code blocks.
- When asked, generate practice MCQs with answers + brief explanations.
- Keep answers tight and encouraging.`,
  },
  gemini: {
    label: "Gemini Tutor",
    model: "google/gemini-2.5-flash",
    system: `You are Gemini Tutor, a thoughtful, structured tutor with strong reasoning.
- Lead with a one-line summary, then a structured breakdown.
- Use tables when comparing things. Use code blocks for code.
- For practice: generate MCQs with the correct answer flagged and a quick rationale.`,
  },
  claude: {
    label: "Claude Tutor",
    model: "openai/gpt-5-mini",
    system: `You are Claude Tutor — calm, careful, and warm. Prioritize accuracy and nuance.
- Think out loud briefly before answering hard questions.
- Use markdown and Socratic prompts ("Try this first…") when appropriate.
- For practice: produce MCQs grouped by difficulty with brief explanations.`,
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, persona = "chatgpt", mode = "chat", context = "" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const p = PERSONAS[persona] ?? PERSONAS.chatgpt;
    let system = p.system;
    if (mode === "questions") {
      system = `${p.system}

You will receive study material. Generate exactly 5 high-quality multiple-choice questions covering it.
Return ONLY valid JSON with this exact shape (no markdown, no commentary):
{ "questions": [ { "q": "string", "options": ["a","b","c","d"], "answer": 0, "explanation": "string" } ] }
"answer" is the 0-based index of the correct option.`;
    }
    const sysContent = context ? `${system}\n\nMATERIAL:\n${context}` : system;

    const stream = mode !== "questions";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: p.model,
        messages: [{ role: "system", content: sysContent }, ...messages],
        stream,
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in workspace settings." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!stream) {
      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content ?? "";
      return new Response(JSON.stringify({ text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
