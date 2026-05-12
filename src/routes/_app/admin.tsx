import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Upload, FilePlus2, BarChart3, Search, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({ meta: [{ title: "Teacher Panel — AXION" }] }),
  component: Admin,
});

type Profile = { id: string; full_name: string | null; xp: number; streak: number };
type Material = { id: string; title: string; subject: string; description: string | null; created_at: string };

const matSchema = z.object({
  title: z.string().trim().min(1).max(120),
  subject: z.string().trim().min(1).max(60),
  description: z.string().max(500).optional(),
});

function Admin() {
  const { user, isTeacher } = useAuth();
  const [students, setStudents] = useState<Profile[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [desc, setDesc] = useState("");
  const [filter, setFilter] = useState("");

  async function load() {
    setLoading(true);
    const [{ data: profs }, { data: mats }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, xp, streak").order("xp", { ascending: false }).limit(50),
      supabase.from("materials").select("id, title, subject, description, created_at").order("created_at", { ascending: false }).limit(50),
    ]);
    setStudents(profs ?? []);
    setMaterials(mats ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function addMaterial(e: React.FormEvent) {
    e.preventDefault();
    const parsed = matSchema.safeParse({ title, subject, description: desc });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (!user) return;
    const { error } = await supabase.from("materials").insert({
      created_by: user.id, title, subject, description: desc || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Material added");
    setTitle(""); setSubject(""); setDesc("");
    load();
  }

  const visible = students.filter((s) => !filter || (s.full_name ?? "").toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-6 pb-10">
      <div className="glass flex flex-col items-start justify-between gap-4 rounded-3xl p-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold">Teacher <span className="text-gradient">Control Center</span></h1>
          <p className="text-sm text-muted-foreground">
            {isTeacher ? "Monitor performance, upload materials, manage students." : (
              <span className="inline-flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> View-only — only teachers can upload materials.</span>
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Kpi icon={Users} label="Students" value={String(students.length)} />
        <Kpi icon={BarChart3} label="Top XP" value={students[0]?.xp?.toLocaleString() ?? "0"} />
        <Kpi icon={Upload} label="Materials" value={String(materials.length)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Leaderboard</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search…"
                className="rounded-full border bg-card/70 py-2 pl-9 pr-4 text-sm outline-none focus:border-primary" />
            </div>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-4 py-3">#</th><th className="px-4 py-3">Student</th><th className="px-4 py-3">XP</th><th className="px-4 py-3">Streak</th></tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>}
                {!loading && visible.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">No students yet.</td></tr>}
                {visible.map((s, idx) => (
                  <tr key={s.id} className="border-t hover:bg-primary/5">
                    <td className="px-4 py-3 font-mono text-xs">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium">{s.full_name ?? "Anonymous"}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{s.xp.toLocaleString()}</span></td>
                    <td className="px-4 py-3 text-muted-foreground">🔥 {s.streak}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass rounded-3xl p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2"><FilePlus2 className="h-4 w-4 text-primary" /> Add material</h2>
          <form onSubmit={addMaterial} className="mt-4 space-y-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" disabled={!isTeacher}
              className="w-full rounded-xl border bg-card/70 px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50" />
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" disabled={!isTeacher}
              className="w-full rounded-xl border bg-card/70 px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50" />
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description" rows={3} disabled={!isTeacher}
              className="w-full rounded-xl border bg-card/70 px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50" />
            <button type="submit" disabled={!isTeacher}
              className="w-full rounded-full bg-primary py-2 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50">
              Upload
            </button>
            {!isTeacher && <p className="text-xs text-muted-foreground">Need teacher role? Ask an admin to grant access in the backend.</p>}
          </form>

          <h3 className="mt-6 text-sm font-semibold">Recent materials</h3>
          <ul className="mt-3 space-y-2">
            {materials.length === 0 && <li className="text-xs text-muted-foreground">None yet.</li>}
            {materials.slice(0, 5).map((m) => (
              <li key={m.id} className="rounded-xl border bg-card/60 px-3 py-2 text-sm">
                <div className="font-medium">{m.title}</div>
                <div className="text-xs text-muted-foreground">{m.subject}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="glass rounded-3xl p-5">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-hero text-primary-foreground"><Icon className="h-4 w-4" /></span>
      <div className="mt-3 text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
