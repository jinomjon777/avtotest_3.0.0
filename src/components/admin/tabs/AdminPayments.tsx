import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  CreditCard, Search, RefreshCw, ExternalLink,
  CheckCircle, Clock, Trash2, Plus,
} from "lucide-react";

const CS = {
  bg: "#F4F6FB", surface: "#F8FAFC", card: "#FFFFFF",
  border: "#E2E8F0", accent: "#6C5FF5", accentB: "#00A8A5",
  accentC: "#EF4444", gold: "#D97706",
  textPrimary: "#0F172A", textSecondary: "#64748B", textHint: "#94A3B8",
};

interface Chek {
  id: string;
  email: string;
  link: string;
  created_at: string;
}

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  tariff_end_date: string | null;
  tariff_days: number | null;
}

// Modal — foydalanuvchiga premium berish
function ActivateModal({ chek, onClose, onDone }: { chek: Chek; onClose: () => void; onDone: () => void }) {
  const [days, setDays]     = useState(30);
  const [loading, setLoad]  = useState(false);
  const [msg, setMsg]       = useState("");
  const [profile, setProf]  = useState<Profile | null>(null);

  useEffect(() => {
    supabase.from("profiles").select("id, email, full_name, tariff_end_date, tariff_days").eq("email", chek.email).maybeSingle()
      .then(({ data }) => setProf(data));
  }, [chek.email]);

  const activate = async () => {
    if (!profile) { setMsg("Foydalanuvchi topilmadi (email mos kelmadi)"); return; }
    setLoad(true);
    const start = new Date();
    const end   = new Date(); end.setDate(end.getDate() + days);
    const { error } = await supabase.from("profiles").update({
      tariff_days: days,
      tariff_start_date: start.toISOString(),
      tariff_end_date:   end.toISOString(),
    }).eq("id", profile.id);
    if (error) setMsg("Xatolik: " + error.message);
    else { setMsg("✓ Premium berildi!"); setTimeout(() => { onDone(); onClose(); }, 1000); }
    setLoad(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }} onClick={onClose} />
      <div style={{ position: "relative", background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 20, padding: "28px 24px", maxWidth: 420, width: "100%", zIndex: 1 }}>
        <h3 style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 700, color: CS.textPrimary }}>To'lovni tasdiqlash</h3>

        {/* Chek info */}
        <div style={{ background: "#F8FAFC", borderRadius: 12, padding: 14, marginBottom: 18, fontSize: 13 }}>
          <div style={{ marginBottom: 6 }}><span style={{ color: CS.textSecondary }}>Email: </span><span style={{ color: CS.textPrimary, fontWeight: 600 }}>{chek.email}</span></div>
          <div style={{ marginBottom: 6 }}>
            <span style={{ color: CS.textSecondary }}>Chek: </span>
            <a href={chek.link} target="_blank" rel="noopener noreferrer" style={{ color: CS.accent, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
              Ko'rish <ExternalLink size={12} />
            </a>
          </div>
          <div><span style={{ color: CS.textSecondary }}>Sana: </span><span style={{ color: CS.textPrimary }}>{new Date(chek.created_at).toLocaleString("uz-UZ")}</span></div>
        </div>

        {/* Profile info */}
        {profile ? (
          <div style={{ background: "rgba(0,201,196,0.07)", border: "1px solid rgba(0,201,196,0.2)", borderRadius: 12, padding: 12, marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
            <CheckCircle size={16} color={CS.accentB} />
            <div style={{ fontSize: 13 }}>
              <span style={{ color: CS.textPrimary, fontWeight: 600 }}>{profile.full_name || profile.email}</span>
              {profile.tariff_end_date && <span style={{ color: CS.textSecondary }}> · Hozirgi muddati: {new Date(profile.tariff_end_date).toLocaleDateString("uz-UZ")}</span>}
            </div>
          </div>
        ) : (
          <div style={{ background: "rgba(255,95,109,0.08)", border: "1px solid rgba(255,95,109,0.2)", borderRadius: 12, padding: 12, marginBottom: 18, fontSize: 13, color: CS.accentC }}>
            ⚠ Bu email bilan foydalanuvchi topilmadi
          </div>
        )}

        {/* Days picker */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: CS.textSecondary, marginBottom: 10 }}>Tarif muddati</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setDays(d)} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: days === d ? `1px solid rgba(124,111,255,0.5)` : `1px solid ${CS.border}`, background: days === d ? "rgba(124,111,255,0.15)" : "#F8FAFC", color: days === d ? CS.accent : CS.textSecondary, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                {d} kun
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="number" min={1} max={365} value={days} onChange={e => setDays(Number(e.target.value))}
              style={{ width: 80, padding: "8px 12px", background: "#F8FAFC", border: `1px solid ${CS.border}`, borderRadius: 10, color: CS.textPrimary, fontSize: 14, textAlign: "center" }} />
            <span style={{ fontSize: 13, color: CS.textSecondary }}>kun (maxsus kiritish)</span>
          </div>
        </div>

        {msg && <div style={{ marginBottom: 14, padding: "9px 14px", borderRadius: 10, background: msg.startsWith("✓") ? "rgba(0,201,196,0.1)" : "rgba(255,95,109,0.1)", fontSize: 13, color: msg.startsWith("✓") ? CS.accentB : CS.accentC }}>{msg}</div>}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: `1px solid ${CS.border}`, background: "transparent", color: CS.textSecondary, cursor: "pointer", fontWeight: 600 }}>Bekor qilish</button>
          <button onClick={activate} disabled={loading || !profile} style={{ flex: 1.5, padding: "11px 0", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`, color: "#fff", fontWeight: 700, cursor: loading || !profile ? "not-allowed" : "pointer", opacity: !profile ? 0.4 : 1 }}>
            {loading ? "Saqlanmoqda..." : "✓ Premiumni faollashtirish"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminPayments() {
  const [cheks, setCheks]     = useState<Chek[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [selected, setSelect] = useState<Chek | null>(null);
  const [deleting, setDel]    = useState<string | null>(null);

  useEffect(() => { fetchCheks(); }, []);

  const fetchCheks = async () => {
    setLoading(true);
    const { data } = await supabase.from("chek").select("*").order("created_at", { ascending: false });
    setCheks(data ?? []);
    setLoading(false);
  };

  const deleteChek = async (id: string) => {
    if (!confirm("Bu to'lovni o'chirishni tasdiqlaysizmi?")) return;
    setDel(id);
    await supabase.from("chek").delete().eq("id", id);
    setCheks(prev => prev.filter(c => c.id !== id));
    setDel(null);
  };

  const filtered = cheks.filter(c =>
    !search || c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {selected && <ActivateModal chek={selected} onClose={() => setSelect(null)} onDone={fetchCheks} />}

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Jami to'lovlar", value: cheks.length, icon: <CreditCard size={18} color={CS.accent} />, color: CS.accent },
          { label: "Bugungi", value: cheks.filter(c => new Date(c.created_at) > new Date(Date.now() - 86400000)).length, icon: <Clock size={18} color={CS.accentB} />, color: CS.accentB },
        ].map((s, i) => (
          <div key={i} style={{ background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 12, color: CS.textSecondary }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: CS.textPrimary }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: CS.textSecondary }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Email bo'yicha qidirish..."
            style={{ width: "100%", padding: "10px 12px 10px 36px", background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 12, color: CS.textPrimary, fontSize: 14, outline: "none", boxSizing: "border-box" }}
            onFocus={e => (e.target.style.borderColor = "rgba(124,111,255,0.4)")}
            onBlur={e => (e.target.style.borderColor = CS.border)}
          />
        </div>
        <button onClick={fetchCheks} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 12, color: CS.textSecondary, cursor: "pointer", fontSize: 13 }}>
          <RefreshCw size={14} /> Yangilash
        </button>
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
                  {["Email", "Chek havolasi", "Yuborilgan sana", "Amallar"].map(h => (
                    <th key={h} style={{ padding: "12px 18px", textAlign: "left", fontSize: 11, fontWeight: 600, color: CS.textSecondary, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: "center", padding: 48, color: CS.textSecondary, fontSize: 14 }}>
                    <CreditCard size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                    <div>Hali to'lovlar yo'q</div>
                  </td></tr>
                )}
                {filtered.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${CS.border}` : "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#F8FAFC")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "13px 18px" }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: CS.textPrimary }}>{c.email}</div>
                    </td>
                    <td style={{ padding: "13px 18px" }}>
                      <a href={c.link} target="_blank" rel="noopener noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, color: CS.accent, fontSize: 13, textDecoration: "none" }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = "0.7")}
                        onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                      >
                        <ExternalLink size={13} />
                        {c.link.length > 40 ? c.link.slice(0, 40) + "..." : c.link}
                      </a>
                    </td>
                    <td style={{ padding: "13px 18px", fontSize: 13, color: CS.textSecondary, whiteSpace: "nowrap" }}>
                      {new Date(c.created_at).toLocaleString("uz-UZ")}
                    </td>
                    <td style={{ padding: "13px 18px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setSelect(c)}
                          style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", background: "rgba(124,111,255,0.12)", border: "1px solid rgba(124,111,255,0.25)", borderRadius: 8, color: CS.accent, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                          <CheckCircle size={13} /> Tasdiqlash
                        </button>
                        <button onClick={() => deleteChek(c.id)} disabled={deleting === c.id}
                          style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", background: "rgba(255,95,109,0.08)", border: "1px solid rgba(255,95,109,0.2)", borderRadius: 8, color: CS.accentC, cursor: "pointer", fontSize: 12 }}>
                          {deleting === c.id ? "..." : <Trash2 size={13} />}
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
    </div>
  );
}