import Anthropic from "npm:@anthropic-ai/sdk@0.27.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPTS: Record<string, string> = {
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
- Use Socratic prompts when appropriate.
- Use markdown for clarity. Produce MCQs grouped by difficulty with explanations.`,
};

const QUESTION_SYSTEM = `You are an expert quiz generator for LearnSync AI.
Given study material, generate exactly 5 multiple-choice questions.
Return ONLY valid JSON — no markdown, no backticks, no preamble.
Format:
{
  "questions": [
    {
      "q": "Question text",
      "options": ["A", "B", "C", "D"],
      "answer": 0,
      "explanation": "Why this is correct"
    }
  ]
}
Rules:
- answer is the 0-based index of the correct option
- Always 4 options per question
- Explanations must be concise (1-2 sentences)
- Questions must be directly based on the provided material`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { mode, persona, messages, context } = body;

    const client = new Anthropic({
      apiKey: Deno.env.get("ANTHROPIC_API_KEY") ?? "",
    });

    // ── MODE: questions (admin PDF quiz generator) ──────────────────────────
    if (mode === "questions") {
      if (!context || context.trim().length < 40) {
        return new Response(JSON.stringify({ error: "Not enough context to generate questions" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: QUESTION_SYSTEM,
        messages: [
          {
            role: "user",
            content: `Generate 5 MCQs based on this material:\n\n${context.slice(0, 12000)}`,
          },
        ],
      });

      const text = message.content
        .filter((b: any) => b.type === "text")
        .map((b: any) => b.text)
        .join("");

      return new Response(JSON.stringify({ text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── MODE: chat (AI assistant streaming) ────────────────────────────────
    const systemPrompt = SYSTEM_PROMPTS[persona] ?? SYSTEM_PROMPTS.claude;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          const anthropicStream = client.messages.stream({
            model: "claude-sonnet-4-6",
            max_tokens: 1024,
            system: systemPrompt,
            messages: messages.map((m: { role: string; content: string }) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            })),
          });

          for await (const event of anthropicStream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const chunk = `data: ${JSON.stringify({
                choices: [{ delta: { content: event.delta.text } }],
              })}\n\n`;
              controller.enqueue(encoder.encode(chunk));
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (err) {
          console.error("Stream error:", err);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});