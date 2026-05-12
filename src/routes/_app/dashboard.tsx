import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, Trophy, BookOpen, Sparkles, Clock, Target, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AXION" },
      { name: "description", content: "Your personalized learning dashboard with progress, recommendations, and streaks." },
    ],
  }),
  component: Dashboard,
});

const courses = [
  { title: "Calculus · Limits & Derivatives", progress: 72, color: "from-pink-400 to-yellow-300" },
  { title: "Intro to Machine Learning", progress: 45, color: "from-yellow-300 to-pink-400" },
  { title: "Organic Chemistry · Reactions", progress: 88, color: "from-pink-300 to-yellow-400" },
];

const recs = [
  { title: "Practice: Chain Rule MCQs", reason: "Weak spot detected", icon: Target },
  { title: "Watch: Neural Nets in 8 mins", reason: "Matches your style", icon: Sparkles },
  { title: "Revise: SN1 vs SN2", reason: "Quiz score < 60%", icon: TrendingUp },
];

const schedule = [
  { time: "09:00", task: "Calculus — Practice set", len: "45m" },
  { time: "11:00", task: "ML — Watch lecture 4", len: "30m" },
  { time: "16:00", task: "Chem — Adaptive quiz", len: "20m" },
  { time: "19:30", task: "AI Assistant — Doubts", len: "15m" },
];

const badges = ["7-Day Streak", "Quiz Master", "Early Bird", "Topic Crusher"];

function Dashboard() {
  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="glass flex flex-col items-start justify-between gap-4 rounded-3xl p-6 md:flex-row md:items-center">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <h1 className="text-3xl font-bold">Hey Alex 👋 <span className="text-gradient">let's learn.</span></h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <StatPill icon={Flame} label="Streak" value="14d" tone="primary" />
          <StatPill icon={Trophy} label="XP" value="3,420" tone="accent" />
          <StatPill icon={BookOpen} label="Courses" value="6" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recommendations */}
        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <SectionTitle icon={Sparkles}>AI Recommendations</SectionTitle>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {recs.map(({ title, reason, icon: Icon }) => (
              <div key={title} className="rounded-2xl border bg-card/70 p-4 transition hover:-translate-y-0.5 hover:border-primary/40">
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="mt-2 text-sm font-semibold">{title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{reason}</p>
              </div>
            ))}
          </div>
          <SectionTitle icon={BookOpen} className="mt-8">Recent Courses</SectionTitle>
          <div className="mt-4 space-y-3">
            {courses.map((c) => (
              <div key={c.title} className="rounded-2xl border bg-card/70 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{c.title}</span>
                  <span className="text-xs text-muted-foreground">{c.progress}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${c.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div className="glass rounded-3xl p-6">
          <SectionTitle icon={Clock}>Today's Plan</SectionTitle>
          <ul className="mt-4 space-y-3">
            {schedule.map((s) => (
              <li key={s.time} className="flex items-center gap-3 rounded-2xl border bg-card/70 p-3">
                <div className="grid h-10 w-12 place-items-center rounded-xl bg-primary/10 text-xs font-bold text-primary">{s.time}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{s.task}</p>
                  <p className="text-xs text-muted-foreground">{s.len}</p>
                </div>
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
