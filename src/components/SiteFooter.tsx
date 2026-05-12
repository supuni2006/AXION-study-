import { Github, Twitter, Linkedin, Sparkles } from "lucide-react";

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
              Personalized, adaptive learning powered by AI. Built for the next generation
              of curious minds.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Product</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Features</li><li>Pricing</li><li>Changelog</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Company</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>About</li><li>Careers</li><li>Contact</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-border/60 pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} AXION · Built for HackElite</p>
          <div className="flex gap-3">
            <a className="rounded-full border p-2 hover:bg-accent/40" href="#"><Twitter className="h-4 w-4" /></a>
            <a className="rounded-full border p-2 hover:bg-accent/40" href="#"><Github className="h-4 w-4" /></a>
            <a className="rounded-full border p-2 hover:bg-accent/40" href="#"><Linkedin className="h-4 w-4" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
