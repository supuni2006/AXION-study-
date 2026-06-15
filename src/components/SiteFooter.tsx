import { Link } from "@tanstack/react-router";
import { Github, Twitter, Linkedin, Sparkles, Mail, Brain, BookOpen, Users, Home, LogIn, Phone } from "lucide-react";
import { toast } from "sonner";

export function SiteFooter() {
  return (
    <footer className="mt-24 w-full">
      <div
        style={{
          background: "linear-gradient(135deg, oklch(0.14 0.06 240) 0%, oklch(0.10 0.04 220) 50%, oklch(0.13 0.05 250) 100%)",
          borderTop: "1px solid oklch(0.30 0.06 185 / 0.4)",
        }}
      >
        <div className="mx-auto w-[min(1200px,94%)] px-4 py-14">
          <div className="grid gap-10 md:grid-cols-4">

            {/* Brand col */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-hero shadow-glow">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </span>
                <span className="font-display text-xl font-bold text-white">LearnSync AI</span>
              </div>

              <p className="mt-4 max-w-xs text-sm leading-relaxed" style={{ color: "oklch(0.70 0.04 200)" }}>
                Personalized, adaptive learning powered by AI. Built for the next generation of curious minds.
              </p>

              {/* Stats row */}
              <div className="mt-6 flex gap-6">
                {[{ k: "120k+", v: "Learners" }, { k: "4.9★", v: "Rating" }, { k: "98%", v: "Loved it" }].map((s) => (
                  <div key={s.v}>
                    <div className="text-lg font-bold text-gradient">{s.k}</div>
                    <div className="text-xs" style={{ color: "oklch(0.55 0.04 200)" }}>{s.v}</div>
                  </div>
                ))}
              </div>

              {/* Newsletter */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const email = String(fd.get("email") ?? "").trim();
                  if (!email || !/.+@.+\..+/.test(email)) { toast.error("Enter a valid email"); return; }
                  toast.success("You're on the list!");
                  (e.currentTarget as HTMLFormElement).reset();
                }}
                className="mt-6 flex max-w-sm items-center gap-2"
              >
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "oklch(0.55 0.04 200)" }} />
                  <input
                    name="email" type="email" placeholder="you@school.edu"
                    style={{
                      width: "100%", borderRadius: "9999px",
                      border: "1px solid oklch(0.30 0.06 185 / 0.5)",
                      background: "oklch(0.18 0.04 240 / 0.8)",
                      padding: "0.55rem 1rem 0.55rem 2.25rem",
                      fontSize: "0.875rem", color: "white", outline: "none",
                    }}
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:scale-[1.03] transition-transform"
                >
                  Notify me
                </button>
              </form>
            </div>

            {/* Product */}
            <div>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: "oklch(0.62 0.15 185)" }}>
                Product
              </h4>
              <ul className="space-y-3">
                {[
                  { to: "/dashboard", icon: Home, label: "Dashboard" },
                  { to: "/quizzes", icon: BookOpen, label: "Quizzes" },
                  { to: "/assistant", icon: Brain, label: "AI Assistant" },
                  { to: "/admin", icon: Users, label: "Teacher panel" },
                ].map(({ to, icon: Icon, label }) => (
                  <li key={label}>
                    <Link
                      to={to as any}
                      className="flex items-center gap-2 text-sm transition-colors hover:text-white"
                      style={{ color: "oklch(0.65 0.04 200)" }}
                    >
                      <Icon className="h-3.5 w-3.5 opacity-70" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: "oklch(0.62 0.15 185)" }}>
                Company
              </h4>
              <ul className="space-y-3">
                {[
                  { to: "/team", icon: Users, label: "Our team" },
                  { to: "/contact", icon: Phone, label: "Contact" },
                  { to: "/auth", icon: LogIn, label: "Sign in", search: { mode: "signin" as const } },
                ].map(({ to, icon: Icon, label, search }) => (
                  <li key={label}>
                    <Link
                      to={to as any}
                      search={search as any}
                      className="flex items-center gap-2 text-sm transition-colors hover:text-white"
                      style={{ color: "oklch(0.65 0.04 200)" }}
                    >
                      <Icon className="h-3.5 w-3.5 opacity-70" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Hackathon badge */}
              <div
                className="mt-8 inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                style={{
                  background: "oklch(0.62 0.15 185 / 0.15)",
                  border: "1px solid oklch(0.62 0.15 185 / 0.3)",
                }}
              >
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                <span className="text-xs font-medium" style={{ color: "oklch(0.72 0.15 185)" }}>
                  Built for HackElite 3.0
                </span>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            className="mt-10 flex flex-col items-center justify-between gap-4 pt-6 text-xs sm:flex-row"
            style={{
              borderTop: "1px solid oklch(0.28 0.05 200 / 0.4)",
              color: "oklch(0.50 0.04 200)",
            }}
          >
            <p>© {new Date().getFullYear()} LearnSync AI · IEEE WIE HackElite 3.0 · IIT</p>
            <div className="flex gap-2">
              {[
                { href: "https://twitter.com", icon: Twitter, label: "Twitter" },
                { href: "https://github.com", icon: Github, label: "GitHub" },
                { href: "https://linkedin.com", icon: Linkedin, label: "LinkedIn" },
              ].map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-white"
                  style={{
                    display: "grid", placeItems: "center",
                    width: "32px", height: "32px", borderRadius: "9999px",
                    border: "1px solid oklch(0.30 0.05 200 / 0.4)",
                    color: "oklch(0.55 0.04 200)",
                  }}
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}