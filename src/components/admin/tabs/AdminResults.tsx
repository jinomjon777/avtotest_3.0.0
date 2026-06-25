import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Clock, User, ChevronDown, ChevronUp, Search, RefreshCw, Activity } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
interface TestResult {
  id: string;
  user_id: string;
  variant: number;
  correct_answers: number;
  total_questions: number;
  time_taken_seconds: number;
  created_at: string;
  profile?: { full_name: string | null; email: string | null };
}

interface UserActivity {
  user_id: string;
  full_name: string | null;
  email: string | null;
  last_sign_in_at: string | null;
  created_at: string | null;
  test_count: number;
  best_score: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const C = {
  bg: "#F1F5F9", card: "#FFFFFF", border: "#E2E8F0",
  accent: "#4F46E5", green: "#10B981", red: "#EF4444",
  yellow: "#F59E0B", text: "#0F172A", sub: "#64748B",
};

function fmt(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function pct(correct: number, total: number) {
  return total ? Math.round((correct / total) * 100) : 0;
}
function scoreColor(p: number) {
  if (p >= 90) return C.green;
  if (p >= 70) return C.yellow;
  return C.red;
}

// ── Main Component ─────────────────────────────────────────────────────────
type View = "results" | "activity";

export default function AdminResults() {
  const [view, setView] = useState<View>("results");

  return (
    <div>
      {/* View Toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {([
          { id: "results",  label: "Test natijalari", icon: Trophy },
          { id: "activity", label: "Faollik",          icon: Activity },
        ] as { id: View; label: string; icon: any }[]).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setView(id)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 600,
              background: view === id ? C.accent : C.card,
              color: view === id ? "#fff" : C.sub,
              boxShadow: view === id ? "0 2px 8px rgba(79,70,229,0.25)" : "0 1px 3px rgba(0,0,0,0.06)",
            }}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {view === "results"  && <ResultsTab />}
      {view === "activity" && <ActivityTab />}
    </div>
  );
}

// ── Test Natijalari ────────────────────────────────────────────────────────
function ResultsTab() {
  const [rows, setRows]         = useState<TestResult[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [sortBy, setSortBy]     = useState<"created_at" | "correct_answers" | "variant">("created_at");
  const [sortAsc, setSortAsc]   = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("test_results")
      .select("*, profiles(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(500);
    if (!error && data) setRows(data as any);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = rows
    .filter(r => {
      const q = search.toLowerCase();
      return (
        (r.profile?.full_name?.toLowerCase().includes(q) ?? false) ||
        (r.profile?.email?.toLowerCase().includes(q) ?? false) ||
        String(r.variant).includes(q)
      );
    })
    .sort((a, b) => {
      const v = sortBy === "created_at"
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : (a as any)[sortBy] - (b as any)[sortBy];
      return sortAsc ? v : -v;
    });

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) setSortAsc(v => !v);
    else { setSortBy(col); setSortAsc(false); }
  }

  const SortBtn = ({ col, label }: { col: typeof sortBy; label: string }) => (
    <span onClick={() => toggleSort(col)}
      style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3, userSelect: "none" }}>
      {label}
      {sortBy === col ? (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null}
    </span>
  );

  return (
    <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
      {/* Toolbar */}
      <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 300 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.sub }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Ism yoki email qidirish..."
            style={{ width: "100%", paddingLeft: 32, paddingRight: 10, height: 34, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.bg }} />
        </div>
        <span style={{ fontSize: 12, color: C.sub }}>{filtered.length} ta natija</span>
        <button onClick={load} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: C.sub, display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
          <RefreshCw size={12} /> Yangilash
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: C.sub }}>Yuklanmoqda...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: C.sub }}>Natija topilmadi</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.bg }}>
                {[
                  { col: null,              label: "Foydalanuvchi" },
                  { col: "variant",         label: "Variant" },
                  { col: "correct_answers", label: "Natija" },
                  { col: null,              label: "Vaqt" },
                  { col: "created_at",      label: "Sana" },
                ].map(({ col, label }, i) => (
                  <th key={i} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: C.sub, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>
                    {col ? <SortBtn col={col as any} label={label} /> : label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const p = pct(r.correct_answers, r.total_questions);
                const isExp = expanded === r.id;
                return (
                  <>
                    <tr key={r.id}
                      onClick={() => setExpanded(isExp ? null : r.id)}
                      style={{ cursor: "pointer", borderBottom: `1px solid ${C.border}`, transition: "background 0.1s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#F8FAFC")}
                      onMouseLeave={e => (e.currentTarget.style.background = "")}>
                      {/* User */}
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#4F46E5,#06B6D4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <User size={13} color="#fff" />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: C.text, fontSize: 13 }}>{r.profile?.full_name || "Noma'lum"}</div>
                            <div style={{ fontSize: 11, color: C.sub }}>{r.profile?.email || ""}</div>
                          </div>
                        </div>
                      </td>
                      {/* Variant */}
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ padding: "3px 10px", borderRadius: 100, background: "#EEF2FF", color: C.accent, fontWeight: 700, fontSize: 12 }}>
                          #{r.variant}
                        </span>
                      </td>
                      {/* Score */}
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 50, height: 6, borderRadius: 3, background: "#E2E8F0", overflow: "hidden" }}>
                            <div style={{ width: `${p}%`, height: "100%", background: scoreColor(p), borderRadius: 3 }} />
                          </div>
                          <span style={{ fontWeight: 700, color: scoreColor(p), fontSize: 13 }}>{r.correct_answers}/{r.total_questions}</span>
                          <span style={{ fontSize: 11, color: C.sub }}>({p}%)</span>
                        </div>
                      </td>
                      {/* Time */}
                      <td style={{ padding: "10px 14px", color: C.sub }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Clock size={12} />{fmt(r.time_taken_seconds)}
                        </div>
                      </td>
                      {/* Date */}
                      <td style={{ padding: "10px 14px", color: C.sub, fontSize: 12 }}>{fmtDate(r.created_at)}</td>
                    </tr>
                    {isExp && (
                      <tr key={r.id + "_exp"} style={{ background: "#F8FAFF" }}>
                        <td colSpan={5} style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}` }}>
                          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                            <Stat label="Ball" value={`${p}%`} color={scoreColor(p)} />
                            <Stat label="To'g'ri javoblar" value={`${r.correct_answers} ta`} color={C.green} />
                            <Stat label="Noto'g'ri javoblar" value={`${r.total_questions - r.correct_answers} ta`} color={C.red} />
                            <Stat label="Sarflangan vaqt" value={fmt(r.time_taken_seconds)} color={C.accent} />
                            <Stat label="Variant" value={`#${r.variant}`} color={C.sub} />
                            <Stat label="Sana" value={fmtDate(r.created_at)} color={C.sub} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: C.sub, marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: 14, color }}>{value}</div>
    </div>
  );
}

