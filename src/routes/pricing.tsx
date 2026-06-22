import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Check, Minus, Sparkles, Brain, Trophy, ArrowRight,
  GraduationCap, BarChart3, MessageCircle, Flame,
} from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — LearnSync AI" },
      { name: "description", content: "Simple, transparent pricing for every learner." },
    ],
  }),
  component: PricingPage,
});

type Cycle = "monthly" | "yearly";

const plans = [
  {
    name: "Free",
    icon: Sparkles,
    accent: "#00d4aa",
    monthly: 0,
    yearly: 0,
    desc: "Get a feel for adaptive learning before you commit.",
    features: [
      "5 adaptive quizzes / day",
      "AI Study Assistant — limited replies",
      "Basic progress dashboard",
      "XP & streak tracking",
      "Public leaderboard access",
    ],
    cta: "Start for free",
    to: "/auth" as const,
    search: { mode: "signup" as const },
    highlight: false,
  },
  {
    name: "Pro",
    icon: Brain,
    accent: "#38bdf8",
    monthly: 9,
    yearly: 84, // $7/mo billed yearly
    desc: "Unlimited practice and the full AI tutor bench.",
    features: [
      "Unlimited adaptive quizzes",
      "All 3 AI tutors, unlimited replies",
      "AI Learning DNA profile",
      "Personalised weekly roadmap",
      "Weak-area detection & analytics",
      "Priority response times",
    ],
    cta: "Start 7-day free trial",
    to: "/auth" as const,
    search: { mode: "signup" as const },
    highlight: true,
  },
  {
    name: "Institution",
    icon: Trophy,
    accent: "#fb923c",
    monthly: null,
    yearly: null,
    desc: "For schools and coaching centres running whole cohorts.",
    features: [
      "Everything in Pro, per seat",
      "Teacher control centre",
      "PDF → AI quiz generation",
      "Class-wide progress analytics",
      "Custom branding",
      "Dedicated account manager",
    ],
    cta: "Talk to sales",
    to: "/contact" as const,
    search: undefined,
    highlight: false,
  },
];

// The "signature" element: a use-case led decision strip, not a numbered process.
const fits = [
  { icon: GraduationCap, who: "Studying for one exam", plan: "Free", note: "5 quizzes a day is plenty for a focused sprint." },
  { icon: Flame, who: "Building a daily habit", plan: "Pro", note: "Unlimited quizzes keep a streak alive without limits." },
  { icon: MessageCircle, who: "Stuck on a hard topic often", plan: "Pro", note: "All three tutors, no reply caps." },
  { icon: BarChart3, who: "Running a classroom", plan: "Institution", note: "See every student's weak spots in one view." },
];

const comparisonRows: { feature: string; values: [string, string, string] }[] = [
  { feature: "Adaptive quizzes", values: ["5 / day", "Unlimited", "Unlimited"] },
  { feature: "AI Study Assistant", values: ["Limited replies", "Unlimited", "Unlimited"] },
  { feature: "AI Learning DNA profile", values: ["—", "✓", "✓"] },
  { feature: "Progress analytics", values: ["Basic", "Advanced", "Advanced + class view"] },
  { feature: "Leaderboard", values: ["✓", "✓", "✓"] },
  { feature: "Teacher control centre", values: ["—", "—", "✓"] },
  { feature: "PDF → AI quiz generation", values: ["—", "—", "✓"] },
  { feature: "Custom branding", values: ["—", "—", "✓"] },
  { feature: "Support", values: ["Community", "Priority", "Dedicated manager"] },
];

const faqs = [
  { q: "Can I cancel anytime?", a: "Yes. There are no contracts. Cancel from your account settings whenever you like, and you'll keep Pro access until the end of the period you already paid for." },
  { q: "Do I need a card for the free plan?", a: "No. Free stays free with zero payment details on file." },
  { q: "What AI models power the tutors?", a: "All three tutor personas run on Claude by default. Add your own OpenAI or Gemini key in Assistant settings to switch a tutor to that model instead." },
  { q: "Is there a student discount?", a: "Yes — a valid .edu email gets 50% off Pro. Email us after signing up and we'll apply it." },
];

function formatPrice(n: number | null) {
  if (n === null) return "Custom";
  return `$${n}`;
}

