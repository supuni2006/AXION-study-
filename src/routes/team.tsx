import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Github, Twitter, Linkedin, Mail } from "lucide-react";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "Meet the team — AXION" },
      { name: "description", content: "The educators, engineers, and researchers building AXION — your AI-powered learning companion." },
      { property: "og:title", content: "Meet the team — AXION" },
      { property: "og:description", content: "The educators, engineers, and researchers building AXION." },
    ],
  }),
  component: TeamPage,
});

type Member = {
  name: string;
  role: string;
  bio: string;
  initials: string;
  hue: string;
  socials?: { icon: typeof Github; href: string }[];
};

const team: Member[] = [
  {
    name: "Aria Mehta",
    role: "Founder & CEO",
    bio: "Former classroom teacher turned product lead. Obsessed with making learning feel like play.",
    initials: "AM",
    hue: "from-violet-500 to-fuchsia-500",
    socials: [{ icon: Twitter, href: "#" }, { icon: Linkedin, href: "#" }],
  },
  {
    name: "Dev Patel",
    role: "Head of AI",
    bio: "Builds the multi-model brain behind AXION's tutors. Loves Gemini, ChatGPT, and Claude equally.",
    initials: "DP",
    hue: "from-sky-500 to-cyan-400",
    socials: [{ icon: Github, href: "#" }, { icon: Linkedin, href: "#" }],
  },
  {
    name: "Lina Okafor",
    role: "Lead Designer",
    bio: "Designs every pixel students see. Believes great UX is invisible until it's missing.",
    initials: "LO",
    hue: "from-amber-400 to-orange-500",
    socials: [{ icon: Twitter, href: "#" }, { icon: Mail, href: "mailto:hello@axion.app" }],
  },
];

function TeamPage() {
  return (
    <div className="space-y-10 pb-16">
      <section className="glass rounded-3xl p-8 text-center md:p-12">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-hero text-primary-foreground shadow-glow">
          <Sparkles className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-4xl font-bold md:text-5xl">
          Meet the <span className="text-gradient">AXION</span> team
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
          A small, fully-remote crew of teachers, engineers, and AI researchers building the
          friendliest learning companion on the internet.
        </p>
      </section>

      <section>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((m) => (
            <article key={m.name} className="glass group rounded-3xl p-6 transition hover:-translate-y-1">
              <div className={`grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br ${m.hue} text-xl font-bold text-white shadow-glow`}>
                {m.initials}
              </div>
              <h2 className="mt-4 text-lg font-semibold">{m.name}</h2>
              <p className="text-xs font-medium uppercase tracking-wider text-primary">{m.role}</p>
              <p className="mt-2 text-sm text-muted-foreground">{m.bio}</p>
              {m.socials && (
                <div className="mt-4 flex gap-2">
                  {m.socials.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <a key={i} href={s.href} className="grid h-8 w-8 place-items-center rounded-full border bg-card/70 text-muted-foreground transition hover:border-primary hover:text-primary">
                        <Icon className="h-3.5 w-3.5" />
                      </a>
                    );
                  })}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="glass rounded-3xl p-8 text-center">
        <h2 className="text-2xl font-bold">Want to join us?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          We're hiring engineers, designers, and educators who care deeply about making learning joyful.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <a href="mailto:careers@axion.app" className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:scale-[1.02]">
            See open roles
          </a>
          <Link to="/dashboard" className="rounded-full border bg-card px-6 py-2.5 text-sm font-semibold hover:bg-accent/40">
            Try the product
          </Link>
        </div>
      </section>
    </div>
  );
}
