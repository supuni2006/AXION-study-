import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Users, Upload, FilePlus2, BarChart3, Search, Lock, Wand2, Loader2,
  CheckCircle2, XCircle, FileText, Sparkles, GraduationCap, Pencil, RefreshCw, Check, X, Plus, Trash2,
  Github, Linkedin, Mail,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Teacher Panel — AXION" }] }),
  component: AdminGate,
});

function AdminGate() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }
  if (!session) return <TeacherSignIn />;
  return <Admin />;
}

function TeacherSignIn() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function google() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/admin`,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-2xl py-12">
      <div className="glass rounded-3xl p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-hero text-primary-foreground shadow-glow">
          <GraduationCap className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-3xl font-bold">Teacher <span className="text-gradient">Control Center</span></h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Sign in to upload assignments, generate AI quizzes from PDFs, and track your students' progress.
        </p>

        <button
          type="button"
          onClick={google}
          disabled={busy}
          className="mx-auto mt-7 flex w-full max-w-sm items-center justify-center gap-3 rounded-full border-2 border-primary/30 bg-card px-6 py-4 text-base font-semibold shadow-glow transition hover:scale-[1.02] hover:border-primary hover:bg-accent/30 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <GIcon />}
          Continue with Google
        </button>

        <p className="mt-4 text-xs text-muted-foreground">
          Prefer email?{" "}
          <button onClick={() => navigate({ to: "/auth" })} className="font-semibold text-primary hover:underline">
            Sign in with email
          </button>
        </p>

        <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
          {[
            { icon: Upload, t: "Upload PDFs", d: "Drop assignments and notes" },
            { icon: Wand2, t: "AI quizzes", d: "Auto-generate 5 MCQs" },
            { icon: BarChart3, t: "Track progress", d: "See student XP & streaks" },
          ].map((f, i) => (
            <div key={i} className="rounded-2xl border bg-card/60 p-4">
              <f.icon className="h-4 w-4 text-primary" />
              <div className="mt-2 text-sm font-semibold">{f.t}</div>
              <div className="text-xs text-muted-foreground">{f.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.95l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

type Profile = { id: string; full_name: string | null; xp: number; streak: number };
type Material = { id: string; title: string; subject: string; description: string | null; created_at: string; storage_path: string | null };
type GenQ = { q: string; options: string[]; answer: number; explanation?: string };
type Attempt = { user_id: string; score: number; total: number; topic: string };

const matSchema = z.object({
  title: z.string().trim().min(1).max(120),
  subject: z.string().trim().min(1).max(60),
  description: z.string().max(500).optional(),
});

async function extractPdfText(file: File): Promise<string> {
  const pdfjs: any = await import("pdfjs-dist");
  // Use a worker from the same package (Vite handles ?url import).
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  let out = "";
  const max = Math.min(pdf.numPages, 20);
  for (let i = 1; i <= max; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    out += content.items.map((it: any) => it.str).join(" ") + "\n";
  }
  return out.trim();
}

function Admin() {
  const { user, isTeacher } = useAuth();
  const [students, setStudents] = useState<Profile[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [desc, setDesc] = useState("");
  const [filter, setFilter] = useState("");

  // PDF / question generator state
  const [file, setFile] = useState<File | null>(null);
  const [pasted, setPasted] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<GenQ[] | null>(null);
  const [picked, setPicked] = useState<Record<number, number>>({});

  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [libFilter, setLibFilter] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const generatorRef = useRef<HTMLDivElement | null>(null);

  async function renameMaterial(id: string) {
    const t = editingTitle.trim();
    if (!t) { toast.error("Title can't be empty"); return; }
    const { error } = await supabase.from("materials").update({ title: t.slice(0, 120) }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setEditingId(null); setEditingTitle("");
    toast.success("Renamed");
    load();
  }

  async function reuseMaterial(m: Material) {
    if (!m.storage_path) {
      setPasted(`${m.title}\n${m.subject}\n${m.description ?? ""}`);
      setTitle(m.title); setSubject(m.subject);
      generatorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      toast.message("Loaded metadata — paste or upload more text to enrich the quiz.");
      return;
    }
    try {
      const { data, error } = await supabase.storage.from("materials").download(m.storage_path);
      if (error || !data) throw error ?? new Error("download failed");
      const f = new File([data], m.storage_path.split("/").pop() ?? "material.pdf", { type: data.type || "application/pdf" });
      setFile(f);
      setTitle(m.title); setSubject(m.subject);
      generatorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      toast.success(`Loaded "${m.title}" — click Generate to make a fresh quiz.`);
    } catch (e: any) {
      console.error(e); toast.error("Couldn't load file from library");
    }
  }

  async function load() {
    setLoading(true);
    const [{ data: profs }, { data: mats }, { data: atts }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, xp, streak").order("xp", { ascending: false }).limit(50),
      supabase.from("materials").select("id, title, subject, description, created_at, storage_path").order("created_at", { ascending: false }).limit(100),
      supabase.from("quiz_attempts").select("user_id, score, total, topic").limit(500),
    ]);
    setStudents(profs ?? []);
    setMaterials(mats ?? []);
    setAttempts(atts ?? []);
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

  async function generateFromMaterial() {
    if (!user) { toast.error("Sign in first"); return; }
    let text = pasted.trim();
    let storagePath: string | null = null;
    let titleGuess = title || (file?.name ?? "Uploaded material");

    if (file) {
      try {
        setExtracting(true);
        if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
          text = (text + "\n" + (await extractPdfText(file))).trim();
        } else if (file.type.startsWith("text/") || /\.(txt|md)$/i.test(file.name)) {
          text = (text + "\n" + (await file.text())).trim();
        } else {
          toast.error("Use a PDF or .txt file"); return;
        }
        // Upload to storage
        const path = `${user.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("materials").upload(path, file, { upsert: false });
        if (!upErr) storagePath = path;
      } catch (e) {
        console.error(e); toast.error("Couldn't read file");
        return;
      } finally {
        setExtracting(false);
      }
    }

    if (text.length < 40) { toast.error("Need more content (paste text or upload a PDF)"); return; }

    setGenerating(true);
    setQuestions(null);
    setPicked({});
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          mode: "questions",
          persona: "gemini",
          context: text.slice(0, 12000),
          messages: [{ role: "user", content: "Generate the 5 MCQs now." }],
        }),
      });
      if (!resp.ok) {
        const j = await resp.json().catch(() => ({}));
        throw new Error(j.error || "AI failed");
      }
      const { text: out } = await resp.json();
      const cleaned = out.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      const qs: GenQ[] = parsed.questions ?? [];
      if (!Array.isArray(qs) || qs.length === 0) throw new Error("No questions returned");
      setQuestions(qs);

      // Save material record
      if (subject || title || file) {
        await supabase.from("materials").insert({
          created_by: user.id,
          title: titleGuess.slice(0, 120),
          subject: (subject || "General").slice(0, 60),
          description: (desc || "AI-generated quiz source").slice(0, 500),
          storage_path: storagePath,
        });
        load();
      }
      toast.success(`Generated ${qs.length} questions!`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  const visible = students.filter((s) => !filter || (s.full_name ?? "").toLowerCase().includes(filter.toLowerCase()));
  const lib = materials.filter((m) =>
    !libFilter ||
    m.title.toLowerCase().includes(libFilter.toLowerCase()) ||
    m.subject.toLowerCase().includes(libFilter.toLowerCase())
  );

  // Build per-student progress chart data (top 8 by XP), with quiz accuracy.
  const progressData = useMemo(() => {
    const byUser = new Map<string, { score: number; total: number }>();
    for (const a of attempts) {
      const cur = byUser.get(a.user_id) ?? { score: 0, total: 0 };
      cur.score += a.score; cur.total += a.total;
      byUser.set(a.user_id, cur);
    }
    return students.slice(0, 8).map((s) => {
      const a = byUser.get(s.id);
      const accuracy = a && a.total > 0 ? Math.round((a.score / a.total) * 100) : 0;
      return {
        name: (s.full_name ?? "Anon").split(" ")[0].slice(0, 10),
        XP: s.xp,
        Streak: s.streak,
        Accuracy: accuracy,
      };
    });
  }, [students, attempts]);

  const classAvgAccuracy = useMemo(() => {
    if (!attempts.length) return 0;
    const t = attempts.reduce((acc, a) => ({ s: acc.s + a.score, t: acc.t + a.total }), { s: 0, t: 0 });
    return t.t ? Math.round((t.s / t.t) * 100) : 0;
  }, [attempts]);

  return (
    <div className="space-y-6 pb-10">
      <div className="glass flex flex-col items-start justify-between gap-4 rounded-3xl p-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold">Teacher <span className="text-gradient">Control Center</span></h1>
          <p className="text-sm text-muted-foreground">
            {isTeacher ? "Monitor performance, upload PDFs, and turn them into quizzes with AI." : (
              <span className="inline-flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> View-only — only teachers can publish materials.</span>
            )}
          </p>
        </div>
        <Link to="/assistant" className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-4 py-2 text-sm font-medium hover:bg-accent/40">
          <Sparkles className="h-4 w-4 text-primary" /> Open AI Teachers
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Kpi icon={Users} label="Students" value={String(students.length)} />
        <Kpi icon={BarChart3} label="Top XP" value={students[0]?.xp?.toLocaleString() ?? "0"} />
        <Kpi icon={CheckCircle2} label="Class accuracy" value={`${classAvgAccuracy}%`} />
        <Kpi icon={Upload} label="Materials" value={String(materials.length)} />
      </div>

      {/* Class Progress Dashboard */}
      <div className="glass rounded-3xl p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <BarChart3 className="h-4 w-4 text-primary" /> Class progress
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">XP, streaks, and quiz accuracy for your top students.</p>
          </div>
        </div>
        <div className="mt-4 h-72 w-full">
          {progressData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No student data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="XP" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Accuracy" fill="#34D399" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Streak" fill="#F59E0B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* AI Question generator */}
      <div ref={generatorRef} className="glass rounded-3xl p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Wand2 className="h-4 w-4 text-primary" /> Upload assignment / PDF → AI quiz
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Drop a PDF or paste text. AI extracts the key ideas and writes 5 MCQs.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)"
              className="w-full rounded-xl border bg-card/70 px-3 py-2 text-sm outline-none focus:border-primary" />
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject (e.g. Biology)"
              className="w-full rounded-xl border bg-card/70 px-3 py-2 text-sm outline-none focus:border-primary" />

            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-card/50 p-6 text-center hover:border-primary/40 hover:bg-primary/5">
              <FileText className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">{file ? file.name : "Click to upload PDF or .txt"}</span>
              <span className="text-xs text-muted-foreground">Up to 20 pages will be scanned</span>
              <input type="file" accept="application/pdf,text/plain,.txt,.md,.pdf" className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>

            <textarea value={pasted} onChange={(e) => setPasted(e.target.value)} rows={5}
              placeholder="…or paste study notes / assignment text here"
              className="w-full rounded-xl border bg-card/70 px-3 py-2 text-sm outline-none focus:border-primary" />

            <button onClick={generateFromMaterial} disabled={generating || extracting || (!file && pasted.trim().length < 40)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50">
              {extracting ? (<><Loader2 className="h-4 w-4 animate-spin" /> Reading file…</>)
                : generating ? (<><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>)
                : (<><Wand2 className="h-4 w-4" /> Generate 5 questions</>)}
            </button>
          </div>

          <div className="rounded-2xl border bg-card/40 p-4">
            <h3 className="text-sm font-semibold">Preview</h3>
            {!questions && !generating && (
              <p className="mt-2 text-sm text-muted-foreground">Your AI-generated quiz will appear here. Click an option to check the answer.</p>
            )}
            {generating && <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Asking the AI tutor…</div>}
            {questions && (
              <ol className="mt-3 space-y-4">
                {questions.map((q, qi) => (
                  <li key={qi} className="rounded-xl border bg-background/60 p-3">
                    <p className="text-sm font-semibold">{qi + 1}. {q.q}</p>
                    <div className="mt-2 grid gap-1.5">
                      {q.options.map((opt, oi) => {
                        const sel = picked[qi];
                        const isPicked = sel === oi;
                        const isAnswer = sel !== undefined && oi === q.answer;
                        const isWrong = isPicked && oi !== q.answer;
                        const tone = isAnswer ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                          : isWrong ? "border-rose-400 bg-rose-50 text-rose-700"
                          : "border bg-card/70 hover:border-primary/40 hover:bg-primary/5";
                        return (
                          <button key={oi} disabled={sel !== undefined}
                            onClick={() => setPicked((p) => ({ ...p, [qi]: oi }))}
                            className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition ${tone}`}>
                            <span>{opt}</span>
                            {isAnswer && <CheckCircle2 className="h-4 w-4" />}
                            {isWrong && <XCircle className="h-4 w-4" />}
                          </button>
                        );
                      })}
                    </div>
                    {picked[qi] !== undefined && q.explanation && (
                      <p className="mt-2 text-xs text-muted-foreground"><strong>Why:</strong> {q.explanation}</p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>

      {/* Assignment Library */}
      <div className="glass rounded-3xl p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <FileText className="h-4 w-4 text-primary" /> Assignment library
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Rename past uploads and reuse them to generate brand-new quizzes.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={libFilter} onChange={(e) => setLibFilter(e.target.value)} placeholder="Search library…"
              className="rounded-full border bg-card/70 py-2 pl-9 pr-4 text-sm outline-none focus:border-primary" />
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {lib.length === 0 && <p className="text-sm text-muted-foreground">No assignments yet — upload one above.</p>}
          {lib.map((m) => (
            <div key={m.id} className="rounded-2xl border bg-card/60 p-4">
              <div className="flex items-start justify-between gap-2">
                {editingId === m.id ? (
                  <div className="flex-1">
                    <input autoFocus value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") renameMaterial(m.id); if (e.key === "Escape") setEditingId(null); }}
                      className="w-full rounded-lg border bg-background px-2 py-1 text-sm outline-none focus:border-primary" />
                  </div>
                ) : (
                  <h3 className="line-clamp-2 text-sm font-semibold">{m.title}</h3>
                )}
                {editingId === m.id ? (
                  <div className="flex gap-1">
                    <button onClick={() => renameMaterial(m.id)} className="rounded-md p-1 hover:bg-emerald-500/10" title="Save">
                      <Check className="h-4 w-4 text-emerald-500" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="rounded-md p-1 hover:bg-rose-500/10" title="Cancel">
                      <X className="h-4 w-4 text-rose-500" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => { setEditingId(m.id); setEditingTitle(m.title); }} className="rounded-md p-1 text-muted-foreground hover:bg-primary/10 hover:text-primary" title="Rename">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">{m.subject}</span>
                <span>{new Date(m.created_at).toLocaleDateString()}</span>
                {m.storage_path && <span className="inline-flex items-center gap-1"><FileText className="h-3 w-3" /> file</span>}
              </div>
              {m.description && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{m.description}</p>}
              <button onClick={() => reuseMaterial(m)}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10">
                <RefreshCw className="h-3.5 w-3.5" /> Make new quiz
              </button>
            </div>
          ))}
        </div>
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
          <h2 className="flex items-center gap-2 text-lg font-semibold"><FilePlus2 className="h-4 w-4 text-primary" /> Add material</h2>
          <form onSubmit={addMaterial} className="mt-4 space-y-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" disabled={!isTeacher}
              className="w-full rounded-xl border bg-card/70 px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50" />
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" disabled={!isTeacher}
              className="w-full rounded-xl border bg-card/70 px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50" />
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description" rows={3} disabled={!isTeacher}
              className="w-full rounded-xl border bg-card/70 px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50" />
            <button type="submit" disabled={!isTeacher}
              className="w-full rounded-full bg-primary py-2 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50">
              Save material
            </button>
            {!isTeacher && <p className="text-xs text-muted-foreground">Need teacher role? Ask an admin to grant access in the backend.</p>}
          </form>
        </div>
      </div>

      <TeamManager isTeacher={isTeacher} userId={user?.id ?? null} />
    </div>
  );
}

type TeamMember = { id: string; name: string; role: string; bio: string | null; avatar_url: string | null; sort_order: number; github_url: string | null; linkedin_url: string | null; email: string | null };

function TeamManager({ isTeacher, userId }: { isTeacher: boolean; userId: string | null }) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [email, setEmail] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ github_url: string; linkedin_url: string; email: string }>({ github_url: "", linkedin_url: "", email: "" });

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("team_members")
      .select("id, name, role, bio, avatar_url, sort_order, github_url, linkedin_url, email")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    setMembers(data ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function uploadAvatar(file: File): Promise<string | null> {
    if (!userId) return null;
    const ext = file.name.split(".").pop() || "png";
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (error) { toast.error(error.message); return null; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !role.trim()) { toast.error("Name and role required"); return; }
    if (!userId) return;
    setSaving(true);
    try {
      let avatar_url: string | null = null;
      if (avatarFile) avatar_url = await uploadAvatar(avatarFile);
      const { error } = await supabase.from("team_members").insert({
        name: name.slice(0, 80),
        role: role.slice(0, 80),
        bio: bio.slice(0, 400) || null,
        avatar_url,
        sort_order: members.length,
        created_by: userId,
        github_url: github.trim() || null,
        linkedin_url: linkedin.trim() || null,
        email: email.trim() || null,
      });
      if (error) throw error;
      toast.success(`Added ${name}`);
      setName(""); setRole(""); setBio(""); setAvatarFile(null);
      setGithub(""); setLinkedin(""); setEmail("");
      load();
    } catch (err: any) {
      toast.error(err.message || "Couldn't add member");
    } finally {
      setSaving(false);
    }
  }

  async function replaceAvatar(m: TeamMember, file: File) {
    setUploadingId(m.id);
    try {
      const url = await uploadAvatar(file);
      if (!url) return;
      const { error } = await supabase.from("team_members").update({ avatar_url: url }).eq("id", m.id);
      if (error) throw error;
      toast.success("Avatar updated");
      load();
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploadingId(null);
    }
  }

  async function removeAvatar(m: TeamMember) {
    const { error } = await supabase.from("team_members").update({ avatar_url: null }).eq("id", m.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Avatar removed");
    load();
  }

  async function deleteMember(m: TeamMember) {
    if (!confirm(`Remove ${m.name}?`)) return;
    const { error } = await supabase.from("team_members").delete().eq("id", m.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Removed");
    load();
  }

  function startEdit(m: TeamMember) {
    setEditingId(m.id);
    setEditDraft({
      github_url: m.github_url ?? "",
      linkedin_url: m.linkedin_url ?? "",
      email: m.email ?? "",
    });
  }

  async function saveSocials(m: TeamMember) {
    const { error } = await supabase.from("team_members").update({
      github_url: editDraft.github_url.trim() || null,
      linkedin_url: editDraft.linkedin_url.trim() || null,
      email: editDraft.email.trim() || null,
    }).eq("id", m.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Links saved");
    setEditingId(null);
    load();
  }

  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Users className="h-4 w-4 text-primary" /> Team members
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage who appears on the public <Link to="/team" className="text-primary hover:underline">/team</Link> page. Upload avatar photos here.
          </p>
        </div>
      </div>

      {isTeacher && (
        <form onSubmit={addMember} className="mt-5 grid gap-3 rounded-2xl border bg-card/40 p-4 md:grid-cols-[auto,1fr,1fr]">
          <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-card/70 text-center text-xs hover:border-primary/50">
            {avatarFile ? (
              <img src={URL.createObjectURL(avatarFile)} alt="preview" className="h-full w-full rounded-2xl object-cover" />
            ) : (
              <>
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="mt-1 text-muted-foreground">Photo</span>
              </>
            )}
            <input type="file" accept="image/*" className="hidden"
              onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} />
          </label>
          <div className="space-y-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" maxLength={80}
              className="w-full rounded-xl border bg-card/70 px-3 py-2 text-sm outline-none focus:border-primary" />
            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role (e.g. Founder)" maxLength={80}
              className="w-full rounded-xl border bg-card/70 px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div className="space-y-2">
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} placeholder="Short bio" maxLength={400}
              className="w-full rounded-xl border bg-card/70 px-3 py-2 text-sm outline-none focus:border-primary" />
            <button type="submit" disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add member
            </button>
          </div>
        </form>
      )}
      {!isTeacher && <p className="mt-4 text-xs text-muted-foreground">Need teacher role to manage team members.</p>}

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!loading && members.length === 0 && <p className="text-sm text-muted-foreground">No team members yet.</p>}
        {members.map((m) => (
          <div key={m.id} className="flex gap-3 rounded-2xl border bg-card/60 p-3">
            <div className="relative">
              {m.avatar_url ? (
                <img src={m.avatar_url} alt={m.name} className="h-16 w-16 rounded-xl object-cover" />
              ) : (
                <div className="grid h-16 w-16 place-items-center rounded-xl bg-hero text-sm font-bold text-primary-foreground">
                  {m.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                </div>
              )}
              {uploadingId === m.id && (
                <div className="absolute inset-0 grid place-items-center rounded-xl bg-black/40">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{m.name}</p>
              <p className="truncate text-xs text-primary">{m.role}</p>
              {m.bio && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{m.bio}</p>}
              {isTeacher && (
                <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded-full border bg-card/70 px-2.5 py-1 hover:border-primary/40">
                    <Upload className="h-3 w-3" /> {m.avatar_url ? "Replace" : "Upload"}
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) replaceAvatar(m, f); }} />
                  </label>
                  {m.avatar_url && (
                    <button onClick={() => removeAvatar(m)}
                      className="inline-flex items-center gap-1 rounded-full border bg-card/70 px-2.5 py-1 hover:border-rose-400/50 hover:text-rose-500">
                      <X className="h-3 w-3" /> Photo
                    </button>
                  )}
                  <button onClick={() => deleteMember(m)}
                    className="inline-flex items-center gap-1 rounded-full border bg-card/70 px-2.5 py-1 hover:border-rose-400/50 hover:text-rose-500">
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
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