function PricingPage() {
  const [cycle, setCycle] = useState<Cycle>("monthly");

  return (
    <div className="space-y-20 pb-16">

      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-[2rem] p-10 text-center md:p-16" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative">
          <span className="inline-block rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-bold tracking-wide text-white">
            PRICING
          </span>
          <h1 className="mx-auto mt-5 max-w-2xl text-4xl font-bold leading-[1.08] text-white sm:text-5xl">
            One plan to start. One to never hit a wall.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-white/75">
            Free covers a focused study sprint. Pro removes every limit. Pick based on how often you show up, not how much you can spend.
          </p>

          {/* Billing toggle */}
          <div className="mx-auto mt-8 inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/10 p-1">
            {(["monthly", "yearly"] as Cycle[]).map((c) => (
              <button
                key={c}
                onClick={() => setCycle(c)}
                className="relative rounded-full px-5 py-2 text-sm font-semibold transition-colors"
                style={{
                  color: cycle === c ? "var(--primary)" : "rgba(255,255,255,0.8)",
                  background: cycle === c ? "white" : "transparent",
                }}
              >
                {c === "monthly" ? "Monthly" : "Yearly"}
                {c === "yearly" && (
                  <span
                    className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      background: cycle === "yearly" ? "#00d4aa20" : "rgba(255,255,255,0.18)",
                      color: cycle === "yearly" ? "#00997f" : "white",
                    }}
                  >
                    SAVE 22%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Signature element: "which one fits you" strip ── */}
      <div>
        <h2 className="text-center text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Find your fit
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {fits.map(({ icon: Icon, who, plan, note }) => (
            <div key={who} className="glass flex flex-col gap-2 rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <p className="text-sm font-semibold leading-tight">{who}</p>
              </div>
              <p className="text-xs leading-snug text-muted-foreground">{note}</p>
              <span className="mt-auto inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
                → {plan}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Plans ── */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const price = cycle === "monthly" ? plan.monthly : plan.yearly;
          const perMonthEquivalent = cycle === "yearly" && plan.yearly !== null ? Math.round((plan.yearly / 12) * 100) / 100 : null;

          return (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-3xl p-7 transition-all hover:-translate-y-1 ${
                plan.highlight ? "glass ring-2 shadow-glow" : "glass hover:shadow-glow"
              }`}
              style={plan.highlight ? { "--tw-ring-color": plan.accent } as React.CSSProperties : undefined}
            >
              {plan.highlight && (
                <div
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold text-white shadow-glow"
                  style={{ background: plan.accent }}
                >
                  Most students pick this
                </div>
              )}

              <div
                className="grid h-12 w-12 place-items-center rounded-2xl text-white shadow-glow mb-4"
                style={{ background: plan.accent }}
              >
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold">{plan.name}</h2>

              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-4xl font-bold text-gradient">{formatPrice(price)}</span>
                {price !== null && price > 0 && (
                  <span className="text-sm text-muted-foreground">
                    /{cycle === "monthly" ? "mo" : "yr"}
                  </span>
                )}
                {price === 0 && <span className="text-sm text-muted-foreground">forever</span>}
              </div>
              {perMonthEquivalent !== null && perMonthEquivalent > 0 && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  works out to ${perMonthEquivalent.toFixed(2)}/mo
                </p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">{plan.desc}</p>

              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: plan.accent }} />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Link
                  to={plan.to}
                  search={plan.search as any}
                  className="flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition hover:scale-[1.02]"
                  style={
                    plan.highlight
                      ? { background: plan.accent, color: "white", boxShadow: "var(--shadow-glow)" }
                      : { border: "1px solid var(--border)", background: "var(--card)" }
                  }
                >
                  {plan.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Comparison table ── */}
      <div className="glass overflow-hidden rounded-3xl">
        <div className="border-b border-border/60 px-6 py-4">
          <h2 className="text-lg font-bold">Compare every feature</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">Feature</th>
                {plans.map((p) => (
                  <th
                    key={p.name}
                    className="px-6 py-3 text-center font-bold"
                    style={p.highlight ? { color: p.accent } : undefined}
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map(({ feature, values }) => (
                <tr key={feature} className="border-t transition hover:bg-muted/20">
                  <td className="px-6 py-3 font-medium">{feature}</td>
                  {values.map((v, i) => (
                    <td key={i} className="px-6 py-3 text-center">
                      {v === "—" ? (
                        <Minus className="mx-auto h-4 w-4 text-muted-foreground/50" />
                      ) : v === "✓" ? (
                        <Check className="mx-auto h-4 w-4 text-primary" />
                      ) : (
                        <span className={i === 1 ? "font-semibold text-primary" : ""}>{v}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className="mx-auto max-w-2xl">
        <h2 className="mb-8 text-center text-2xl font-bold">
          Questions, <span className="text-gradient">answered</span>
        </h2>
        <div className="space-y-4">
          {faqs.map(({ q, a }) => (
            <div key={q} className="glass rounded-2xl p-5">
              <h3 className="font-semibold">{q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom CTA ── */}
      <div className="relative overflow-hidden rounded-[2rem] p-10 text-center" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Start free. Upgrade the day you need to.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-white/75">
            Join 120,000+ students already learning with LearnSync AI.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="rounded-full bg-white px-8 py-3 text-sm font-bold transition-transform hover:scale-[1.03]"
              style={{ color: "var(--primary)" }}
            >
              Get started free →
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signin" }}
              className="rounded-full border border-white/40 bg-white/10 px-8 py-3 text-sm font-bold text-white transition hover:bg-white/20"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}