import { useEffect, useState, Fragment } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Search, Crown, Clock, ChevronDown, ChevronUp,
  RefreshCw, Plus, Minus, Check, X, UserPlus,
  Trash2, Edit3, Eye, EyeOff, Save,
} from "lucide-react";

// Edge Function orqali xavfsiz admin operatsiyalari.
// Statik secret o'rniga joriy admin sessiyasining haqiqiy JWT'si
// yuboriladi — edge function uni server tomonda tekshiradi va
// profiles.role === 'admin' ekanini tasdiqlaydi.
const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-premium`;

async function adminApi(action: string, payload: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Sessiya tugagan, qayta kiring");

  const res = await fetch(EDGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || "Server xatosi");
  return data;
}

const C = {
  bg: "#F1F5F9", card: "#FFFFFF", surface: "#F8FAFC",
  border: "#E2E8F0", borderFocus: "#A5B4FC",
  accent: "#4F46E5", accentB: "#06B6D4", accentC: "#EF4444", gold: "#D97706",
  text: "#0F172A", muted: "#64748B", hint: "#94A3B8",
};

const inp: React.CSSProperties = {
  width: "100%", padding: "9px 13px",
  background: "#F8FAFC", border: `1px solid ${C.border}`,
  borderRadius: 10, color: C.text, fontSize: 13,
  outline: "none", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600,
  color: C.muted, marginBottom: 5,
};
const btnSm: React.CSSProperties = {
  width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
  background: "#EEF2FF", border: `1px solid #C7D2FE`,
  borderRadius: 7, cursor: "pointer", color: C.accent,
};

interface Profile {
  id: string; full_name: string | null; email: string | null;
  username: string | null; tariff_days: number | null;
  tariff_start_date: string | null; tariff_end_date: string | null;
  is_trial_used: boolean | null; trial_end_date: string | null;
  created_at: string;
}
type StatusFilter = "all" | "premium" | "trial" | "free" | "expired";

function getStatus(u: Profile): "premium" | "trial" | "free" | "expired" {
  const now = new Date();
  const days = u.tariff_days ?? 0;
  if (days > 0 && u.tariff_end_date && new Date(u.tariff_end_date) > now) return "premium";
  if (days > 0 && u.tariff_end_date && new Date(u.tariff_end_date) <= now) return "expired";
  if (u.is_trial_used && u.trial_end_date)
    return new Date(u.trial_end_date) > now ? "trial" : "expired";
  return "free";
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string; border: string }> = {
    premium: { label: "Premium",         color: "#D97706", bg: "#FEF3C7", border: "#FDE68A" },
    trial:   { label: "Trial",           color: "#0891B2", bg: "#CFFAFE", border: "#A5F3FC" },
    free:    { label: "Bepul",           color: "#64748B", bg: "#F1F5F9", border: "#E2E8F0" },
    expired: { label: "Muddati tugagan", color: "#DC2626", bg: "#FEE2E2", border: "#FECACA" },
  };
  const s = map[status] ?? map.free;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 100, fontSize: 11, fontWeight: 600, color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
      {status === "premium" && <Crown size={10} />}
      {status === "trial"   && <Clock size={10} />}
      {s.label}
    </span>
  );
}

