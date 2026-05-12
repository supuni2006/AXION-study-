import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Flame, Trophy, BookOpen, Sparkles, Clock, Target, TrendingUp,
  Wand2, FileText, Bot, ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AXION" },
      { name: "description", content: "Your personalized learning dashboard with progress, recommendations, and streaks." },
    ],
  }),
  component: Dashboard,
});

type Material = { id: string; title: string; subject: string; description: string | null; created_at: string };
type Attempt = { id: string; topic: string; score: number; total: number; difficulty: string; xp_earned: number; created_at: string };

const recs = [
  { title: "Practice: Chain Rule MCQs", reason: "Weak spot detected", icon: Target, prompt: "Generate 5 MCQs on the chain rule with worked solutions." },
  { title: "Watch: Neural Nets in 8 mins", reason: "Matches your style", icon: Sparkles, prompt: "Summarize neural networks in 8 minutes for a beginner." },
  { title: "Revise: SN1 vs SN2", reason: "Quiz score < 60%", icon: TrendingUp, prompt: "Explain SN1 vs SN2 with a comparison table and one example each." },
];

const schedule = [
  { time: "09:00", task: "Calculus — Practice set", len: "45m", to: "/quizzes" as const },
  { time: "11:00", task: "ML — Watch lecture 4", len: "30m", to: "/assistant" as const },
  { time: "16:00", task: "Chem — Adaptive quiz", len: "20m", to: "/quizzes" as const },
  { time: "19:30", task: "AI Assistant — Doubts", len: "15m", to: "/assistant" as const },
];

const badges = ["7-Day Streak", "Quiz Master", "Early Bird", "Topic Crusher"];

