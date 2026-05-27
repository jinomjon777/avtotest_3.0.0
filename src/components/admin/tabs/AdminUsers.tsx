import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Search, Crown, Clock, ChevronDown, ChevronUp,
  RefreshCw, Plus, Minus, Check, X, Filter, User,
} from "lucide-react";

const CS = {
  bg: "#0A0B14", card: "#16172a", border: "rgba(255,255,255,0.07)",
  accent: "#7C6FFF", accentB: "#00C9C4", accentC: "#FF5F6D", gold: "#F5A623",
  textPrimary: "#FFFFFF", textSecondary: "rgba(255,255,255,0.55)",
};

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  username: string | null;
  avatar_url: string | null;
  tariff_days: number | null;
  tariff_start_date: string | null;
  tariff_end_date: string | null;
  is_trial_used: boolean | null;
  trial_end_date: string | null;
  created_at: string;
}

type StatusFilter = "all" | "premium" | "trial" | "free" | "expired";

function getStatus(u: Profile): "premium" | "trial" | "free" | "expired" {
  const now = new Date();
  const days = u.tariff_days ?? 0;
  if (days > 0 && u.tariff_end_date) {
    return new Date(u.tariff_end_date) > now ? "premium" : "expired";
  }
  if (u.is_trial_used && u.trial_end_date) {
    return new Date(u.trial_end_date) > now ? "trial" : "expired";
  }
  return "free";
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string; border: string }> = {
    premium: { label: "Premium",  color: CS.gold,    bg: "rgba(245,166,35,0.12)",  border: "rgba(245,166,35,0.25)" },
    trial:   { label: "Trial",    color: CS.accentB, bg: "rgba(0,201,196,0.10)",   border: "rgba(0,201,196,0.25)" },
    free:    { label: "Bepul",    color: CS.textSecondary, bg: "rgba(255,255,255,0.05)", border: CS.border },
    expired: { label: "Muddati tugagan", color: CS.accentC, bg: "rgba(255,95,109,0.10)", border: "rgba(255,95,109,0.25)" },
  };
  const s = map[status] ?? map.free;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600, color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
      {status === "premium" && <Crown size={10} />}
      {status === "trial"   && <Clock size={10} />}
      {s.label}
    </span>
  );
}

// ─── Inline days editor ───────────────────────────────────────────────────────
function DaysEditor({ user, onSaved }: { user: Profile; onSaved: () => void }) {
  const [days, setDays]   = useState<number>(30);
  const [saving, setSave] = useState(false);
  const [msg, setMsg]     = useState("");

  const save = async () => {
    setSave(true); setMsg("");
    try {
      const startDate = new Date();
      const endDate   = new Date(startDate);
      endDate.setDate(endDate.getDate() + days);

      const { error } = await supabase
        .from("profiles")
        .update({
          tariff_days:       days,
          tariff_start_date: startDate.toISOString(),
          tariff_end_date:   endDate.toISOString(),
        })
        .eq("id", user.id);

      if (error) { setMsg("Xatolik: " + error.message); }
      else       { setMsg("✓ Saqlandi"); onSaved(); }
    } catch (e: any) { setMsg("Xatolik: " + e.message); }
    setSave(false);
  };

  const revoke = async () => {
    setSave(true); setMsg("");
    const { error } = await supabase
      .from("profiles")
      .update({ tariff_days: 0, tariff_end_date: null, tariff_start_date: null })
      .eq("id", user.id);
    if (error) setMsg("Xatolik: " + error.message);
    else       { setMsg("✓ Bekor qilindi"); onSaved(); }
    setSave(false);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <button onClick={() => setDays(d => Math.max(1, d - 1))} style={btnSm}><Minus size={12} /></button>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <input
          type="number" min={1} max={365} value={days}
          onChange={e => setDays(Number(e.target.value))}
          style={{ width: 52, padding: "5px 8px", background: "rgba(255,255,255,0.06)", border: `1px solid ${CS.border}`, borderRadius: 8, color: CS.textPrimary, fontSize: 13, textAlign: "center" }}
        />
        <span style={{ fontSize: 12, color: CS.textSecondary }}>kun</span>
      </div>
      <button onClick={() => setDays(d => Math.min(365, d + 1))} style={btnSm}><Plus size={12} /></button>
      <button onClick={save} disabled={saving} style={{ ...btnAction, background: `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})` }}>
        {saving ? "..." : <><Check size={12} /> Berish</>}
      </button>
      <button onClick={revoke} disabled={saving} style={{ ...btnAction, background: "rgba(255,95,109,0.15)", color: CS.accentC }}>
        <X size={12} /> Bekor
      </button>
      {msg && <span style={{ fontSize: 12, color: msg.startsWith("✓") ? CS.accentB : CS.accentC }}>{msg}</span>}
    </div>
  );
}

