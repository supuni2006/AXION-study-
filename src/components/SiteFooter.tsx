import { Link } from "@tanstack/react-router";
import { Github, Twitter, Linkedin, Sparkles, Mail } from "lucide-react";
import { toast } from "sonner";

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-24 w-[min(1200px,94%)] pb-10">
      <div className="glass rounded-3xl p-8 md:p-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-hero text-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="font-display text-lg font-bold">AXION</span>
            </div>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              Personalized, adaptive learning powered by AI. Built for the next generation of curious minds.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const email = String(fd.get("email") ?? "").trim();
                if (!email || !/.+@.+\..+/.test(email)) { toast.error("Enter a valid email"); return; }
                toast.success("You're on the list! We'll be in touch.");
                (e.currentTarget as HTMLFormElement).reset();
              }}
              className="mt-5 flex max-w-sm items-center gap-2"
            >
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input name="email" type="email" placeholder="you@school.edu"
                  className="w-full rounded-full border bg-card/70 py-2 pl-9 pr-4 text-sm outline-none focus:border-primary" />
              </div>
              <button type="submit" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:scale-[1.03]">
                Notify me
              </button>
            </form>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Product</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/dashboard" className="text-muted-foreground hover:text-foreground">Dashboard</Link></li>
              <li><Link to="/quizzes" className="text-muted-foreground hover:text-foreground">Quizzes</Link></li>
              <li><Link to="/assistant" className="text-muted-foreground hover:text-foreground">AI Teachers</Link></li>
              <li><Link to="/admin" className="text-muted-foreground hover:text-foreground">Teacher panel</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Company</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/" className="text-muted-foreground hover:text-foreground">About</Link></li>
              <li><Link to="/auth" className="text-muted-foreground hover:text-foreground">Sign in</Link></li>
              <li>
                <a href="mailto:hello@axion.app" className="text-muted-foreground hover:text-foreground">Contact</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-border/60 pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} AXION · Built for HackElite</p>
          <div className="flex gap-3">
            <a aria-label="Twitter" target="_blank" rel="noreferrer" className="rounded-full border p-2 hover:bg-accent/40" href="https://twitter.com"><Twitter className="h-4 w-4" /></a>
            <a aria-label="GitHub" target="_blank" rel="noreferrer" className="rounded-full border p-2 hover:bg-accent/40" href="https://github.com"><Github className="h-4 w-4" /></a>
            <a aria-label="LinkedIn" target="_blank" rel="noreferrer" className="rounded-full border p-2 hover:bg-accent/40" href="https://linkedin.com"><Linkedin className="h-4 w-4" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