function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ full_name: string | null; xp: number; streak: number } | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: prof }, { data: mats }, { data: atts }] = await Promise.all([
        supabase.from("profiles").select("full_name, xp, streak").eq("id", user.id).maybeSingle(),
        supabase.from("materials").select("id, title, subject, description, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("quiz_attempts").select("id, topic, score, total, difficulty, xp_earned, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      ]);
      setProfile(prof ?? null);
      setMaterials(mats ?? []);
      setAttempts(atts ?? []);
    })();
  }, [user]);

  const firstName = (profile?.full_name ?? user?.email?.split("@")[0] ?? "learner").split(" ")[0];

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="glass flex flex-col items-start justify-between gap-4 rounded-3xl p-6 md:flex-row md:items-center">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <h1 className="text-3xl font-bold">Hey {firstName} 👋 <span className="text-gradient">let's learn.</span></h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <StatPill icon={Flame} label="Streak" value={`${profile?.streak ?? 0}d`} tone="primary" />
          <StatPill icon={Trophy} label="XP" value={(profile?.xp ?? 0).toLocaleString()} tone="accent" />
          <StatPill icon={BookOpen} label="Attempts" value={String(attempts.length)} />
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-3">
        <QuickAction to="/quizzes" icon={Wand2} title="Generate Quiz" desc="Easy · Medium · Hard" tone="primary" />
        <QuickAction to="/admin" icon={FileText} title="View Assignments" desc={`${materials.length} available`} />
        <QuickAction to="/assistant" icon={Bot} title="Ask AI Tutor" desc="ChatGPT · Gemini · Claude" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recommendations */}
        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <SectionTitle icon={Sparkles}>AI Recommendations</SectionTitle>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {recs.map(({ title, reason, icon: Icon, prompt }) => (
              <Link
                key={title}
                to="/assistant"
                search={{ q: prompt }}
                className="rounded-2xl border bg-card/70 p-4 transition hover:-translate-y-0.5 hover:border-primary/40"
              >
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="mt-2 text-sm font-semibold">{title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{reason}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  Open <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>

          <SectionTitle icon={FileText} className="mt-8">Assignments & Materials</SectionTitle>
          <div className="mt-4 space-y-2">
            {materials.length === 0 && (
              <div className="rounded-2xl border border-dashed bg-card/40 p-5 text-center">
                <p className="text-sm text-muted-foreground">No assignments published yet.</p>
                <Link to="/admin" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                  Open Teacher panel <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
            {materials.map((m) => (
              <Link
                key={m.id}
                to="/assistant"
                search={{ q: `Generate 5 MCQs from this material: "${m.title}" (${m.subject}). ${m.description ?? ""}` }}
                className="flex items-center justify-between gap-3 rounded-2xl border bg-card/70 p-4 transition hover:border-primary/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{m.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{m.subject} · {new Date(m.created_at).toLocaleDateString()}</p>
                </div>
                <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">Quiz me</span>
              </Link>
            ))}
          </div>

          <SectionTitle icon={BookOpen} className="mt-8">Recent Quiz Attempts</SectionTitle>
          <div className="mt-4 space-y-2">
            {attempts.length === 0 && (
              <p className="rounded-2xl border border-dashed bg-card/40 p-5 text-center text-sm text-muted-foreground">
                No attempts yet — <Link to="/quizzes" className="font-semibold text-primary hover:underline">take your first quiz</Link>.
              </p>
            )}
            {attempts.map((a) => {
              const pct = Math.round((a.score / Math.max(a.total, 1)) * 100);
              return (
                <div key={a.id} className="rounded-2xl border bg-card/70 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{a.topic} · <span className="text-muted-foreground">{a.difficulty}</span></span>
                    <span className="text-xs font-semibold text-primary">+{a.xp_earned} XP</span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{a.score}/{a.total}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Schedule */}
        <div className="glass rounded-3xl p-6">
          <SectionTitle icon={Clock}>Today's Plan</SectionTitle>
          <ul className="mt-4 space-y-3">
            {schedule.map((s) => (
              <li key={s.time}>
                <Link
                  to={s.to}
                  className="flex items-center gap-3 rounded-2xl border bg-card/70 p-3 transition hover:border-primary/40 hover:bg-primary/5"
                >
                  <div className="grid h-10 w-12 place-items-center rounded-xl bg-primary/10 text-xs font-bold text-primary">{s.time}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{s.task}</p>
                    <p className="text-xs text-muted-foreground">{s.len}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Analytics + Badges */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <SectionTitle icon={TrendingUp}>Weekly Analytics</SectionTitle>
          <BarChart />
        </div>
        <div className="glass rounded-3xl p-6">
          <SectionTitle icon={Trophy}>Achievements</SectionTitle>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {badges.map((b) => (
              <div key={b} className="rounded-2xl border bg-gradient-to-br from-primary/10 to-accent/30 p-4 text-center">
                <Trophy className="mx-auto h-6 w-6 text-primary" />
                <p className="mt-2 text-xs font-semibold">{b}</p>
              </div>
            ))}
          </div>
          <Link to="/quizzes" className="mt-5 flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow">
            Earn more XP →
          </Link>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ to, icon: Icon, title, desc, tone }: { to: "/quizzes" | "/admin" | "/assistant"; icon: any; title: string; desc: string; tone?: "primary" }) {
  const cls = tone === "primary"
    ? "bg-primary text-primary-foreground shadow-glow hover:scale-[1.02]"
    : "glass hover:-translate-y-0.5 hover:border-primary/40";
  return (
    <Link to={to} className={`flex items-center justify-between gap-3 rounded-3xl border p-5 transition ${cls}`}>
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-2xl ${tone === "primary" ? "bg-primary-foreground/20" : "bg-hero text-primary-foreground"}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-bold leading-tight">{title}</p>
          <p className={`text-xs ${tone === "primary" ? "opacity-80" : "text-muted-foreground"}`}>{desc}</p>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 opacity-70" />
    </Link>
  );
}

function SectionTitle({ icon: Icon, children, className = "" }: { icon: any; children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground ${className}`}>
      <Icon className="h-4 w-4 text-primary" /> {children}
    </h2>
  );
}

function StatPill({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone?: "primary" | "accent" }) {
  const cls = tone === "primary" ? "bg-primary text-primary-foreground" : tone === "accent" ? "bg-accent text-accent-foreground" : "bg-card border";
  return (
    <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-soft ${cls}`}>
      <Icon className="h-4 w-4" />
      <span className="opacity-80">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function BarChart() {
  const data = [40, 65, 50, 80, 72, 90, 60];
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div className="mt-5">
      <div className="flex h-44 items-end gap-3">
        {data.map((v, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t-xl bg-gradient-to-t from-primary to-accent transition-all hover:opacity-80"
                style={{ height: `${v}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{days[i]}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Minutes learned · last 7 days</p>
    </div>
  );
}