const btnSm: React.CSSProperties = {
  width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
  background: "rgba(255,255,255,0.07)", border: `1px solid ${CS.border}`,
  borderRadius: 7, cursor: "pointer", color: CS.textSecondary,
};
const btnAction: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 4,
  padding: "5px 12px", borderRadius: 8, border: "none",
  color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer",
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminUsers() {
  const [users, setUsers]       = useState<Profile[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState<StatusFilter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage]         = useState(1);
  const PER_PAGE = 15;

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setUsers(data ?? []);
    setLoading(false);
  };

  const filtered = users.filter(u => {
    const matchSearch = !search
      || (u.full_name?.toLowerCase().includes(search.toLowerCase()))
      || (u.email?.toLowerCase().includes(search.toLowerCase()))
      || (u.username?.toLowerCase().includes(search.toLowerCase()));
    const status = getStatus(u);
    const matchFilter = filter === "all" || status === filter;
    return matchSearch && matchFilter;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const filterCounts: Record<StatusFilter, number> = {
    all:     users.length,
    premium: users.filter(u => getStatus(u) === "premium").length,
    trial:   users.filter(u => getStatus(u) === "trial").length,
    free:    users.filter(u => getStatus(u) === "free").length,
    expired: users.filter(u => getStatus(u) === "expired").length,
  };

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: CS.textSecondary }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Ism, email yoki username bo'yicha qidirish..."
            style={{ width: "100%", padding: "10px 12px 10px 36px", background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 12, color: CS.textPrimary, fontSize: 14, outline: "none", boxSizing: "border-box" }}
            onFocus={e => (e.target.style.borderColor = "rgba(124,111,255,0.4)")}
            onBlur={e => (e.target.style.borderColor = CS.border)}
          />
        </div>
        <button onClick={fetchUsers} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 12, color: CS.textSecondary, cursor: "pointer", fontSize: 13 }}>
          <RefreshCw size={14} /> Yangilash
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {(["all", "premium", "trial", "free", "expired"] as StatusFilter[]).map(f => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            style={{
              padding: "7px 16px", borderRadius: 100, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 600,
              background: filter === f ? `rgba(124,111,255,0.2)` : "rgba(255,255,255,0.05)",
              color: filter === f ? CS.accent : CS.textSecondary,
              border: filter === f ? "1px solid rgba(124,111,255,0.35)" : `1px solid ${CS.border}`,
            } as any}
          >
            {{ all: "Hammasi", premium: "Premium", trial: "Trial", free: "Bepul", expired: "Muddati tugagan" }[f]}
            <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>({filterCounts[f]})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 16, overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
            <div style={{ width: 32, height: 32, border: "3px solid rgba(124,111,255,0.2)", borderTopColor: CS.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${CS.border}` }}>
                  {["Foydalanuvchi", "Email", "Status", "Tugash sanasi", "Qo'shildi", ""].map(h => (
                    <th key={h} style={{ padding: "12px 18px", textAlign: "left", fontSize: 11, fontWeight: 600, color: CS.textSecondary, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: CS.textSecondary, fontSize: 14 }}>Foydalanuvchi topilmadi</td></tr>
                )}
                {paginated.map((u) => {
                  const status = getStatus(u);
                  const isOpen = expanded === u.id;
                  return (
                    <>
                      <tr
                        key={u.id}
                        style={{ borderBottom: `1px solid ${CS.border}`, cursor: "pointer" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "13px 18px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                              {(u.full_name || u.email || "?")[0].toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: CS.textPrimary }}>{u.full_name || "—"}</div>
                              {u.username && <div style={{ fontSize: 11, color: CS.textSecondary }}>@{u.username}</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "13px 18px", fontSize: 13, color: CS.textSecondary }}>{u.email || "—"}</td>
                        <td style={{ padding: "13px 18px" }}><StatusBadge status={status} /></td>
                        <td style={{ padding: "13px 18px", fontSize: 13, color: CS.textSecondary }}>
                          {u.tariff_end_date ? new Date(u.tariff_end_date).toLocaleDateString("uz-UZ") : "—"}
                        </td>
                        <td style={{ padding: "13px 18px", fontSize: 13, color: CS.textSecondary }}>
                          {new Date(u.created_at).toLocaleDateString("uz-UZ")}
                        </td>
                        <td style={{ padding: "13px 18px" }}>
                          <button
                            onClick={() => setExpanded(isOpen ? null : u.id)}
                            style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", background: "rgba(124,111,255,0.1)", border: "1px solid rgba(124,111,255,0.2)", borderRadius: 8, color: CS.accent, cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                          >
                            <Crown size={12} /> Boshqarish {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr key={u.id + "_expanded"}>
                          <td colSpan={6} style={{ padding: "16px 18px", background: "rgba(124,111,255,0.05)", borderBottom: `1px solid ${CS.border}` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: CS.textPrimary }}>Premium berish:</div>
                              <div style={{ display: "flex", gap: 6 }}>
                                {[7, 30, 90].map(d => (
                                  <button
                                    key={d}
                                    onClick={async () => {
                                      const start = new Date();
                                      const end = new Date(); end.setDate(end.getDate() + d);
                                      await supabase.from("profiles").update({ tariff_days: d, tariff_start_date: start.toISOString(), tariff_end_date: end.toISOString() }).eq("id", u.id);
                                      fetchUsers();
                                    }}
                                    style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}
                                  >
                                    {d} kun
                                  </button>
                                ))}
                              </div>
                              <div style={{ fontSize: 13, color: CS.textSecondary }}>yoki</div>
                              <DaysEditor user={u} onSaved={fetchUsers} />
                            </div>
                            {/* User info */}
                            <div style={{ marginTop: 12, display: "flex", gap: 20, flexWrap: "wrap" }}>
                              <div style={{ fontSize: 12, color: CS.textSecondary }}>
                                ID: <span style={{ fontFamily: "monospace", color: CS.textPrimary, fontSize: 11 }}>{u.id}</span>
                              </div>
                              {u.tariff_days && u.tariff_days > 0 && (
                                <div style={{ fontSize: 12, color: CS.textSecondary }}>
                                  Tarif: <span style={{ color: CS.gold, fontWeight: 700 }}>{u.tariff_days} kun</span>
                                </div>
                              )}
                              {u.tariff_end_date && (
                                <div style={{ fontSize: 12, color: CS.textSecondary }}>
                                  Tugash: <span style={{ color: CS.textPrimary }}>{new Date(u.tariff_end_date).toLocaleString("uz-UZ")}</span>
                                </div>
                              )}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 20, alignItems: "center" }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "7px 16px", borderRadius: 10, border: `1px solid ${CS.border}`, background: CS.card, color: CS.textSecondary, cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1, fontSize: 13 }}>← Oldingi</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1).map((p, i, arr) => (
            <>
              {i > 0 && arr[i - 1] !== p - 1 && <span style={{ color: CS.textSecondary }}>...</span>}
              <button key={p} onClick={() => setPage(p)} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${page === p ? "rgba(124,111,255,0.4)" : CS.border}`, background: page === p ? "rgba(124,111,255,0.15)" : CS.card, color: page === p ? CS.accent : CS.textSecondary, cursor: "pointer", fontWeight: page === p ? 700 : 400, fontSize: 13 }}>{p}</button>
            </>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "7px 16px", borderRadius: 10, border: `1px solid ${CS.border}`, background: CS.card, color: CS.textSecondary, cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1, fontSize: 13 }}>Keyingi →</button>
        </div>
      )}

      <div style={{ marginTop: 12, textAlign: "center", fontSize: 13, color: CS.textSecondary }}>
        Jami {filtered.length} ta foydalanuvchi
      </div>
    </div>
  );
}