// ── Faollik ────────────────────────────────────────────────────────────────
function ActivityTab() {
  const [rows, setRows]       = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);

    // Profillar + auth.users last_sign_in_at
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, created_at");

    // Test statistikasi
    const { data: stats } = await supabase
      .from("test_results")
      .select("user_id, correct_answers, total_questions");

    // auth.users dan last_sign_in_at olish
    const { data: authData } = await (supabase as any).auth.admin.listUsers({ perPage: 1000 });
    const authMap: Record<string, string> = {};
    authData?.users?.forEach((u: any) => {
      if (u.last_sign_in_at) authMap[u.id] = u.last_sign_in_at;
    });

    const statMap: Record<string, { count: number; best: number }> = {};
    stats?.forEach(s => {
      if (!statMap[s.user_id]) statMap[s.user_id] = { count: 0, best: 0 };
      statMap[s.user_id].count++;
      const p = pct(s.correct_answers, s.total_questions);
      if (p > statMap[s.user_id].best) statMap[s.user_id].best = p;
    });

    const result: UserActivity[] = (profiles || []).map(p => ({
      user_id:         p.id,
      full_name:       p.full_name,
      email:           p.email,
      last_sign_in_at: authMap[p.id] || null,
      created_at:      p.created_at,
      test_count:      statMap[p.id]?.count || 0,
      best_score:      statMap[p.id]?.best  || 0,
    }));

    result.sort((a, b) => {
      const at = a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : 0;
      const bt = b.last_sign_in_at ? new Date(b.last_sign_in_at).getTime() : 0;
      return bt - at;
    });

    setRows(result);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    return (r.full_name?.toLowerCase().includes(q) ?? false) ||
           (r.email?.toLowerCase().includes(q) ?? false);
  });

  return (
    <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, overflow: "hidden" }}>
      {/* Toolbar */}
      <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 300 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.sub }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Ism yoki email..."
            style={{ width: "100%", paddingLeft: 32, paddingRight: 10, height: 34, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: C.bg }} />
        </div>
        <span style={{ fontSize: 12, color: C.sub }}>{filtered.length} ta foydalanuvchi</span>
        <button onClick={load} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: C.sub, display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
          <RefreshCw size={12} /> Yangilash
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: C.sub }}>Yuklanmoqda...</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.bg }}>
                {["Foydalanuvchi", "Ro'yxatdan o'tgan", "Oxirgi kirish", "Testlar", "Eng yaxshi natija"].map((h, i) => (
                  <th key={i} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: C.sub, borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.user_id}
                  style={{ borderBottom: `1px solid ${C.border}` }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#F8FAFC")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}>
                  {/* User */}
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#4F46E5,#06B6D4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <User size={13} color="#fff" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: C.text }}>{r.full_name || "Noma'lum"}</div>
                        <div style={{ fontSize: 11, color: C.sub }}>{r.email}</div>
                      </div>
                    </div>
                  </td>
                  {/* Registered */}
                  <td style={{ padding: "10px 14px", color: C.sub, fontSize: 12 }}>{fmtDate(r.created_at)}</td>
                  {/* Last sign in */}
                  <td style={{ padding: "10px 14px" }}>
                    {r.last_sign_in_at ? (
                      <div>
                        <div style={{ fontSize: 12, color: C.text }}>{fmtDate(r.last_sign_in_at)}</div>
                        <div style={{ fontSize: 11, color: C.sub }}>{timeAgo(r.last_sign_in_at)}</div>
                      </div>
                    ) : (
                      <span style={{ color: C.sub, fontSize: 12 }}>Hech kirmagan</span>
                    )}
                  </td>
                  {/* Test count */}
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ padding: "3px 10px", borderRadius: 100, background: r.test_count > 0 ? "#EEF2FF" : "#F1F5F9", color: r.test_count > 0 ? C.accent : C.sub, fontWeight: 700, fontSize: 12 }}>
                      {r.test_count} ta
                    </span>
                  </td>
                  {/* Best score */}
                  <td style={{ padding: "10px 14px" }}>
                    {r.test_count > 0 ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 50, height: 6, borderRadius: 3, background: "#E2E8F0" }}>
                          <div style={{ width: `${r.best_score}%`, height: "100%", background: scoreColor(r.best_score), borderRadius: 3 }} />
                        </div>
                        <span style={{ fontWeight: 700, color: scoreColor(r.best_score), fontSize: 13 }}>{r.best_score}%</span>
                      </div>
                    ) : (
                      <span style={{ color: C.sub, fontSize: 12 }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1)  return "Hozir";
  if (min < 60) return `${min} daqiqa oldin`;
  const h = Math.floor(min / 60);
  if (h < 24)   return `${h} soat oldin`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days} kun oldin`;
  return `${Math.floor(days / 30)} oy oldin`;
}