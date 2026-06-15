import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Brain, Sparkles, Target, LineChart, Trophy, Bot, Quote,
  ArrowRight, GraduationCap, Zap, BookOpen, Star, Users,
  CheckCircle, Flame, Shield, Clock,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LearnSync AI — Learn Smarter with AI" },
      { name: "description", content: "Personalized AI-powered education with adaptive quizzes, study plans, and your own AI study assistant." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Brain, title: "AI Learning DNA", desc: "Profiles your speed, style, and strengths to build a custom roadmap.", color: "#00d4aa" },
  { icon: Target, title: "Adaptive Quizzes", desc: "Difficulty tunes itself in real-time to keep you in the flow zone.", color: "#38bdf8" },
  { icon: LineChart, title: "Smart Analytics", desc: "Visualize trends, weak topics, and time-on-task at a glance.", color: "#00d4aa" },
  { icon: Bot, title: "AI Study Assistant", desc: "Ask questions, summarize lessons, and generate practice MCQs.", color: "#7dd3fc" },
  { icon: Trophy, title: "Gamified Progress", desc: "XP, badges, streaks, and leaderboards keep momentum high.", color: "#00d4aa" },
  { icon: Zap, title: "Personalized Plans", desc: "Daily schedules built around your goals and calendar.", color: "#38bdf8" },
];

const steps = [
  { n: "01", title: "Take the DNA quiz", desc: "We map your style, pace, and goals in under 3 minutes.", icon: Brain },
  { n: "02", title: "Get your roadmap", desc: "AI generates a personalized weekly study plan.", icon: Zap },
  { n: "03", title: "Learn & adapt", desc: "Quizzes adjust as you grow — no boredom, no overwhelm.", icon: Trophy },
];

const testimonials = [
  { name: "Aanya R.", role: "Class 12 · JEE Aspirant", quote: "My weak topics were obvious in a week. Scores jumped 22% in a month.", stars: 5 },
  { name: "Liam P.", role: "CS Undergrad", quote: "The AI assistant is like a tutor that's always online. Game changer.", stars: 5 },
  { name: "Mei K.", role: "Med School", quote: "Adaptive quizzes saved me hours. Finally studying smart, not hard.", stars: 5 },
];

function useTypewriter(words: string[], speed = 90) {
  const [displayed, setDisplayed] = useState("");
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const word = words[wordIdx % words.length];
    const t = setTimeout(() => {
      if (!deleting) {
        setDisplayed(word.slice(0, charIdx + 1));
        if (charIdx + 1 === word.length) setTimeout(() => setDeleting(true), 1800);
        else setCharIdx(c => c + 1);
      } else {
        setDisplayed(word.slice(0, charIdx - 1));
        if (charIdx - 1 === 0) { setDeleting(false); setWordIdx(w => w + 1); setCharIdx(0); }
        else setCharIdx(c => c - 1);
      }
    }, deleting ? 45 : speed);
    return () => clearTimeout(t);
  }, [charIdx, deleting, wordIdx, words, speed]);
  return displayed;
}

function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const resize = () => { c.width = c.offsetWidth; c.height = c.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);
    const pts = Array.from({ length: 80 }, () => ({
      x: Math.random() * c.width, y: Math.random() * c.height,
      r: Math.random() * 2.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.5, dy: (Math.random() - 0.5) * 0.5,
      a: Math.random() * 0.7 + 0.2,
    }));
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      pts.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,212,170,${p.a})`; ctx.fill();
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > c.width) p.dx *= -1;
        if (p.y < 0 || p.y > c.height) p.dy *= -1;
      });
      pts.forEach((a, i) => pts.slice(i + 1).forEach(b => {
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 120) {
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(0,196,180,${0.15 * (1 - d / 120)})`; ctx.lineWidth = 0.8; ctx.stroke();
        }
      }));
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}