function PremiumConfig({ value, onChange }: { value: { enabled: boolean; days: number }; onChange: (v: { enabled: boolean; days: number }) => void }) {
  return (
    <div style={{ background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 10, padding: "12px 14px" }}>
      <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: value.enabled ? 12 : 0 }}>
        <div onClick={() => onChange({ ...value, enabled: !value.enabled })}
          style={{ width: 38, height: 21, borderRadius: 11, background: value.enabled ? C.accent : "#CBD5E1", position: "relative", transition: "background 0.2s", cursor: "pointer", flexShrink: 0 }}>
          <div style={{ position: "absolute", top: 3, left: value.enabled ? 19 : 3, width: 15, height: 15, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, display: "flex", alignItems: "center", gap: 5 }}><Crown size={12} color={C.gold} /> Premium berish</div>
          <div style={{ fontSize: 11, color: C.muted }}>Yaratish bilan birga premium yoqiladi</div>
        </div>
      </label>
      {value.enabled && (
        <div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 7 }}>Muddat (kun):</div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 9 }}>
            {[7, 30, 90, 180, 365].map(d => (
              <button key={d} type="button" onClick={() => onChange({ ...value, days: d })}
                style={{ padding: "4px 12px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 700, background: value.days === d ? C.accent : "#fff", color: value.days === d ? "#fff" : C.muted, border: `1px solid ${value.days === d ? C.accent : C.border}` } as any}>
                {d} kun
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <button type="button" onClick={() => onChange({ ...value, days: Math.max(1, value.days - 1) })} style={btnSm}><Minus size={12} /></button>
            <input type="number" min={1} max={999} value={value.days}
              onChange={e => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v >= 1 && v <= 999) onChange({ ...value, days: v }); }}
              style={{ width: 56, padding: "5px 7px", background: "#fff", border: `1px solid ${C.border}`, borderRadius: 7, color: C.text, fontSize: 13, textAlign: "center" }} />
            <button type="button" onClick={() => onChange({ ...value, days: Math.min(999, value.days + 1) })} style={btnSm}><Plus size={12} /></button>
            <span style={{ fontSize: 11, color: C.muted }}>→ {new Date(Date.now() + value.days * 86400000).toLocaleDateString("uz-UZ")} gacha</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ModalWrap({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(6px)" }} onClick={onClose} />
      {children}
    </div>
  );
}

function CreateModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email,    setEmail]    = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [premium,  setPremium]  = useState({ enabled: false, days: 30 });
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  const handleSave = async () => {
    if (!email.trim())    { setError("Email majburiy"); return; }
    if (!password.trim()) { setError("Parol majburiy"); return; }
    if (password.length < 6) { setError("Parol kamida 6 ta belgi bo'lishi kerak"); return; }
    setSaving(true); setError("");
    try {
      const uname = username.trim();
      if (uname) {
        const { data: ex } = await supabase.from("profiles").select("id").eq("username", uname).limit(1).maybeSingle();
        if (ex) { setError("Username mavjud — boshqa tanlang"); setSaving(false); return; }
      }
      const em = email.trim().toLowerCase();
      const { data: ex2 } = await supabase.from("profiles").select("id").eq("email", em).limit(1).maybeSingle();
      if (ex2) { setError("Bu email allaqachon ro'yxatdan o'tgan"); setSaving(false); return; }
      const { data, error: rpcErr } = await (supabase as any).rpc("admin_create_user", { p_email: em, p_password: password.trim(), p_name: fullName.trim() || null, p_username: uname || null });
      if (rpcErr) { setError(rpcErr.message); setSaving(false); return; }
      if ((data as any)?.error) { setError((data as any).error); setSaving(false); return; }
      const userId = (data as any)?.id ?? (data as any)?.user_id ?? (typeof data === "string" ? data : null);
      if (premium.enabled && userId) {
        try {
          await adminApi("give_premium", { userId, days: premium.days });
        } catch (e: any) { console.warn("Premium berish xatosi:", e.message); }
      }
      onSaved(); onClose();
    } catch (e: any) { setError(e.message || "Xatolik yuz berdi"); }
    setSaving(false);
  };

  return (
    <ModalWrap onClose={onClose}>
      <div style={{ position: "relative", background: C.card, borderRadius: 18, padding: "26px 22px", width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "#F1F5F9", border: "none", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.muted }}><X size={15} /></button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg,#4F46E5,#06B6D4)", display: "flex", alignItems: "center", justifyContent: "center" }}><UserPlus size={17} color="#fff" /></div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.text }}>Yangi foydalanuvchi</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { label: "To'liq ism", val: fullName, set: setFullName, ph: "Sardor Yusupov", type: "text", req: false },
            { label: "Username",   val: username, set: setUsername, ph: "sardor123",      type: "text", req: false },
            { label: "Email",      val: email,    set: setEmail,    ph: "sardor@gmail.com", type: "email", req: true },
          ].map(f => (
            <div key={f.label}>
              <label style={lbl}>{f.label} {f.req && <span style={{ color: C.accentC }}>*</span>}</label>
              <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} type={f.type} style={inp}
                onFocus={e => (e.target.style.borderColor = C.borderFocus)} onBlur={e => (e.target.style.borderColor = C.border)} />
            </div>
          ))}
          <div>
            <label style={lbl}>Parol <span style={{ color: C.accentC }}>*</span></label>
            <div style={{ position: "relative" }}>
              <input value={password} onChange={e => setPassword(e.target.value)} type={showPw ? "text" : "password"} placeholder="Kamida 6 ta belgi" style={{ ...inp, paddingRight: 40 }}
                onFocus={e => (e.target.style.borderColor = C.borderFocus)} onBlur={e => (e.target.style.borderColor = C.border)} />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex" }}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <PremiumConfig value={premium} onChange={setPremium} />
          {error && <div style={{ background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 9, padding: "9px 13px", fontSize: 13, color: C.accentC }}>{error}</div>}
          <div style={{ display: "flex", gap: 9 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.muted, cursor: "pointer", fontSize: 13 }}>Bekor qilish</button>
            <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: "10px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#4F46E5,#06B6D4)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              {saving ? "Yaratilmoqda..." : <><Save size={14} /> Yaratish</>}
            </button>
          </div>
        </div>
      </div>
    </ModalWrap>
  );
}

