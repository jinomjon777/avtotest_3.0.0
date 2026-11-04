import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { adminApi, AdminApiError, openReceipt, CHEK_STATUS_LABEL, type ChekRow, type ChekStatus } from "@/lib/adminApi";
import { CreditCard, Search, RefreshCw, ExternalLink, CheckCircle, Clock, Trash2, X, Ban } from "lucide-react";

const C = {
  card: "#FFFFFF", surface: "#F8FAFC", border: "#E2E8F0", borderFocus: "#A5B4FC",
  accent: "#4F46E5", accentB: "#06B6D4", accentC: "#EF4444", gold: "#D97706", green: "#16A34A",
  text: "#0F172A", muted: "#64748B", hint: "#94A3B8",
};

const STATUS_STYLE: Record<ChekStatus, { bg: string; fg: string }> = {
  pending: { bg: "#FEF3C7", fg: C.gold },
  approved: { bg: "#DCFCE7", fg: C.green },
  rejected: { bg: "#FEE2E2", fg: C.accentC },
};

interface Profile { id: string; email: string | null; full_name: string | null; tariff_end_date: string | null; tariff_days: number | null; }

function fmtSom(n: number | null | undefined) {
  return n ? n.toLocaleString("uz-UZ") + " so'm" : "—";
}

