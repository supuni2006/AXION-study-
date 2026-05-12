import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Timer, Zap, CheckCircle2, XCircle, Trophy, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/quizzes")({
  head: () => ({ meta: [{ title: "Adaptive Quizzes — AXION" }] }),
  component: Quizzes,
});

type Q = { q: string; options: string[]; answer: number; topic: string };
const bank: Q[] = [
  { q: "What is the derivative of sin(x)?", options: ["cos(x)", "-cos(x)", "tan(x)", "-sin(x)"], answer: 0, topic: "Calculus" },
  { q: "Which is NOT a JS primitive?", options: ["string", "number", "object", "boolean"], answer: 2, topic: "JavaScript" },
  { q: "Mitochondria is the…?", options: ["Brain", "Powerhouse", "Skeleton", "Lung"], answer: 1, topic: "Biology" },
  { q: "Big-O of binary search?", options: ["O(n)", "O(log n)", "O(n²)", "O(1)"], answer: 1, topic: "DSA" },
  { q: "H2O is composed of?", options: ["2H, 1O", "1H, 2O", "3H", "1H, 1O"], answer: 0, topic: "Chemistry" },
];

function Quizzes() {
  const { user } = useAuth();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(20);
  const [done, setDone] = useState(false);
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (done || picked !== null) return;
    if (time <= 0) { advance(false); return; }
    const t = setTimeout(() => setTime((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [time, picked, done]);

  const q = bank[i];

  function choose(idx: number) {
    if (picked !== null) return;
    setPicked(idx);
    const correct = idx === q.answer;
    if (correct) setScore((s) => s + 1);
    setDifficulty(correct ? "Hard" : "Easy");
    setTimeout(() => advance(correct), 700);
  }

  async function persist(finalScore: number) {
    if (!user) return;
    setSaving(true);
    const xp = finalScore * 50;
    const { error } = await supabase.from("quiz_attempts").insert({
      user_id: user.id,
      topic: "Mixed",
      score: finalScore,
      total: bank.length,
      difficulty,
      xp_earned: xp,
    });
    if (error) toast.error("Couldn't save attempt");
    else {
      // bump XP
      const { data: prof } = await supabase.from("profiles").select("xp").eq("id", user.id).single();
      if (prof) await supabase.from("profiles").update({ xp: (prof.xp ?? 0) + xp }).eq("id", user.id);
      toast.success(`+${xp} XP saved!`);
    }
    setSaving(false);
  }

  function advance(_c: boolean) {
    if (i + 1 >= bank.length) {
      setDone(true);
      const finalScore = score + (picked === q.answer ? 0 : 0); // score already updated in choose
      persist(score + (picked !== null && picked === q.answer ? 0 : 0));
      return;
    }
    setI((x) => x + 1);
    setPicked(null);
    setTime(20);
  }

  function reset() {
    setI(0); setPicked(null); setScore(0); setTime(20); setDone(false); setDifficulty("Medium");
  }

  if (done) {
    const pct = Math.round((score / bank.length) * 100);
    return (
      <div className="mx-auto max-w-xl pb-10">
        <div className="glass rounded-3xl p-10 text-center">
          <Trophy className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-3 text-3xl font-bold">Quiz complete!</h1>
          <div className="mt-3 text-6xl font-bold text-gradient">{pct}%</div>
          <p className="mt-2 text-sm text-muted-foreground">{score} / {bank.length} correct {saving && "· saving…"}</p>
          <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
            <Stat label="XP earned" value={`+${score * 50}`} />
            <Stat label="Accuracy" value={`${pct}%`} />
            <Stat label="Difficulty" value={difficulty} />
          </div>
          <button onClick={reset} className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow">
            <RotateCcw className="h-4 w-4" /> Try another set
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <div className="glass rounded-3xl p-6 sm:p-8">
        <div className="flex items-center justify-between text-sm">
          <span className="rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary">{q.topic}</span>
          <span className="rounded-full bg-accent/60 px-3 py-1 font-semibold text-accent-foreground"><Zap className="mr-1 inline h-3.5 w-3.5" /> {difficulty}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold"><Timer className="h-3.5 w-3.5" /> {time}s</span>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${(i / bank.length) * 100}%` }} />
        </div>
        <h1 className="mt-6 text-2xl font-bold leading-snug">{q.q}</h1>
        <div className="mt-6 grid gap-3">
          {q.options.map((opt, idx) => {
            const isPicked = picked === idx;
            const isAnswer = picked !== null && idx === q.answer;
            const isWrong = isPicked && idx !== q.answer;
            const tone = isAnswer ? "border-emerald-400 bg-emerald-50 text-emerald-700"
              : isWrong ? "border-rose-400 bg-rose-50 text-rose-700"
              : "border bg-card/70 hover:border-primary/40 hover:bg-primary/5";
            return (
              <button key={idx} disabled={picked !== null} onClick={() => choose(idx)}
                className={`flex items-center justify-between rounded-2xl px-4 py-3.5 text-left text-sm font-medium transition ${tone}`}>
                <span>{opt}</span>
                {isAnswer && <CheckCircle2 className="h-5 w-5" />}
                {isWrong && <XCircle className="h-5 w-5" />}
              </button>
            );
          })}
        </div>
        <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>Question {i + 1} of {bank.length}</span>
          <span>Score: <strong className="text-foreground">{score}</strong></span>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card/70 p-3">
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
