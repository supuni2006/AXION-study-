import { Link, useNavigate } from "@tanstack/react-router";
import { Sparkles, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const links = [
  { to: "/", label: "Home" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/assistant", label: "AI Assistant" },
  { to: "/quizzes", label: "Quizzes" },
  { to: "/admin", label: "Teacher" },
  { to: "/team", label: "Team" },
] as const;

export function SiteNav() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-4 z-50 mx-auto mt-4 w-[min(1200px,94%)]">
      <nav className="glass flex items-center justify-between rounded-full px-4 py-2.5 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-hero text-primary-foreground shadow-glow">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            <span className="text-gradient">AXION</span>
          </span>
        </Link>
        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
                activeProps={{ className: "bg-primary/10 text-primary" }}
                activeOptions={{ exact: l.to === "/" }}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        {session ? (
          <button
            onClick={async () => { await signOut(); navigate({ to: "/" }); }}
            className="inline-flex items-center gap-1.5 rounded-full border bg-card px-4 py-2 text-sm font-medium hover:bg-accent/40"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        ) : (
          <Link to="/auth" className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow">
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