function EditModal({ user, onClose, onSaved }: { user: Profile; onClose: () => void; onSaved: () => void }) {
  const [fullName, setFullName] = useState(user.full_name ?? "");
  const [username, setUsername] = useState(user.username ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      await adminApi("update_profile", { userId: user.id, full_name: fullName.trim() || null, username: username.trim() || null });
      onSaved(); onClose();
    } catch (e: any) { setError(e.message); setSaving(false); }
  };

  return (
    <ModalWrap onClose={onClose}>
      <div style={{ position: "relative", background: C.card, borderRadius: 18, padding: "26px 22px", width: "100%", maxWidth: 400, boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "#F1F5F9", border: "none", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.muted }}><X size={15} /></button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: "#CFFAFE", display: "flex", alignItems: "center", justifyContent: "center" }}><Edit3 size={17} color={C.accentB} /></div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.text }}>Tahrirlash</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div><label style={lbl}>Email (o'zgartirib bo'lmaydi)</label><input value={user.email ?? ""} disabled style={{ ...inp, opacity: 0.5, cursor: "not-allowed" }} /></div>
          <div><label style={lbl}>To'liq ism</label><input value={fullName} onChange={e => setFullName(e.target.value)} style={inp} onFocus={e => (e.target.style.borderColor = C.borderFocus)} onBlur={e => (e.target.style.borderColor = C.border)} /></div>
          <div><label style={lbl}>Username</label><input value={username} onChange={e => setUsername(e.target.value)} style={inp} onFocus={e => (e.target.style.borderColor = C.borderFocus)} onBlur={e => (e.target.style.borderColor = C.border)} /></div>
          {error && <div style={{ background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 9, padding: "9px 13px", fontSize: 13, color: C.accentC }}>{error}</div>}
          <div style={{ display: "flex", gap: 9 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.muted, cursor: "pointer", fontSize: 13 }}>Bekor</button>
            <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: "10px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#4F46E5,#06B6D4)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              {saving ? "..." : <><Save size={14} /> Saqlash</>}
            </button>
          </div>
        </div>
      </div>
    </ModalWrap>
  );
}

