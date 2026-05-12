import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Users, Github, Linkedin, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "Meet the team — AXION" },
      { name: "description", content: "The educators, engineers, and researchers building AXION." },
      { property: "og:title", content: "Meet the team — AXION" },
      { property: "og:description", content: "The educators, engineers, and researchers building AXION." },
    ],
  }),
  component: TeamPage,
});

type Member = { id: string; name: string; role: string; bio: string | null; avatar_url: string | null };

const HUES = [
  "from-violet-500 to-fuchsia-500",
  "from-sky-500 to-cyan-400",
  "from-amber-400 to-orange-500",
  "from-emerald-500 to-teal-400",
  "from-rose-500 to-pink-500",
  "from-indigo-500 to-blue-500",
];

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("team_members")
        .select("id, name, role, bio, avatar_url")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      setMembers(data ?? []);
      setLoading(false);
    })();
  }, []);

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
        {loading ? (
          <p className="text-center text-sm text-muted-foreground">Loading…</p>
        ) : members.length === 0 ? (
          <div className="glass rounded-3xl p-10 text-center">
            <Users className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              No team members yet. Teachers can add them in the{" "}
              <Link to="/admin" className="font-semibold text-primary hover:underline">Teacher panel</Link>.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((m, i) => (
              <article key={m.id} className="glass group rounded-3xl p-6 transition hover:-translate-y-1">
                {m.avatar_url ? (
                  <img src={m.avatar_url} alt={m.name} className="h-20 w-20 rounded-2xl object-cover shadow-glow" />
                ) : (
                  <div className={`grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br ${HUES[i % HUES.length]} text-xl font-bold text-white shadow-glow`}>
                    {initials(m.name)}
                  </div>
                )}
                <h2 className="mt-4 text-lg font-semibold">{m.name}</h2>
                <p className="text-xs font-medium uppercase tracking-wider text-primary">{m.role}</p>
                {m.bio && <p className="mt-2 text-sm text-muted-foreground">{m.bio}</p>}
              </article>
            ))}
          </div>
        )}
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