function Landing() {
  const [in_, setIn] = useState(false);
  const typed = useTypewriter(["study smarter ✦", "ace your exams ✦", "learn with AI ✦", "build skills fast ✦"]);
  useEffect(() => { setTimeout(() => setIn(true), 80); }, []);

  const fade = (delay: number): React.CSSProperties => ({
    opacity: in_ ? 1 : 0,
    transform: in_ ? "translateY(0)" : "translateY(28px)",
    transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
  });

  return (
    // Breakout wrapper — escapes the parent mx-auto w-[min(1200px,94%)] constraint
    <div style={{
      position: "relative",
      left: "50%",
      right: "50%",
      marginLeft: "-50vw",
      marginRight: "-50vw",
      width: "100vw",
      overflow: "clip",
    }}>
      <style>{`
        @keyframes orb1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(25px,-20px) scale(1.06)} 66%{transform:translate(-15px,18px) scale(0.96)} }
        @keyframes gradShift { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes floatUp { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      {/* ══════════ HERO ══════════ */}
      <section style={{
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(135deg, #020d14 0%, #051824 40%, #060f1a 70%, #040b12 100%)",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        marginBottom: "6rem",
      }}>
        <ParticleCanvas />

        <div style={{ position: "absolute", top: "-10%", right: "-5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,196,180,0.18) 0%, transparent 65%)", animation: "orb1 9s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "-15%", left: "-5%", width: 450, height: 450, borderRadius: "50%", background: "radial-gradient(circle, rgba(56,189,248,0.14) 0%, transparent 65%)", animation: "orb1 11s ease-in-out infinite reverse" }} />
        <div style={{ position: "absolute", top: "40%", left: "20%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,212,170,0.08) 0%, transparent 65%)", animation: "orb1 7s ease-in-out infinite 2s" }} />
        <div style={{
          position: "absolute", inset: 0, opacity: 0.04,
          backgroundImage: "linear-gradient(rgba(0,212,170,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,170,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        <div style={{ position: "relative", zIndex: 1, width: "100%", padding: "8rem 2rem 5rem", textAlign: "center" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>

            <div style={{ ...fade(0), display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,196,180,0.1)", border: "1px solid rgba(0,196,180,0.35)", borderRadius: 99, padding: "6px 16px", marginBottom: 32 }}>
              <Sparkles size={14} color="#00d4aa" style={{ animation: "spin 3s linear infinite" }} />
              <span style={{ color: "#00d4aa", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em" }}>AI LEARNING DNA · NEW FEATURE</span>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#00d4aa", animation: "pulse 1.5s infinite" }} />
            </div>

            <h1 style={{ ...fade(150), color: "#ffffff", fontSize: "clamp(2.8rem, 6vw, 5.5rem)", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em", margin: "0 0 1rem" }}>
              Learn Smarter with
              <br />
              <span style={{
                background: "linear-gradient(120deg, #00d4aa, #38bdf8, #00ffd0)",
                WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
                backgroundSize: "200% auto", animation: "gradShift 4s linear infinite",
              }}>
                AI-Powered
              </span>{" "}
              <span style={{ color: "#ffffff" }}>Education</span>
            </h1>

            <div style={{ ...fade(300), fontSize: "1.4rem", fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: "1.25rem", minHeight: "2rem" }}>
              Ready to{" "}
              <span style={{ background: "linear-gradient(90deg, #00d4aa, #38bdf8)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
                {typed}
              </span>
              <span style={{ display: "inline-block", width: 2, height: "1.2rem", background: "#00d4aa", marginLeft: 2, verticalAlign: "middle", animation: "blink 1s step-end infinite" }} />
            </div>

            <p style={{ ...fade(450), color: "rgba(255,255,255,0.55)", fontSize: "1.1rem", lineHeight: 1.7, maxWidth: 620, margin: "0 auto 2.5rem" }}>
              LearnSync AI builds a study plan around{" "}
              <strong style={{ color: "#00d4aa" }}>you</strong> — your pace, your gaps, your goals.
              Adaptive quizzes, real analytics, and a 24/7 AI tutor.
            </p>

            <div style={{ ...fade(600), display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center", marginBottom: "1.5rem" }}>
              <Link to="/auth" search={{ mode: "signup" }} style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "linear-gradient(135deg, #00c4b4, #0099d4)",
                border: "none", borderRadius: 99, padding: "14px 32px",
                color: "#fff", fontSize: "0.95rem", fontWeight: 700, textDecoration: "none",
                boxShadow: "0 0 30px rgba(0,196,180,0.4), 0 8px 32px rgba(0,0,0,0.3)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.06)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 50px rgba(0,196,180,0.6), 0 8px 32px rgba(0,0,0,0.4)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 30px rgba(0,196,180,0.4), 0 8px 32px rgba(0,0,0,0.3)"; }}
              >
                <Sparkles size={16} /> Start Learning Free <ArrowRight size={16} />
              </Link>
              <Link to="/auth" search={{ mode: "signup" }} style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(0,196,180,0.4)",
                borderRadius: 99, padding: "14px 32px", color: "#7dd3fc",
                fontSize: "0.95rem", fontWeight: 700, textDecoration: "none",
                backdropFilter: "blur(12px)", transition: "all 0.2s",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,196,180,0.12)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,196,180,0.7)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,196,180,0.4)"; }}
              >
                <Bot size={16} /> Try the AI Assistant
              </Link>
            </div>

            <div style={{ ...fade(750), display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 20, marginBottom: "3rem" }}>
              {["No credit card", "Free forever plan", "Cancel anytime", "GDPR compliant"].map(p => (
                <span key={p} style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                  <CheckCircle size={13} color="#00d4aa" /> {p}
                </span>
              ))}
            </div>

            <div style={{ ...fade(900), display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, maxWidth: 720, margin: "0 auto" }}>
              {[
                { k: "120k+", v: "Learners", icon: Users },
                { k: "98%", v: "Loved it", icon: Star },
                { k: "4.9★", v: "Avg rating", icon: Trophy },
                { k: "24/7", v: "AI support", icon: Clock },
              ].map(({ k, v, icon: Icon }) => (
                <div key={v} style={{
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,196,180,0.18)",
                  borderRadius: 16, padding: "16px 8px", backdropFilter: "blur(10px)",
                  transition: "all 0.25s", cursor: "default",
                }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(0,196,180,0.1)"; el.style.borderColor = "rgba(0,196,180,0.4)"; el.style.transform = "translateY(-4px)"; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,255,255,0.04)"; el.style.borderColor = "rgba(0,196,180,0.18)"; el.style.transform = "translateY(0)"; }}
                >
                  <Icon size={18} color="#00d4aa" style={{ margin: "0 auto 6px" }} />
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, background: "linear-gradient(120deg,#00d4aa,#38bdf8)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>{k}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section style={{ maxWidth: 1200, margin: "0 auto 6rem", padding: "0 4%" }}>
        <SectionHeader eyebrow="Features" title={<>Everything you need to <span className="text-gradient">study smarter</span></>} desc="A complete AI toolkit for personalized, adaptive learning." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20, marginTop: 48 }}>
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="glass group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-glow" style={{ cursor: "default" }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" style={{ background: `radial-gradient(circle at 30% 30%, ${color}12, transparent 60%)` }} />
              <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${color}30, ${color}10)`, border: `1px solid ${color}40`, display: "grid", placeItems: "center", marginBottom: 16, transition: "transform 0.3s" }} className="group-hover:scale-110">
                <Icon size={22} color={color} />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 8 }}>{title}</h3>
              <p className="text-sm text-muted-foreground" style={{ lineHeight: 1.6 }}>{desc}</p>
              <div className="flex items-center gap-1 mt-4 text-xs font-bold opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" style={{ color }}>
                Learn more <ArrowRight size={12} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section style={{ maxWidth: 1200, margin: "0 auto 6rem", padding: "0 4%" }}>
        <SectionHeader eyebrow="How it works" title={<>From confused to <span className="text-gradient">confident</span> in 3 steps</>} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 24, marginTop: 48 }}>
          {steps.map((s, i) => (
            <div key={s.n} className="glass group relative overflow-hidden rounded-3xl p-8 text-center transition-all hover:-translate-y-2 hover:shadow-glow">
              <div className="absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-60 transition-opacity" style={{ background: "linear-gradient(90deg, var(--primary), var(--accent))" }} />
              <div style={{ position: "relative", width: 64, height: 64, margin: "0 auto 16px", borderRadius: "50%", background: "var(--gradient-hero)", display: "grid", placeItems: "center", boxShadow: "0 0 30px rgba(0,196,180,0.3)", transition: "transform 0.3s" }} className="group-hover:scale-110">
                <s.icon size={28} color="#fff" />
                <span style={{ position: "absolute", top: -4, right: -4, width: 22, height: 22, borderRadius: "50%", background: "var(--accent)", color: "#fff", fontSize: 10, fontWeight: 700, display: "grid", placeItems: "center", border: "2px solid white" }}>{i + 1}</span>
              </div>
              <div className="text-gradient font-display text-4xl font-bold opacity-20 mb-1">{s.n}</div>
              <h3 style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 8 }}>{s.title}</h3>
              <p className="text-sm text-muted-foreground" style={{ lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ TESTIMONIALS ══════════ */}
      <section style={{ maxWidth: 1200, margin: "0 auto 6rem", padding: "0 4%" }}>
        <SectionHeader eyebrow="Loved by learners" title={<>Stories from <span className="text-gradient">real students</span></>} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 20, marginTop: 48 }}>
          {testimonials.map((t) => (
            <figure key={t.name} className="glass group relative overflow-hidden rounded-3xl p-6 transition-all hover:-translate-y-2 hover:shadow-glow" style={{ margin: 0 }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, var(--primary), var(--accent))", borderRadius: "1.5rem 1.5rem 0 0" }} />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" style={{ background: "radial-gradient(circle at 50% 0%, rgba(0,196,180,0.08), transparent 60%)" }} />
              <div style={{ display: "flex", gap: 3, marginBottom: 12 }}>
                {Array.from({ length: t.stars }).map((_, j) => <Star key={j} size={14} fill="#00d4aa" color="#00d4aa" />)}
              </div>
              <Quote size={28} color="var(--primary)" style={{ opacity: 0.5 }} />
              <blockquote style={{ marginTop: 10, fontSize: "0.9rem", lineHeight: 1.7, fontWeight: 500 }}>"{t.quote}"</blockquote>
              <figcaption style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--gradient-hero)", display: "grid", placeItems: "center", fontSize: 14, fontWeight: 700, color: "#fff", boxShadow: "0 0 16px rgba(0,196,180,0.4)", flexShrink: 0 }}>{t.name[0]}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.875rem" }}>{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
                <Flame size={16} color="#f97316" style={{ marginLeft: "auto" }} />
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ══════════ CTA ══════════ */}
      <section style={{ position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #020d14, #051824, #040b12)", padding: "6rem 2rem", textAlign: "center" }}>
        <div style={{ position: "absolute", top: "-20%", right: "-5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,196,180,0.18), transparent 65%)", animation: "orb1 8s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "-20%", left: "-5%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(56,189,248,0.14), transparent 65%)", animation: "orb1 10s ease-in-out infinite reverse" }} />
        <div style={{ position: "absolute", inset: 0, opacity: 0.03, backgroundImage: "linear-gradient(rgba(0,212,170,1) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,170,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: "linear-gradient(135deg, #00c4b4, #0099d4)", display: "grid", placeItems: "center", margin: "0 auto 24px", boxShadow: "0 0 40px rgba(0,196,180,0.5)", animation: "floatUp 4s ease-in-out infinite" }}>
            <GraduationCap size={40} color="#fff" />
          </div>
          <div style={{ display: "inline-block", background: "rgba(0,196,180,0.1)", border: "1px solid rgba(0,196,180,0.3)", borderRadius: 99, padding: "6px 16px", color: "#00d4aa", fontSize: 12, fontWeight: 700, marginBottom: 20 }}>
            🎓 Join 120,000+ learners today
          </div>
          <h2 style={{ color: "#fff", fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 1rem", lineHeight: 1.1 }}>
            Your{" "}
            <span style={{ background: "linear-gradient(120deg,#00d4aa,#38bdf8,#00ffd0)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              AI study buddy
            </span>
            <br />is ready.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1.1rem", maxWidth: 480, margin: "0 auto 2rem" }}>
            Start free today. No credit card needed. Cancel anytime.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center", marginBottom: 32 }}>
            <Link to="/auth" search={{ mode: "signup" }} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,#00c4b4,#0099d4)", borderRadius: 99, padding: "14px 32px", color: "#fff", fontSize: "0.95rem", fontWeight: 700, textDecoration: "none", boxShadow: "0 0 30px rgba(0,196,180,0.4)" }}>
              Get Started Free <ArrowRight size={16} />
            </Link>
            <Link to="/auth" search={{ mode: "signin" }} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(0,196,180,0.4)", borderRadius: 99, padding: "14px 32px", color: "#7dd3fc", fontSize: "0.95rem", fontWeight: 700, textDecoration: "none", backdropFilter: "blur(12px)" }}>
              <BookOpen size={16} /> Sign In
            </Link>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 24 }}>
            {[{ icon: Shield, text: "SSL secured" }, { icon: Users, text: "120k+ students" }, { icon: Star, text: "4.9 star rated" }, { icon: Zap, text: "Instant access" }].map(({ icon: Icon, text }) => (
              <span key={text} style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.35)", fontSize: 12 }}>
                <Icon size={13} color="#00d4aa" /> {text}
              </span>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}

function SectionHeader({ eyebrow, title, desc }: { eyebrow: string; title: React.ReactNode; desc?: string }) {
  return (
    <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
      <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary">{eyebrow}</span>
      <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight leading-tight">{title}</h2>
      {desc && <p className="mt-4 text-muted-foreground text-lg">{desc}</p>}
    </div>
  );
}