function DeleteModal({ user, onClose, onDeleted }: { user: Profile; onClose: () => void; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Avval RPC orqali auth user ni o'chirish
      try {
        const { error: rpcErr } = await (supabase as any).rpc("admin_delete_user", { p_user_id: user.id });
        if (rpcErr) console.warn("admin_delete_user RPC xatosi:", rpcErr.message);
      } catch {
        // RPC xatosi bo'lsa ham davom etamiz
      }
      // Keyin profile ni o'chirish
      await adminApi("delete_user", { userId: user.id });
      onDeleted(); onClose();
    } catch (e: any) { setError(e.message); setDeleting(false); }
  };
  return (
    <ModalWrap onClose={onClose}>
      <div style={{ position: "relative", background: C.card, borderRadius: 18, padding: "26px 22px", width: "100%", maxWidth: 360, boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><Trash2 size={22} color={C.accentC} /></div>
          <h3 style={{ margin: "0 0 7px", fontSize: 17, fontWeight: 700, color: C.text }}>O'chirishni tasdiqlang</h3>
          <p style={{ margin: 0, fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
            <strong style={{ color: C.text }}>{user.full_name || user.email}</strong> foydalanuvchisi va barcha ma'lumotlari o'chiriladi.
          </p>
        </div>
        {error && <div style={{ background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 9, padding: "9px 13px", fontSize: 13, color: C.accentC, marginBottom: 12 }}>{error}</div>}
        <div style={{ display: "flex", gap: 9 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.muted, cursor: "pointer", fontSize: 13 }}>Bekor</button>
          <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: C.accentC, color: "#fff", fontWeight: 700, fontSize: 13, cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
            {deleting ? "..." : <><Trash2 size={13} /> O'chirish</>}
          </button>
        </div>
      </div>
    </ModalWrap>
  );
}

function PremiumPanel({ userId, users, onSaved }: { userId: string; users: Profile[]; onSaved: () => void }) {
  const user = users.find(u => u.id === userId)!;
  const [days, setDays] = useState(30);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const status = user ? getStatus(user) : "free";

  if (!user) return null;

  const givePremium = async (d: number) => {
    setSaving(true); setMsg("");
    try {
      const result = await adminApi("give_premium", { userId: user.id, days: d });
      const endDate = new Date(result.endDate);
      setMsg(`✓ ${d} kun premium berildi (${endDate.toLocaleDateString("uz-UZ")} gacha)`);
      onSaved();
    } catch (e: any) { setMsg("Xatolik: " + e.message); }
    setSaving(false);
  };
  const revokePremium = async () => {
    setSaving(true); setMsg("");
    try {
      await adminApi("revoke_premium", { userId: user.id });
      setMsg("✓ Premium bekor qilindi"); onSaved();
    } catch (e: any) { setMsg("Xatolik: " + e.message); }
    setSaving(false);
  };

  return (
    <div style={{ padding: "14px 16px", background: "#EEF2FF", borderBottom: `1px solid ${C.border}` }}>
      {status === "premium" && user.tariff_end_date && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, padding: "7px 11px", background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 9 }}>
          <Crown size={13} color={C.gold} />
          <span style={{ fontSize: 12, color: C.gold, fontWeight: 600 }}>Premium faol · {new Date(user.tariff_end_date).toLocaleDateString("uz-UZ")} gacha</span>
          <button onClick={revokePremium} disabled={saving} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 6, border: "none", background: "#FEE2E2", color: C.accentC, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
            <X size={10} /> Bekor qilish
          </button>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap", marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
          {status === "premium" ? "Uzaytirish:" : "Premium berish:"}
        </span>
        {[7, 30, 90].map(d => (
          <button key={d} onClick={() => givePremium(d)} disabled={saving}
            style={{ padding: "5px 13px", borderRadius: 7, border: "none", background: "linear-gradient(135deg,#4F46E5,#06B6D4)", color: "#fff", fontWeight: 700, fontSize: 12, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {d} kun
          </button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: C.muted }}>Maxsus:</span>
        <button onClick={() => setDays(d => Math.max(1, d - 1))} style={btnSm}><Minus size={12} /></button>
        <input type="number" min={1} max={999} value={days}
          onChange={e => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v >= 1 && v <= 999) setDays(v); }}
          style={{ width: 52, padding: "5px 7px", background: "#fff", border: `1px solid ${C.border}`, borderRadius: 7, color: C.text, fontSize: 13, textAlign: "center" }} />
        <span style={{ fontSize: 12, color: C.muted }}>kun</span>
        <button onClick={() => setDays(d => Math.min(999, d + 1))} style={btnSm}><Plus size={12} /></button>
        <button onClick={() => givePremium(days)} disabled={saving}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 7, border: "none", background: C.accent, color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
          <Check size={12} /> Berish
        </button>
        <span style={{ fontSize: 11, color: C.muted }}>→ {new Date(Date.now() + days * 86400000).toLocaleDateString("uz-UZ")} gacha</span>
      </div>
      {msg && <div style={{ marginTop: 8, fontSize: 12, color: msg.startsWith("✓") ? "#059669" : C.accentC, fontWeight: 600 }}>{msg}</div>}
      <div style={{ marginTop: 8, fontSize: 11, color: C.hint }}>ID: <code style={{ fontSize: 10 }}>{user.id}</code></div>
    </div>
  );
}

type ModalState = null | "create" | { mode: "edit"; user: Profile } | { mode: "delete"; user: Profile };

export default function AdminUsers() {
  const [users, setUsers]     = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState<StatusFilter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage]       = useState(1);
  const [modal, setModal]     = useState<ModalState>(null);
  const PER_PAGE = 15;

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setUsers(data ?? []);
    setLoading(false);
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q);
    const matchFilter = filter === "all" || getStatus(u) === filter;
    return matchSearch && matchFilter;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const counts: Record<StatusFilter, number> = {
    all: users.length,
    premium: users.filter(u => getStatus(u) === "premium").length,
    trial:   users.filter(u => getStatus(u) === "trial").length,
    free:    users.filter(u => getStatus(u) === "free").length,
    expired: users.filter(u => getStatus(u) === "expired").length,
  };

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {modal === "create" && <CreateModal onClose={() => setModal(null)} onSaved={fetchUsers} />}
      {modal && typeof modal === "object" && modal.mode === "edit"   && <EditModal   user={modal.user} onClose={() => setModal(null)} onSaved={fetchUsers} />}
      {modal && typeof modal === "object" && modal.mode === "delete" && <DeleteModal user={modal.user} onClose={() => setModal(null)} onDeleted={fetchUsers} />}

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>Foydalanuvchilar</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: C.muted }}>PRO, Trial va bepul foydalanuvchilar</p>
        </div>
        <button onClick={() => setModal("create")}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", background: "linear-gradient(135deg,#4F46E5,#06B6D4)", border: "none", borderRadius: 10, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
          <UserPlus size={15} /> Yangi User
        </button>
      </div>

      {/* Search + refresh */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: C.hint }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Email yoki ism qidirish..."
            style={{ ...inp, paddingLeft: 33 }}
            onFocus={e => (e.target.style.borderColor = C.borderFocus)} onBlur={e => (e.target.style.borderColor = C.border)} />
        </div>
        <button onClick={fetchUsers} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.muted, cursor: "pointer", fontSize: 13 }}>
          <RefreshCw size={14} /> Yangilash
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {(["all","premium","trial","free","expired"] as StatusFilter[]).map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1); }}
            style={{ padding: "6px 14px", borderRadius: 100, cursor: "pointer", fontSize: 12, fontWeight: 600,
              background: filter === f ? C.accent : C.card,
              color:      filter === f ? "#fff" : C.muted,
              border:     `1px solid ${filter === f ? C.accent : C.border}`,
            } as any}>
            {{ all: "Hammasi", premium: "Premium", trial: "Trial", free: "Bepul", expired: "Muddati tugagan" }[f]}
            <span style={{ marginLeft: 5, fontSize: 11, opacity: 0.8 }}>({counts[f]})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 180 }}>
            <div style={{ width: 30, height: 30, border: "3px solid #E0E7FF", borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: `1px solid ${C.border}` }}>
                  {["Email", "To'liq ism", "Tarif", "Qolgan kun", "Qo'shilgan", "Amallar"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.hint, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: 36, color: C.muted, fontSize: 14 }}>Foydalanuvchi topilmadi</td></tr>
                )}
                {paginated.map((u, idx) => {
                  const status = getStatus(u);
                  const isOpen = expanded === u.id;
                  const daysLeft = u.tariff_end_date
                    ? Math.max(0, Math.ceil((new Date(u.tariff_end_date).getTime() - Date.now()) / 86400000))
                    : null;
                  return (
                    <Fragment key={u.id}>
                      <tr style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.1s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#F8FAFC"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                        <td style={{ padding: "11px 16px", fontSize: 13, color: C.muted, maxWidth: 200 }}>
                          <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {u.email || "—"}
                          </span>
                        </td>
                        <td style={{ padding: "11px 16px" }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{u.full_name || "—"}</div>
                            {u.username && <div style={{ fontSize: 12, color: C.muted }}>@{u.username}</div>}
                          </div>
                        </td>
                        <td style={{ padding: "11px 16px" }}><StatusBadge status={status} /></td>
                        <td style={{ padding: "11px 16px", fontSize: 13, fontWeight: daysLeft !== null && daysLeft <= 3 ? 700 : 400, color: daysLeft !== null && daysLeft <= 3 ? C.accentC : C.text }}>
                          {daysLeft !== null ? daysLeft : "—"}
                        </td>
                        <td style={{ padding: "11px 16px", fontSize: 13, color: C.muted }}>
                          {new Date(u.created_at).toLocaleDateString("uz-UZ")}
                        </td>
                        <td style={{ padding: "11px 16px" }}>
                          <div style={{ display: "flex", gap: 5 }}>
                            <button onClick={() => setExpanded(isOpen ? null : u.id)}
                              style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 9px", background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 7, color: C.gold, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                              <Crown size={11} />{isOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            </button>
                            <button onClick={() => setModal({ mode: "edit", user: u })}
                              style={{ display: "flex", alignItems: "center", padding: "5px 9px", background: "#CFFAFE", border: "1px solid #A5F3FC", borderRadius: 7, color: "#0891B2", cursor: "pointer" }}>
                              <Edit3 size={12} />
                            </button>
                            <button onClick={() => setModal({ mode: "delete", user: u })}
                              style={{ display: "flex", alignItems: "center", padding: "5px 9px", background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 7, color: C.accentC, cursor: "pointer" }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr key={u.id + "_p"}><td colSpan={6} style={{ padding: 0 }}><PremiumPanel userId={u.id} users={users} onSaved={fetchUsers} /></td></tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 16, alignItems: "center" }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: "6px 14px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.card, color: C.muted, cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1, fontSize: 13 }}>← Oldingi</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1).map((p, i, arr) => (
            <Fragment key={p}>
              {i > 0 && arr[i-1] !== p - 1 && <span style={{ color: C.hint }}>...</span>}
              <button onClick={() => setPage(p)}
                style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${page === p ? C.accent : C.border}`, background: page === p ? C.accent : C.card, color: page === p ? "#fff" : C.muted, cursor: "pointer", fontWeight: page === p ? 700 : 400, fontSize: 13 }}>
                {p}
              </button>
            </Fragment>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ padding: "6px 14px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.card, color: C.muted, cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1, fontSize: 13 }}>Keyingi →</button>
        </div>
      )}

      <div style={{ marginTop: 10, textAlign: "center", fontSize: 13, color: C.hint }}>
        Jami {filtered.length} ta foydalanuvchi
      </div>
    </div>
  );
}