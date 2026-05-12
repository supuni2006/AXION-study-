import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Brain, Sparkles, Target, LineChart, Trophy, Bot, Quote,
  ArrowRight, GraduationCap, Zap, BookOpen,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AXION — Learn Smarter with AI" },
      { name: "description", content: "Personalized AI-powered education with adaptive quizzes, study plans, and your own AI study assistant." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Brain, title: "AI Learning DNA", desc: "Profiles your speed, style, and strengths to build a custom roadmap." },
  { icon: Target, title: "Adaptive Quizzes", desc: "Difficulty tunes itself in real-time to keep you in the flow zone." },
  { icon: LineChart, title: "Smart Analytics", desc: "Visualize trends, weak topics, and time-on-task at a glance." },
  { icon: Bot, title: "AI Study Assistant", desc: "Ask questions, summarize lessons, and generate practice MCQs." },
  { icon: Trophy, title: "Gamified Progress", desc: "XP, badges, streaks, and leaderboards keep momentum high." },
  { icon: Zap, title: "Personalized Plans", desc: "Daily schedules built around your goals and calendar." },
];

const steps = [
  { n: "01", title: "Take the DNA quiz", desc: "We map your style, pace, and goals in under 3 minutes." },
  { n: "02", title: "Get your roadmap", desc: "AI generates a personalized weekly study plan." },
  { n: "03", title: "Learn & adapt", desc: "Quizzes adjust as you grow — no boredom, no overwhelm." },
];

const testimonials = [
  { name: "Aanya R.", role: "Class 12 · JEE Aspirant", quote: "My weak topics were obvious in a week. Scores jumped 22% in a month." },
  { name: "Liam P.", role: "CS Undergrad", quote: "The AI assistant is like a tutor that's always online. Game changer." },
  { name: "Mei K.", role: "Med School", quote: "Adaptive quizzes saved me hours. Finally studying smart, not hard." },
];

function Landing() {
  return (
    <div className="space-y-28 pb-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[2rem]">
        <div className="glass relative rounded-[2rem] px-6 py-16 sm:px-12 sm:py-24">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/60 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-primary/40 blur-3xl" />
          <div className="relative mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" /> AI Learning DNA · New
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] sm:text-6xl">
              Learn Smarter with{" "}
              <span className="text-gradient">AI-Powered</span> Personalized Education
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
              AXION builds a study plan around <em>you</em> — your pace, your gaps, your goals.
              Adaptive quizzes, real analytics, and a 24/7 AI tutor.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/dashboard" className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.03]">
                Start Learning Free <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/assistant" className="inline-flex items-center gap-2 rounded-full border border-accent bg-accent/40 px-6 py-3 text-sm font-semibold text-accent-foreground hover:bg-accent/60">
                Try the AI Assistant
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-3 text-center">
              {[
                { k: "120k+", v: "Learners" },
                { k: "98%", v: "Loved it" },
                { k: "4.9★", v: "Avg rating" },
              ].map((s) => (
                <div key={s.v} className="rounded-2xl border bg-card/60 p-4 backdrop-blur">
                  <div className="text-2xl font-bold text-gradient">{s.k}</div>
                  <div className="text-xs text-muted-foreground">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section>
        <SectionHeader
          eyebrow="Features"
          title={<>Everything you need to <span className="text-gradient">study smarter</span></>}
          desc="A complete AI toolkit for personalized, adaptive learning."
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass group rounded-3xl p-6 transition-transform hover:-translate-y-1">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-hero text-primary-foreground shadow-glow">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section>
        <SectionHeader
          eyebrow="How it works"
          title={<>From confused to <span className="text-gradient">confident</span> in 3 steps</>}
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="glass rounded-3xl p-6">
              <div className="font-display text-5xl font-bold text-gradient">{s.n}</div>
              <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section>
        <SectionHeader
          eyebrow="Loved by learners"
          title={<>Stories from <span className="text-gradient">real students</span></>}
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.name} className="glass rounded-3xl p-6">
              <Quote className="h-6 w-6 text-primary" />
              <blockquote className="mt-3 text-sm leading-relaxed">"{t.quote}"</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-hero text-sm font-semibold text-primary-foreground">
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* About / CTA */}
      <section>
        <div className="glass relative overflow-hidden rounded-[2rem] p-10 text-center md:p-16">
          <div className="absolute inset-0 -z-10 opacity-60" style={{ background: "var(--gradient-soft)" }} />
          <GraduationCap className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Your <span className="text-gradient">AI study buddy</span> is ready.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Join thousands of students learning faster with personalized AI plans.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link to="/dashboard" className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow">
              Open Dashboard
            </Link>
            <Link to="/quizzes" className="rounded-full border border-accent bg-accent/50 px-6 py-3 text-sm font-semibold text-accent-foreground">
              <span className="inline-flex items-center gap-2"><BookOpen className="h-4 w-4" /> Try a Quiz</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ eyebrow, title, desc }: { eyebrow: string; title: React.ReactNode; desc?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{eyebrow}</span>
      <h2 className="mt-4 text-3xl font-bold sm:text-4xl">{title}</h2>
      {desc && <p className="mt-3 text-muted-foreground">{desc}</p>}
    </div>
  );
}
