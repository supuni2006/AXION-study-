import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { logOAuthFailure } from "@/lib/auth-logging.functions";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, CheckCircle, Eye, EyeOff, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    mode: s.mode === "signup" ? "signup" : ("signin" as "signin" | "signup"),
  }),
  head: () => ({
    meta: [
      { title: "Sign in — LearnSync AI" },
      { name: "description", content: "Sign in or create an account." },
    ],
  }),
  component: AuthPage,
});

const signupSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().trim().min(2, "Enter your full name").max(80),
});

const signinSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [signedUp, setSignedUp] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const navigate = useNavigate();
  const { session } = useAuth();

  // Redirect already-logged-in users
  useEffect(() => {
    if (session) navigate({ to: "/dashboard" });
  }, [session, navigate]);

  // Handle OAuth errors returned in URL
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const hashParams = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : "");
    const errorCode = url.searchParams.get("error") ?? hashParams.get("error");
    const errorDesc = url.searchParams.get("error_description") ?? hashParams.get("error_description");
    if (!errorCode && !errorDesc) return;
    logOAuthFailure({
      data: { provider: "google", stage: "callback", errorCode, errorMessage: errorDesc, url: window.location.href },
    }).catch(() => {});
    toast.error(errorDesc?.replace(/\+/g, " ") || `Sign-in failed (${errorCode})`);
    // Clean the URL so errors don't persist on refresh
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  function switchMode(next: "signin" | "signup") {
    setEmail(""); setPassword(""); setFullName("");
    setFieldErrors({}); setForgotMode(false); setResetSent(false);
    navigate({ to: "/auth", search: { mode: next } });
  }

  function validate(fields: Record<string, string>) {
    const schema = mode === "signup" ? signupSchema : signinSchema;
    const result = schema.safeParse(fields);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((i) => { if (i.path[0]) errs[String(i.path[0])] = i.message; });
      setFieldErrors(errs);
      return false;
    }
    setFieldErrors({});
    return true;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const fields = { email, password, fullName };
    if (!validate(fields)) return;
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: fullName.trim() },
          },
        });
        if (error) throw error;
        setSignedUp(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          if (error.message.toLowerCase().includes("invalid")) {
            setFieldErrors({ password: "Incorrect email or password" });
          } else {
            throw error;
          }
          return;
        }
        navigate({ to: "/dashboard" });
      }
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setFieldErrors({ email: "Enter your email first" }); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err: any) {
      toast.error(err?.message || "Could not send reset email");
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    setGoogleLoading(true);
    const redirectUri = `${window.location.origin}/dashboard`;
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUri },
      });
      if (error) throw error;
      // Page will redirect — no need to setLoading(false)
    } catch (e: any) {
      await logOAuthFailure({
        data: {
          provider: "google", stage: "initiate",
          errorCode: e?.code ?? e?.name ?? null,
          errorMessage: e?.message ?? String(e ?? "unknown"),
          redirectUri, url: window.location.href,
        },
      }).catch(() => {});
      toast.error("Google sign-in failed — try email instead");
      setGoogleLoading(false);
    }
  }

  // ── Email confirmed screen ─────────────────────────────────
  if (signedUp) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={{ textAlign: "center" }}>
            <CheckCircle size={48} color="#0d9488" style={{ margin: "0 auto 1rem" }} />
            <h1 style={s.title}>Check your inbox!</h1>
            <p style={s.subtitle}>
              We sent a confirmation link to <strong>{email}</strong>.
              Click it to activate your account, then sign in.
            </p>
            <button onClick={() => { setSignedUp(false); switchMode("signin"); }} style={{ ...s.btn, marginTop: "1.5rem" }}>
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Forgot password screen ─────────────────────────────────
  if (forgotMode) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <h1 style={s.title}>Reset your password</h1>
          <p style={s.subtitle}>Enter your email and we'll send you a reset link.</p>
          {resetSent ? (
            <div style={{ marginTop: "1rem", textAlign: "center" }}>
              <CheckCircle size={32} color="#0d9488" style={{ margin: "0 auto .75rem" }} />
              <p style={{ fontSize: ".875rem", color: "#64748b" }}>Reset link sent to <strong>{email}</strong>.</p>
              <button onClick={() => { setForgotMode(false); setResetSent(false); }} style={{ ...s.btn, marginTop: "1rem" }}>
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={sendReset} style={{ marginTop: "1.25rem" }}>
              <label style={s.label}>EMAIL ADDRESS</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" style={s.input} required
              />
              {fieldErrors.email && <FieldError msg={fieldErrors.email} />}
              <button type="submit" disabled={loading} style={{ ...s.btn, marginTop: "1rem" }}>
                {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : null}
                Send reset link
              </button>
              <button type="button" onClick={() => setForgotMode(false)} style={s.ghost}>
                ← Back to sign in
              </button>
            </form>
          )}
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const isSignup = mode === "signup";

  // ── Main auth card ─────────────────────────────────────────
  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>{isSignup ? "Create your account" : "Welcome back"}</h1>
        <p style={s.subtitle}>
          {isSignup
            ? "Welcome! Please fill in the details to get started."
            : "Sign in to continue your AI-powered learning journey."}
        </p>

        {/* Google */}
        <button onClick={google} disabled={googleLoading || loading} style={s.googleBtn}>
          {googleLoading
            ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
            : <GoogleIcon />}
          Continue with Google
        </button>

        <div style={s.divider}>
          <div style={s.divLine} /><span style={s.divText}>or</span><div style={s.divLine} />
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {isSignup && (
            <div>
              <label style={s.label}>FULL NAME</label>
              <input
                value={fullName} onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Johnson" style={s.input}
              />
              {fieldErrors.fullName && <FieldError msg={fieldErrors.fullName} />}
            </div>
          )}

          <div>
            <label style={s.label}>EMAIL ADDRESS</label>
            <div style={{ position: "relative" }}>
              <span style={s.inputIcon}><MailIcon /></span>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{ ...s.input, paddingLeft: "2.5rem" }} required
              />
            </div>
            {fieldErrors.email && <FieldError msg={fieldErrors.email} />}
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".4rem" }}>
              <label style={{ ...s.label, marginBottom: 0 }}>PASSWORD</label>
              {!isSignup && (
                <button type="button" onClick={() => setForgotMode(true)} style={s.forgotBtn}>
                  Forgot password?
                </button>
              )}
            </div>
            <div style={{ position: "relative" }}>
              <span style={s.inputIcon}><LockIcon /></span>
              <input
                type={showPassword ? "text" : "password"}
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignup ? "Min 8 characters" : "••••••••"}
                style={{ ...s.input, paddingLeft: "2.5rem", paddingRight: "2.75rem" }} required
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} style={s.eyeBtn} tabIndex={-1}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.password && <FieldError msg={fieldErrors.password} />}
            {isSignup && !fieldErrors.password && (
              <p style={{ fontSize: ".75rem", color: "#94a3b8", marginTop: ".35rem" }}>
                Must be at least 8 characters.
              </p>
            )}
          </div>

          <button type="submit" disabled={loading || googleLoading} style={s.btn}>
            {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : null}
            {isSignup ? "Create account" : "Sign in"} &nbsp;→
          </button>
        </form>
      </div>

      <p style={s.switchText}>
        {isSignup ? "Already have an account? " : "Don't have an account? "}
        <button onClick={() => switchMode(isSignup ? "signin" : "signup")} style={s.switchLink}>
          {isSignup ? "Sign in" : "Sign up free"}
        </button>
      </p>

      <p style={{ ...s.switchText, marginTop: ".5rem" }}>
        <Link to="/" style={{ color: "#94a3b8", textDecoration: "none", fontSize: ".8rem" }}>← Back to home</Link>
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function FieldError({ msg }: { msg: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: ".3rem", marginTop: ".3rem" }}>
      <AlertCircle size={13} color="#e11d48" />
      <span style={{ fontSize: ".75rem", color: "#e11d48" }}>{msg}</span>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1rem" },
  card: { width: "100%", maxWidth: "420px", background: "#ffffff", borderRadius: "1.25rem", padding: "2.25rem 2rem", boxShadow: "0 2px 32px 0 rgba(0,0,0,0.08)" },
  title: { fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", textAlign: "center", margin: "0 0 .35rem", fontFamily: "'Inter', sans-serif", letterSpacing: "-0.03em" },
  subtitle: { fontSize: ".875rem", color: "#64748b", textAlign: "center", margin: "0 0 1.5rem" },
  googleBtn: { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: ".6rem", border: "1px solid #e2e8f0", borderRadius: ".6rem", background: "#fff", padding: ".72rem 1rem", fontSize: ".9rem", fontWeight: 600, color: "#0f172a", cursor: "pointer" },
  divider: { display: "flex", alignItems: "center", gap: ".75rem", margin: "1.25rem 0" },
  divLine: { flex: 1, height: "1px", background: "#e2e8f0" },
  divText: { fontSize: ".8rem", color: "#94a3b8" },
  label: { display: "block", fontSize: ".7rem", fontWeight: 700, letterSpacing: ".07em", color: "#334155", marginBottom: ".4rem" },
  input: { width: "100%", borderRadius: ".55rem", border: "1px solid #e2e8f0", background: "#f8fafc", padding: ".72rem .9rem", fontSize: ".875rem", color: "#0f172a", outline: "none", boxSizing: "border-box" as const },
  inputIcon: { position: "absolute" as const, left: ".75rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8", display: "flex", alignItems: "center", pointerEvents: "none" as const },
  eyeBtn: { position: "absolute" as const, right: ".75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center", padding: 0 },
  btn: { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: ".4rem", borderRadius: ".55rem", background: "#0d9488", color: "#fff", border: "none", padding: ".8rem 1rem", fontSize: ".95rem", fontWeight: 600, cursor: "pointer" },
  ghost: { width: "100%", display: "block", marginTop: ".75rem", background: "none", border: "none", color: "#64748b", fontSize: ".875rem", cursor: "pointer", textAlign: "center" as const },
  forgotBtn: { background: "none", border: "none", color: "#0d9488", fontSize: ".75rem", fontWeight: 600, cursor: "pointer", padding: 0 },
  switchText: { marginTop: "1.25rem", fontSize: ".875rem", color: "#64748b", textAlign: "center" as const },
  switchLink: { background: "none", border: "none", color: "#0d9488", fontWeight: 600, cursor: "pointer", fontSize: ".875rem", padding: 0 },
};

function MailIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
}
function LockIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
}
function GoogleIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.95l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>;
}