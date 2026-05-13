import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, ShieldAlert, RefreshCw, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/oauth-logs")({
  head: () => ({ meta: [{ title: "OAuth failure logs — AXION" }] }),
  component: Page,
});

type LogRow = {
  id: string;
  provider: string;
  stage: string;
  error_code: string | null;
  error_message: string | null;
  email: string | null;
  user_id: string | null;
  url: string | null;
  ip: string | null;
  user_agent: string | null;
  occurred_at: string;
};

const STAGES = ["", "initiate", "callback", "set_session", "unknown"] as const;
const RANGES = [
  { v: "1h", label: "Last hour" },
  { v: "24h", label: "Last 24h" },
  { v: "7d", label: "Last 7 days" },
  { v: "30d", label: "Last 30 days" },
  { v: "all", label: "All time" },
] as const;

function rangeToISO(v: string): string | null {
  const now = Date.now();
  const map: Record<string, number> = { "1h": 3600e3, "24h": 86400e3, "7d": 7 * 86400e3, "30d": 30 * 86400e3 };
  if (!map[v]) return null;
  return new Date(now - map[v]).toISOString();
}

function Page() {
  const { session, loading, isTeacher } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!session) { setIsAdmin(false); return; }
    supabase.from("user_roles").select("role").eq("user_id", session.user.id).then(({ data }) => {
      setIsAdmin(!!data?.some((r) => r.role === "admin"));
    });
  }, [session]);

  if (loading || isAdmin === null) {
    return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…</div>;
  }
  if (!session || !isAdmin) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-2xl font-bold">Admins only</h1>
        <p className="mt-2 text-sm text-muted-foreground">You need an admin role to view OAuth failure logs.</p>
        <Link to="/" className="mt-4 inline-block rounded-full border bg-card px-4 py-2 text-sm hover:bg-accent/40">Back home</Link>
      </div>
    );
  }
  return <Logs />;
}

function Logs() {
  const [provider, setProvider] = useState("");
  const [stage, setStage] = useState<string>("");
  const [errorCode, setErrorCode] = useState("");
  const [range, setRange] = useState<string>("24h");
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true); setErr(null);
    let q = supabase.from("oauth_failure_logs" as any)
      .select("id,provider,stage,error_code,error_message,email,user_id,url,ip,user_agent,occurred_at")
      .order("occurred_at", { ascending: false })
      .limit(500);
    if (provider.trim()) q = q.eq("provider", provider.trim());
    if (stage) q = q.eq("stage", stage);
    if (errorCode.trim()) q = q.ilike("error_code", `%${errorCode.trim()}%`);
    const since = rangeToISO(range);
    if (since) q = q.gte("occurred_at", since);
    const { data, error } = await q;
    if (error) setErr(error.message); else setRows((data as any as LogRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); /* initial */ }, []); // eslint-disable-line

  const providers = useMemo(() => Array.from(new Set(rows.map((r) => r.provider))), [rows]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">OAuth failure logs</h1>
          <p className="text-sm text-muted-foreground">Diagnose Google/OAuth sign-in failures across stages.</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm hover:bg-accent/40">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="glass mb-4 grid grid-cols-1 gap-3 rounded-2xl p-4 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Provider">
          <input list="prov-list" value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="google" className="input" />
          <datalist id="prov-list">{providers.map((p) => <option key={p} value={p} />)}</datalist>
        </Field>
        <Field label="Stage">
          <select value={stage} onChange={(e) => setStage(e.target.value)} className="input">
            {STAGES.map((s) => <option key={s} value={s}>{s || "Any"}</option>)}
          </select>
        </Field>
        <Field label="Error code">
          <input value={errorCode} onChange={(e) => setErrorCode(e.target.value)} placeholder="access_denied" className="input" />
        </Field>
        <Field label="Time range">
          <select value={range} onChange={(e) => setRange(e.target.value)} className="input">
            {RANGES.map((r) => <option key={r.v} value={r.v}>{r.label}</option>)}
          </select>
        </Field>
        <div className="flex items-end">
          <button onClick={load} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow">
            <Search className="h-3.5 w-3.5" /> Apply filters
          </button>
        </div>
      </div>

      {err && <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{err}</div>}

      <div className="glass overflow-hidden rounded-2xl">
        <div className="border-b px-4 py-2 text-xs text-muted-foreground">{loading ? "Loading…" : `${rows.length} entries`}</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-accent/20 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Provider</th>
                <th className="px-3 py-2">Stage</th>
                <th className="px-3 py-2">Error code</th>
                <th className="px-3 py-2">Message</th>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">IP</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t align-top">
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{new Date(r.occurred_at).toLocaleString()}</td>
                  <td className="px-3 py-2">{r.provider}</td>
                  <td className="px-3 py-2"><span className="rounded-full bg-accent/40 px-2 py-0.5 text-xs">{r.stage}</span></td>
                  <td className="px-3 py-2 font-mono text-xs">{r.error_code ?? "—"}</td>
                  <td className="max-w-[24rem] px-3 py-2 text-muted-foreground">{r.error_message ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">{r.email ?? r.user_id ?? "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">{r.ip ?? "—"}</td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">No failures match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .input { width:100%; border-radius:9999px; border:1px solid var(--border); background: color-mix(in oklab, var(--card) 70%, transparent); padding: 0.55rem 0.9rem; font-size:0.875rem; outline:none; }
        .input:focus { border-color: var(--primary); box-shadow: 0 0 0 5px color-mix(in oklab, var(--primary) 12%, transparent); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