function ActivateModal({ chek, onClose, onDone }: { chek: ChekRow; onClose: () => void; onDone: () => void }) {
  const [days, setDays] = useState(chek.tariff_days && chek.tariff_days > 0 ? chek.tariff_days : 30);
  const [loading, setLoad] = useState(false);
  const [msg, setMsg] = useState("");
  const [profile, setProf] = useState<Profile | null | undefined>(undefined);

  useEffect(() => {
    const q = supabase.from("profiles").select("id,email,full_name,tariff_end_date,tariff_days");
    const req = chek.user_id ? q.eq("id", chek.user_id) : chek.email ? q.eq("email", chek.email.toLowerCase()) : null;
    if (!req) { setProf(null); return; }
    req.maybeSingle().then(({ data }) => setProf(data ?? null));
  }, [chek.user_id, chek.email]);

  const activate = async () => {
    if (!profile) { setMsg("Foydalanuvchi topilmadi"); return; }
    setLoad(true);
    setMsg("");
    try {
      if (chek.status === "pending") {
        await adminApi("approve_chek", { chekId: chek.id, userId: profile.id, days });
      } else {
        // Chek allaqachon ko'rib chiqilgan: alohida tasdiq bilan oddiy premium berish
        if (!confirm(`Bu chek holati: "${CHEK_STATUS_LABEL[chek.status]}". Baribir ${days} kun premium berilsinmi?`)) { setLoad(false); return; }
        await adminApi("give_premium", { userId: profile.id, days, telegramChatId: chek.telegram_chat_id ?? undefined });
      }
      setMsg("✓ Premium berildi!");
      setTimeout(() => { onDone(); onClose(); }, 800);
    } catch (e) {
      const m = e instanceof AdminApiError && e.message === "already_processed"
        ? "Bu chek boshqa admin tomonidan allaqachon ko'rib chiqilgan. Ro'yxatni yangilang."
        : (e instanceof Error ? e.message : "Noma'lum xatolik");
      setMsg("Xatolik: " + m);
    }
    setLoad(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(6px)" }} onClick={onClose} />
      <div role="dialog" aria-modal="true" style={{ position: "relative", background: C.card, borderRadius: 18, padding: "24px 22px", maxWidth: 420, width: "100%", zIndex: 1, boxShadow: "0 24px 60px rgba(0,0,0,0.16)" }}>
        <button onClick={onClose} aria-label="Yopish" style={{ position: "absolute", top: 14, right: 14, background: "#F1F5F9", border: "none", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.muted }}><X size={14} /></button>
        <h3 style={{ margin: "0 0 18px", fontSize: 17, fontWeight: 700, color: C.text }}>To'lovni tasdiqlash</h3>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 13, marginBottom: 14, fontSize: 13, display: "grid", gap: 5 }}>
          <div><span style={{ color: C.muted }}>Email: </span><span style={{ color: C.text, fontWeight: 600 }}>{chek.email || (chek.telegram_username ? `@${chek.telegram_username} (Telegram)` : "—")}</span></div>
          <div><span style={{ color: C.muted }}>So'ralgan tarif: </span><span style={{ color: C.text, fontWeight: 600 }}>{chek.tariff_days ? `${chek.tariff_days} kun` : "—"} · {fmtSom(chek.amount)}</span></div>
          {chek.chek_link && (
            <div><span style={{ color: C.muted }}>Chek: </span>
              <button onClick={() => openReceipt(chek.id)} style={{ color: C.accent, background: "none", border: "none", padding: 0, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13 }}>Ko'rish <ExternalLink size={11} /></button>
            </div>
          )}
          <div><span style={{ color: C.muted }}>Sana: </span><span style={{ color: C.text }}>{new Date(chek.created_at).toLocaleString("uz-UZ")}</span></div>
        </div>
        {profile === undefined ? (
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>Foydalanuvchi qidirilmoqda...</div>
        ) : profile ? (
          <div style={{ background: "#CFFAFE", border: "1px solid #A5F3FC", borderRadius: 10, padding: "10px 13px", marginBottom: 14, display: "flex", alignItems: "center", gap: 9, fontSize: 13 }}>
            <CheckCircle size={15} color={C.accentB} />
            <div><span style={{ color: C.text, fontWeight: 600 }}>{profile.full_name || profile.email}</span>{profile.tariff_end_date && new Date(profile.tariff_end_date) > new Date() && <span style={{ color: C.muted }}> · Faol: {new Date(profile.tariff_end_date).toLocaleDateString("uz-UZ")} gacha (uzaytiriladi)</span>}</div>
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
          <input type="number" min={1} max={3650} value={days} aria-label="Maxsus kun" onChange={e => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v >= 1 && v <= 3650) setDays(v); }}
            style={{ width: 80, padding: "7px 10px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, color: C.text, fontSize: 13, textAlign: "center" }} />
          <span style={{ fontSize: 13, color: C.muted }}>kun (maxsus)</span>
        </div>
        {msg && <div role="status" style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 9, background: msg.startsWith("✓") ? "#CFFAFE" : "#FEE2E2", fontSize: 13, color: msg.startsWith("✓") ? "#0891B2" : C.accentC }}>{msg}</div>}
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
  const [cheks, setCheks] = useState<ChekRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ChekStatus | "all">("pending");
  const [selected, setSelect] = useState<ChekRow | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const fetchCheks = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await adminApi<{ data: ChekRow[] }>("list_chek");
      setCheks(data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik");
    }
    setLoading(false);
  };
  useEffect(() => { void fetchCheks(); }, []);

  const deleteChek = async (id: string) => {
    if (!confirm("Bu to'lovni (va chek rasmini) o'chirishni tasdiqlaysizmi?")) return;
    setBusy(id);
    try {
      await adminApi("delete_chek", { chekId: id });
      setCheks(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "O'chirib bo'lmadi");
    }
    setBusy(null);
  };

  const rejectChek = async (c: ChekRow) => {
    if (!confirm("Chek rad etilsinmi? Foydalanuvchiga Telegram orqali xabar boradi.")) return;
    setBusy(c.id);
    try {
      await adminApi("reject_chek", { chekId: c.id });
      await fetchCheks();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Xatolik");
    }
    setBusy(null);
  };

  const counts = useMemo(() => ({
    pending: cheks.filter(c => c.status === "pending").length,
    today: cheks.filter(c => new Date(c.created_at) > new Date(Date.now() - 86400000)).length,
  }), [cheks]);

  const filtered = cheks.filter(c =>
    (status === "all" || c.status === status) &&
    (!search || (c.email || c.telegram_username || "").toLowerCase().includes(search.toLowerCase())));

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {selected && <ActivateModal chek={selected} onClose={() => setSelect(null)} onDone={fetchCheks} />}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Jami to'lovlar", value: cheks.length, icon: <CreditCard size={19} color={C.accent} />, iconBg: "#EEF2FF" },
          { label: "Kutilmoqda", value: counts.pending, icon: <Clock size={19} color={C.gold} />, iconBg: "#FEF3C7" },
          { label: "Bugungi", value: counts.today, icon: <Clock size={19} color={C.accentB} />, iconBg: "#CFFAFE" },
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

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: C.hint }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Email yoki @username..." aria-label="Qidirish"
            style={{ width: "100%", padding: "9px 12px 9px 33px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" }}
            onFocus={e => (e.target.style.borderColor = C.borderFocus)} onBlur={e => (e.target.style.borderColor = C.border)} />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value as ChekStatus | "all")} aria-label="Holat"
          style={{ padding: "9px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13 }}>
          <option value="pending">Kutilmoqda</option>
          <option value="approved">Tasdiqlangan</option>
          <option value="rejected">Rad etilgan</option>
          <option value="all">Hammasi</option>
        </select>
        <button onClick={fetchCheks} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.muted, cursor: "pointer", fontSize: 13 }}>
          <RefreshCw size={14} /> Yangilash
        </button>
      </div>

      {error && <div role="alert" style={{ marginBottom: 12, padding: "10px 14px", borderRadius: 10, background: "#FEE2E2", color: C.accentC, fontSize: 13 }}>{error}</div>}

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
                  {["Foydalanuvchi", "Tarif", "Holat", "Chek", "Sana", "Amallar"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.hint, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: C.muted, fontSize: 14 }}>To'lovlar yo'q</td></tr>
                )}
                {filtered.map((c, i) => {
                  const st = STATUS_STYLE[c.status] ?? STATUS_STYLE.pending;
                  return (
                    <tr key={c.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none" }}>
                      <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: C.text }}>
                        {c.email || "—"}
                        {c.telegram_username && <div style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>@{c.telegram_username}</div>}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: C.text, whiteSpace: "nowrap" }}>{c.tariff_days ? `${c.tariff_days} kun` : "—"}<div style={{ fontSize: 11, color: C.muted }}>{fmtSom(c.amount)}</div></td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 100, background: st.bg, color: st.fg, whiteSpace: "nowrap" }}>{CHEK_STATUS_LABEL[c.status] ?? c.status}</span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {c.chek_link ? (
                          <button onClick={() => openReceipt(c.id)} style={{ display: "inline-flex", alignItems: "center", gap: 5, color: C.accent, fontSize: 13, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                            <ExternalLink size={12} /> Ko'rish
                          </button>
                        ) : <span style={{ color: C.hint }}>—</span>}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: C.muted, whiteSpace: "nowrap" }}>{new Date(c.created_at).toLocaleString("uz-UZ")}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: 7 }}>
                          <button onClick={() => setSelect(c)} disabled={busy === c.id}
                            style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 8, color: C.accent, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                            <CheckCircle size={12} /> {c.status === "pending" ? "Tasdiqlash" : "Premium"}
                          </button>
                          {c.status === "pending" && (
                            <button onClick={() => rejectChek(c)} disabled={busy === c.id} aria-label="Rad etish"
                              style={{ display: "flex", alignItems: "center", padding: "5px 9px", background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 8, color: C.gold, cursor: "pointer" }}>
                              <Ban size={12} />
                            </button>
                          )}
                          <button onClick={() => deleteChek(c.id)} disabled={busy === c.id} aria-label="O'chirish"
                            style={{ display: "flex", alignItems: "center", padding: "5px 9px", background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 8, color: C.accentC, cursor: "pointer" }}>
                            {busy === c.id ? "..." : <Trash2 size={12} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div style={{ marginTop: 10, textAlign: "center", fontSize: 13, color: C.hint }}>Jami {filtered.length} ta to'lov</div>
    </div>
  );
}
