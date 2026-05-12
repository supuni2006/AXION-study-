import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Timer, Zap, CheckCircle2, XCircle, Trophy, RotateCcw, Flame, Brain, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/quizzes")({
  head: () => ({ meta: [{ title: "Adaptive Quizzes — AXION" }] }),
  component: Quizzes,
});

type Difficulty = "Easy" | "Medium" | "Hard";
type Q = { q: string; options: string[]; answer: number; topic: string };

const BANKS: Record<Difficulty, Q[]> = {
  Easy: [
    { q: "What is 12 + 7?", options: ["18", "19", "20", "21"], answer: 1, topic: "Arithmetic" },
    { q: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], answer: 1, topic: "Astronomy" },
    { q: "HTML stands for…?", options: ["Hyper Trainer Marking Language", "HyperText Markup Language", "HighText Machine Language", "None"], answer: 1, topic: "Web" },
    { q: "Water boils at (°C, sea level)?", options: ["80", "90", "100", "120"], answer: 2, topic: "Physics" },
    { q: "Capital of Japan?", options: ["Seoul", "Beijing", "Tokyo", "Bangkok"], answer: 2, topic: "Geography" },
    { q: "Largest mammal?", options: ["Elephant", "Blue whale", "Giraffe", "Hippo"], answer: 1, topic: "Biology" },
  ],
  Medium: [
    { q: "What is the derivative of sin(x)?", options: ["cos(x)", "-cos(x)", "tan(x)", "-sin(x)"], answer: 0, topic: "Calculus" },
    { q: "Which is NOT a JS primitive?", options: ["string", "number", "object", "boolean"], answer: 2, topic: "JavaScript" },
    { q: "Mitochondria is the…?", options: ["Brain", "Powerhouse", "Skeleton", "Lung"], answer: 1, topic: "Biology" },
    { q: "Big-O of binary search?", options: ["O(n)", "O(log n)", "O(n²)", "O(1)"], answer: 1, topic: "DSA" },
    { q: "H2O is composed of?", options: ["2H, 1O", "1H, 2O", "3H", "1H, 1O"], answer: 0, topic: "Chemistry" },
    { q: "SQL keyword to remove rows?", options: ["DROP", "REMOVE", "DELETE", "ERASE"], answer: 2, topic: "SQL" },
  ],
  Hard: [
    { q: "Time complexity of building a heap from n items?", options: ["O(n log n)", "O(n)", "O(log n)", "O(n²)"], answer: 1, topic: "DSA" },
    { q: "Integral of 1/x dx is?", options: ["x ln x", "ln|x| + C", "1/x² + C", "e^x + C"], answer: 1, topic: "Calculus" },
    { q: "In React, useEffect with [] runs…?", options: ["Every render", "Once after mount", "Never", "Before render"], answer: 1, topic: "React" },
    { q: "Heisenberg's principle relates…?", options: ["Energy & mass", "Position & momentum", "Time & charge", "Volume & temp"], answer: 1, topic: "Physics" },
    { q: "TCP handshake steps?", options: ["2", "3", "4", "5"], answer: 1, topic: "Networking" },
    { q: "Krebs cycle occurs in?", options: ["Cytoplasm", "Nucleus", "Mitochondrial matrix", "Ribosome"], answer: 2, topic: "Biology" },
  ],
};

const TIME_PER_DIFF: Record<Difficulty, number> = { Easy: 25, Medium: 20, Hard: 15 };
const XP_PER_CORRECT: Record<Difficulty, number> = { Easy: 30, Medium: 50, Hard: 80 };

function shuffle<T>(arr: T[]) { return [...arr].sort(() => Math.random() - 0.5); }

