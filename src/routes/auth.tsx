import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { logOAuthFailure } from "@/lib/auth-logging.functions";
import { useAuth } from "@/hooks/use-auth";
import { Sparkles, Mail, Lock, Loader2, User, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    mode: s.mode === "signup" ? "signup" : ("signin" as "signin" | "signup"),
  }),
  head: () => ({
    meta: [
      { title: "Sign in — LearnSync AI" },
      {
        name: "description",
        content:
          "Sign in or create an account to access your personalized AI learning dashboard.",
      },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
  fullName: z.string().trim().min(1).max(80).optional(),
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [signedUp, setSignedUp] = useState(false);

  const navigate = useNavigate();
  const { session } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (session) navigate({ to: "/dashboard" });
  }, [session, navigate]);

  // Handle OAuth errors in URL hash/params
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const hashParams = new URLSearchParams(
      url.hash.startsWith("#") ? url.hash.slice(1) : ""
    );
    const errorCode = url.searchParams.get("error") ?? hashParams.get("error");
    const errorDesc =
      url.searchParams.get("error_description") ??
      hashParams.get("error_description");
    if (!errorCode && !errorDesc) return;
    logOAuthFailure({
      data: {
        provider: "google",
        stage: "callback",
        errorCode,
        errorMessage: errorDesc,
        url: window.location.href,
      },
    }).catch(() => {});
    toast.error(errorDesc || `Google sign-in failed (${errorCode})`);
  }, []);

  function switchMode(next: "signin" | "signup") {
    setEmail(""); setPassword(""); setFullName("");
    navigate({ to: "/auth", search: { mode: next } });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({
      email,
      password,
      fullName: mode === "signup" ? fullName : undefined,
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account");
        setSignedUp(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in successfully");
        navigate({ to: "/dashboard" });
      }
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    setLoading(true);
    const redirectUri = `${window.location.origin}/dashboard`;
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUri },
      });
      if (error) throw error;
    } catch (e: any) {
      await logOAuthFailure({
        data: {
          provider: "google",
          stage: "initiate",
          errorCode: e?.code ?? e?.name ?? null,
          errorMessage: e?.message ?? String(e ?? "unknown"),
          redirectUri,
          url: window.location.href,
        },
      }).catch(() => {});
      toast.error("Google sign-in failed");
      setLoading(false);
    }
  }

  // Email confirmed screen
  if (signedUp) {
    return (
      <div className="mx-auto max-w-md py-10">
        <div className="glass rounded-3xl p-10 text-center">
          <span className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-hero text-primary-foreground shadow-glow">
            <CheckCircle className="h-8 w-8" />
          </span>
          <h1 className="text-2xl font-bold">Check your inbox!</h1>
          <p className="mx-auto mt-3 max-w-xs text-sm text-muted-foreground">
            We sent a confirmation link to <strong>{email}</strong>.
            Click it to activate your account, then sign in.
          </p>
          <button
            onClick={() => { setSignedUp(false); switchMode("signin"); }}
            className="mt-7 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.02]"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-10">
      {/* Header branding */}
      <div className="mb-6 text-center">
        <Link to="/" className="inline-flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-hero text-primary-foreground shadow-glow">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="font-display text-lg font-bold text-gradient">LearnSync AI</span>
        </Link>
      </div>

      <div className="glass rounded-3xl p-8">
        {/* Mode tabs */}
        <div className="mb-7 flex overflow-hidden rounded-2xl border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
              mode === "signup"
                ? "bg-primary text-primary-foreground shadow-glow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => switchMode("signin")}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
              mode === "signin"
                ? "bg-primary text-primary-foreground shadow-glow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign In
          </button>
        </div>

        <p className="mb-6 text-center text-sm text-muted-foreground">
          {mode === "signup"
            ? "Join thousands of students learning smarter with AI"
            : "Welcome back! Continue your AI-powered journey"}
        </p>

        {/* Google OAuth */}
        <button
          type="button"
          onClick={google}
          disabled={loading}
          className="mb-5 flex w-full items-center justify-center gap-2.5 rounded-full border-2 border-border bg-card px-4 py-3 text-sm font-semibold transition hover:border-primary/40 hover:bg-accent/20 disabled:opacity-60"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          or continue with email
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <Field label="Full Name" icon={<User className="h-4 w-4" />}>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Johnson"
                className="input pl-9"
              />
            </Field>
          )}

          <Field label="Email" icon={<Mail className="h-4 w-4" />}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input pl-9"
              required
            />
          </Field>

          <Field label="Password" icon={<Lock className="h-4 w-4" />}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input pl-9"
              required
            />
          </Field>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.01] disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signup" ? "Create my account →" : "Sign in →"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          {mode === "signup"
            ? "Already have an account? "
            : "Don't have an account? "}
          <button
            onClick={() => switchMode(mode === "signup" ? "signin" : "signup")}
            className="font-semibold text-primary hover:underline"
          >
            {mode === "signup" ? "Sign in" : "Create one free"}
          </button>
        </p>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:underline">← Back to home</Link>
        </p>
      </div>

      {mode === "signup" && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          By creating an account you agree to our{" "}
          <span className="text-primary">Terms of Service</span> &amp;{" "}
          <span className="text-primary">Privacy Policy</span>.
        </p>
      )}

      <style>{`
        .input {
          width: 100%;
          border-radius: 9999px;
          border: 1px solid var(--border);
          background: color-mix(in oklab, var(--card) 70%, transparent);
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 4px color-mix(in oklab, var(--accent) 15%, transparent);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">
        {label}
      </span>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </span>
        )}
        {children}
      </div>
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.95l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
