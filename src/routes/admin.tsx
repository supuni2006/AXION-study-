import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Users, Upload, FilePlus2, BarChart3, Search, Lock, Wand2, Loader2,
  CheckCircle2, XCircle, FileText, Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Teacher Panel — AXION" }] }),
  component: Admin,
});

type Profile = { id: string; full_name: string | null; xp: number; streak: number };
type Material = { id: string; title: string; subject: string; description: string | null; created_at: string };
type GenQ = { q: string; options: string[]; answer: number; explanation?: string };

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

      <div className="grid gap-6 md:grid-cols-3">
        <Kpi icon={Users} label="Students" value={String(students.length)} />
        <Kpi icon={BarChart3} label="Top XP" value={students[0]?.xp?.toLocaleString() ?? "0"} />
        <Kpi icon={Upload} label="Materials" value={String(materials.length)} />
      </div>

      {/* AI Question generator */}
      <div className="glass rounded-3xl p-6">
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
