import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Search, RefreshCw, ExternalLink, CheckCircle, Clock, Trash2, X } from "lucide-react";

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-premium`;

async function adminApi(action: string, payload: Record<string, unknown> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Sessiya tugagan, qayta kiring");
  const res = await fetch(EDGE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || "Server xatosi");
  return data;
}

const C = {
  card: "#FFFFFF", surface: "#F8FAFC", border: "#E2E8F0", borderFocus: "#A5B4FC",
  accent: "#4F46E5", accentB: "#06B6D4", accentC: "#EF4444", gold: "#D97706",
  text: "#0F172A", muted: "#64748B", hint: "#94A3B8",
};

interface Chek { id: string; email: string | null; chek_link: string | null; created_at: string; telegram_username?: string | null; source?: string; }
interface Profile { id: string; email: string | null; full_name: string | null; tariff_end_date: string | null; tariff_days: number | null; }

function ActivateModal({ chek, onClose, onDone }: { chek: Chek; onClose: () => void; onDone: () => void }) {
  const [days, setDays]   = useState(30);
  const [loading, setLoad] = useState(false);
  const [msg, setMsg]     = useState("");
  const [profile, setProf] = useState<Profile | null>(null);

  useEffect(() => {
    if (!chek.email) return;
    supabase.from("profiles").select("id,email,full_name,tariff_end_date,tariff_days").eq("email", chek.email).maybeSingle()
      .then(({ data }) => setProf(data));
  }, [chek.email]);

  const activate = async () => {
    if (!profile) { setMsg("Foydalanuvchi topilmadi"); return; }
    setLoad(true);
    const start = new Date(); const end = new Date(); end.setDate(end.getDate() + days);
    const { error } = await supabase.from("profiles").update({ tariff_days: days, tariff_start_date: start.toISOString(), tariff_end_date: end.toISOString() }).eq("id", profile.id);
    if (error) setMsg("Xatolik: " + error.message);
    else { setMsg("✓ Premium berildi!"); setTimeout(() => { onDone(); onClose(); }, 900); }
    setLoad(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(6px)" }} onClick={onClose} />
      <div style={{ position: "relative", background: C.card, borderRadius: 18, padding: "24px 22px", maxWidth: 420, width: "100%", zIndex: 1, boxShadow: "0 24px 60px rgba(0,0,0,0.16)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "#F1F5F9", border: "none", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.muted }}><X size={14} /></button>
        <h3 style={{ margin: "0 0 18px", fontSize: 17, fontWeight: 700, color: C.text }}>To'lovni tasdiqlash</h3>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 13, marginBottom: 14, fontSize: 13 }}>
          <div style={{ marginBottom: 5 }}><span style={{ color: C.muted }}>Email: </span><span style={{ color: C.text, fontWeight: 600 }}>{chek.email || (chek.telegram_username ? `@${chek.telegram_username} (Telegram)` : "—")}</span></div>
          <div style={{ marginBottom: 5 }}><span style={{ color: C.muted }}>Chek: </span><a href={chek.chek_link || "#"} target="_blank" rel="noopener noreferrer" style={{ color: C.accent, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>Ko'rish <ExternalLink size={11} /></a></div>
          <div><span style={{ color: C.muted }}>Sana: </span><span style={{ color: C.text }}>{new Date(chek.created_at).toLocaleString("uz-UZ")}</span></div>
        </div>
        {profile ? (
          <div style={{ background: "#CFFAFE", border: "1px solid #A5F3FC", borderRadius: 10, padding: "10px 13px", marginBottom: 14, display: "flex", alignItems: "center", gap: 9, fontSize: 13 }}>
            <CheckCircle size={15} color={C.accentB} />
            <div><span style={{ color: C.text, fontWeight: 600 }}>{profile.full_name || profile.email}</span>{profile.tariff_end_date && <span style={{ color: C.muted }}> · Muddati: {new Date(profile.tariff_end_date).toLocaleDateString("uz-UZ")}</span>}</div>
          </div>
        ) : (
          <div style={{ background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 13px", marginBottom: 14, fontSize: 13, color: C.accentC }}>⚠ Bu email bilan foydalanuvchi topilmadi</div>
        )}
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 9 }}>Tarif muddati</label>
        <div style={{ display: "flex", gap: 7, marginBottom: 10 }}>
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)} style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: `1px solid ${days === d ? C.accent : C.border}`, background: days === d ? C.accent : C.surface, color: days === d ? "#fff" : C.muted, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{d} kun</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <input type="number" min={1} max={365} value={days} onChange={e => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v >= 1) setDays(v); }}
            style={{ width: 72, padding: "7px 10px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, fontSize: 13, textAlign: "center" }} />
          <span style={{ fontSize: 13, color: C.muted }}>kun (maxsus)</span>
        </div>
        {msg && <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 9, background: msg.startsWith("✓") ? "#CFFAFE" : "#FEE2E2", fontSize: 13, color: msg.startsWith("✓") ? "#0891B2" : C.accentC }}>{msg}</div>}
        <div style={{ display: "flex", gap: 9 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.muted, cursor: "pointer", fontSize: 13 }}>Bekor qilish</button>
          <button onClick={activate} disabled={loading || !profile} style={{ flex: 2, padding: "10px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#4F46E5,#06B6D4)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: loading || !profile ? "not-allowed" : "pointer", opacity: !profile ? 0.5 : 1 }}>
            {loading ? "Saqlanmoqda..." : "✓ Premiumni faollashtirish"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPayments() {
  const [cheks, setCheks]     = useState<Chek[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [selected, setSelect] = useState<Chek | null>(null);
  const [deleting, setDel]    = useState<string | null>(null);

  useEffect(() => { fetchCheks(); }, []);
  const fetchCheks = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi("list_chek");
      setCheks(data ?? []);
    } catch {
      setCheks([]);
    }
    setLoading(false);
  };
  const deleteChek = async (id: string) => {
    if (!confirm("Bu to'lovni o'chirishni tasdiqlaysizmi?")) return;
    setDel(id);
    try {
      await adminApi("delete_chek", { chekId: id });
      setCheks(prev => prev.filter(c => c.id !== id));
    } catch { /* xato — ro'yxat o'zgarmaydi */ }
    setDel(null);
  };
  const filtered = cheks.filter(c => !search || (c.email || c.telegram_username || "").toLowerCase().includes(search.toLowerCase()));
  const today = cheks.filter(c => new Date(c.created_at) > new Date(Date.now() - 86400000)).length;

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {selected && <ActivateModal chek={selected} onClose={() => setSelect(null)} onDone={fetchCheks} />}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Jami to'lovlar", value: cheks.length,   icon: <CreditCard size={19} color={C.accent} />,  iconBg: "#EEF2FF" },
          { label: "Bugungi",        value: today,           icon: <Clock size={19} color={C.accentB} />,      iconBg: "#CFFAFE" },
        ].map((s, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: s.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 12, color: C.muted }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: C.text }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: C.hint }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Email bo'yicha qidirish..."
            style={{ width: "100%", padding: "9px 12px 9px 33px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" }}
            onFocus={e => (e.target.style.borderColor = C.borderFocus)} onBlur={e => (e.target.style.borderColor = C.border)} />
        </div>
        <button onClick={fetchCheks} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.muted, cursor: "pointer", fontSize: 13 }}>
          <RefreshCw size={14} /> Yangilash
        </button>
      </div>

      {/* Table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 160 }}>
            <div style={{ width: 28, height: 28, border: "3px solid #E0E7FF", borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
                  {["Email", "Chek havolasi", "Yuborilgan sana", "Amallar"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.hint, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: "center", padding: 40, color: C.muted, fontSize: 14 }}>Hali to'lovlar yo'q</td></tr>
                )}
                {filtered.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.surface)}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: C.text }}>{c.email || (c.telegram_username ? `@${c.telegram_username}` : "—")}</td>
                    <td style={{ padding: "12px 16px" }}>
                      {c.chek_link ? (
                        <a href={c.chek_link} target="_blank" rel="noopener noreferrer"
                          style={{ display: "inline-flex", alignItems: "center", gap: 5, color: C.accent, fontSize: 13, textDecoration: "none" }}>
                          <ExternalLink size={12} /> {c.chek_link.length > 38 ? c.chek_link.slice(0, 38) + "..." : c.chek_link}
                        </a>
                      ) : <span style={{ color: C.hint }}>—</span>}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: C.muted, whiteSpace: "nowrap" }}>{new Date(c.created_at).toLocaleString("uz-UZ")}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 7 }}>
                        <button onClick={() => setSelect(c)}
                          style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 8, color: C.accent, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                          <CheckCircle size={12} /> Tasdiqlash
                        </button>
                        <button onClick={() => deleteChek(c.id)} disabled={deleting === c.id}
                          style={{ display: "flex", alignItems: "center", padding: "5px 9px", background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 8, color: C.accentC, cursor: "pointer" }}>
                          {deleting === c.id ? "..." : <Trash2 size={12} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div style={{ marginTop: 10, textAlign: "center", fontSize: 13, color: C.hint }}>Jami {filtered.length} ta to'lov</div>
    </div>
  );
}