function Quizzes() {
  const { user } = useAuth();
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [bank, setBank] = useState<Q[]>([]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(20);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!difficulty || done || picked !== null) return;
    if (time <= 0) { advance(); return; }
    const t = setTimeout(() => setTime((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [time, picked, done, difficulty]);

  function start(d: Difficulty) {
    setDifficulty(d);
    setBank(shuffle(BANKS[d]).slice(0, 5));
    setI(0); setPicked(null); setScore(0); setDone(false);
    setTime(TIME_PER_DIFF[d]);
  }

  const q = bank[i];

  function choose(idx: number) {
    if (picked !== null) return;
    setPicked(idx);
    if (idx === q.answer) setScore((s) => s + 1);
    setTimeout(() => advance(), 800);
  }

  async function persist(finalScore: number) {
    if (!user || !difficulty) return;
    setSaving(true);
    const xp = finalScore * XP_PER_CORRECT[difficulty];
    const { error } = await supabase.from("quiz_attempts").insert({
      user_id: user.id, topic: "Mixed", score: finalScore, total: bank.length,
      difficulty, xp_earned: xp,
    });
    if (error) toast.error("Couldn't save attempt");
    else {
      const { data: prof } = await supabase.from("profiles").select("xp").eq("id", user.id).single();
      if (prof) await supabase.from("profiles").update({ xp: (prof.xp ?? 0) + xp }).eq("id", user.id);
      toast.success(`+${xp} XP saved!`);
    }
    setSaving(false);
  }

  function advance() {
    if (i + 1 >= bank.length) {
      setDone(true);
      persist(score + (picked !== null && picked === q.answer ? 0 : 0));
      return;
    }
    setI((x) => x + 1);
    setPicked(null);
    setTime(TIME_PER_DIFF[difficulty!]);
  }

  function reset() {
    setDifficulty(null); setBank([]); setI(0); setPicked(null); setScore(0); setDone(false);
  }

  // Difficulty picker
  if (!difficulty) {
    const cards: { d: Difficulty; icon: typeof Sparkles; gradient: string; desc: string }[] = [
      { d: "Easy", icon: Sparkles, gradient: "from-emerald-400 to-teal-500", desc: "Build confidence with the basics. 25s per question." },
      { d: "Medium", icon: Brain, gradient: "from-sky-400 to-indigo-500", desc: "Real practice problems. 20s per question." },
      { d: "Hard", icon: Flame, gradient: "from-amber-400 to-rose-500", desc: "Challenge mode for top scorers. 15s per question." },
    ];
    return (
      <div className="mx-auto max-w-4xl pb-10">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Pick your <span className="text-gradient">difficulty</span></h1>
          <p className="mt-2 text-sm text-muted-foreground">Each round pulls 5 fresh questions. Difficulty changes the timer & XP.</p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {cards.map(({ d, icon: Icon, gradient, desc }) => (
            <button key={d} onClick={() => start(d)}
              className="glass group rounded-3xl p-6 text-left transition hover:-translate-y-1">
              <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-glow`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-xl font-bold">{d}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">+{XP_PER_CORRECT[d]} XP each</span>
                <span className="text-muted-foreground">{BANKS[d].length} in bank</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
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
            <Stat label="XP earned" value={`+${score * XP_PER_CORRECT[difficulty]}`} />
            <Stat label="Accuracy" value={`${pct}%`} />
            <Stat label="Difficulty" value={difficulty} />
          </div>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button onClick={() => start(difficulty)} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow">
              <RotateCcw className="h-4 w-4" /> New {difficulty} set
            </button>
            <button onClick={reset} className="rounded-full border bg-card/70 px-6 py-3 text-sm font-semibold hover:bg-accent/40">
              Change difficulty
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <div className="glass rounded-3xl p-6 sm:p-8">
        <div className="flex items-center justify-between text-sm">
          <span className="rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary">{q.topic}</span>
          <span className="rounded-full bg-accent/60 px-3 py-1 font-semibold text-accent-foreground">
            <Zap className="mr-1 inline h-3.5 w-3.5" /> {difficulty}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold">
            <Timer className="h-3.5 w-3.5" /> {time}s
          </span>
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
