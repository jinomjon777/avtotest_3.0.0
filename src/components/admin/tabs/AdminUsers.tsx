import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Search, Crown, Clock, ChevronDown, ChevronUp,
  RefreshCw, Plus, Minus, Check, X, UserPlus,
  Trash2, Edit3, Eye, EyeOff, Save, Calendar,
} from "lucide-react";

const CS = {
  bg: "#F4F6FB", card: "#FFFFFF", surface: "#F8FAFC",
  border: "#E2E8F0", borderHover: "#C7D2FE",
  accent: "#6C5FF5", accentB: "#00A8A5", accentC: "#EF4444", gold: "#D97706",
  textPrimary: "#0F172A", textSecondary: "#64748B", textHint: "#94A3B8",
};

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  username: string | null;
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
  if (days > 0 && u.tariff_end_date && new Date(u.tariff_end_date) > now) return "premium";
  if (days > 0 && u.tariff_end_date && new Date(u.tariff_end_date) <= now) return "expired";
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

const inp: React.CSSProperties = {
  width: "100%", padding: "10px 14px",
  background: "#F8FAFC", border: `1px solid ${CS.border}`,
  borderRadius: 10, color: CS.textPrimary, fontSize: 14,
  outline: "none", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600,
  color: CS.textSecondary, marginBottom: 6,
};
const btnSm: React.CSSProperties = {
  width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
  background: "rgba(124,111,255,0.12)", border: "1px solid rgba(124,111,255,0.3)",
  borderRadius: 8, cursor: "pointer", color: CS.textSecondary,
};

// ─── Premium konfiguratsiya bloki ───────────────────────────────────────────
function PremiumConfig({
  value, onChange,
}: {
  value: { enabled: boolean; days: number };
  onChange: (v: { enabled: boolean; days: number }) => void;
}) {
  return (
    <div style={{ background: "rgba(124,111,255,0.06)", border: `1px solid rgba(124,111,255,0.2)`, borderRadius: 12, padding: "14px 16px" }}>
      <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: value.enabled ? 14 : 0 }}>
        <div
          onClick={() => onChange({ ...value, enabled: !value.enabled })}
          style={{
            width: 40, height: 22, borderRadius: 11,
            background: value.enabled ? `linear-gradient(90deg, ${CS.accent}, ${CS.accentB})` : "rgba(255,255,255,0.12)",
            position: "relative", transition: "background 0.2s", cursor: "pointer", flexShrink: 0,
          }}
        >
          <div style={{
            position: "absolute", top: 3, left: value.enabled ? 21 : 3,
            width: 16, height: 16, borderRadius: "50%", background: "#fff",
            transition: "left 0.2s",
          }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: CS.textPrimary, display: "flex", alignItems: "center", gap: 6 }}>
            <Crown size={13} color={CS.gold} /> Premium berish
          </div>
          <div style={{ fontSize: 11, color: CS.textSecondary }}>Yaratish bilan birga premium yoqiladi</div>
        </div>
      </label>

      {value.enabled && (
        <div>
          <div style={{ fontSize: 12, color: CS.textSecondary, marginBottom: 8 }}>Muddat (kun):</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {[7, 30, 90, 180, 365].map(d => (
              <button
                key={d}
                type="button"
                onClick={() => onChange({ ...value, days: d })}
                style={{
                  padding: "5px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: 700,
                  background: value.days === d ? `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})` : "rgba(255,255,255,0.08)",
                  color: value.days === d ? "#fff" : CS.textSecondary,
                }}
              >
                {d} kun
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button type="button" onClick={() => onChange({ ...value, days: Math.max(1, value.days - 1) })} style={btnSm}><Minus size={12} /></button>
            <input
              type="number" min={1} max={999} value={value.days}
              onChange={e => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v >= 1 && v <= 999) onChange({ ...value, days: v }); }}
              style={{ width: 60, padding: "6px 8px", background: "#F8FAFC", border: `1px solid ${CS.border}`, borderRadius: 8, color: CS.textPrimary, fontSize: 13, textAlign: "center" }}
            />
            <button type="button" onClick={() => onChange({ ...value, days: Math.min(999, value.days + 1) })} style={btnSm}><Plus size={12} /></button>
            <span style={{ fontSize: 12, color: CS.textSecondary }}>
              → {new Date(Date.now() + value.days * 86400000).toLocaleDateString("uz-UZ")} gacha
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Yaratish Modali ─────────────────────────────────────────────────────────
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
      // --- Duplication checks: username and email ---
      const uname = username.trim();
      if (uname) {
        const { data: existingU } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', uname)
          .limit(1)
          .maybeSingle();
        if (existingU) {
          setError("Username mavjud — boshqa username tanlang");
          setSaving(false);
          return;
        }
      }

      const em = email.trim().toLowerCase();
      const { data: existingE } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', em)
        .limit(1)
        .maybeSingle();
      if (existingE) {
        setError("Bu email allaqachon ro'yxatdan o'tgan");
        setSaving(false);
        return;
      }

      // RPC orqali user yaratish
      const { data, error: rpcErr } = await (supabase as any).rpc("admin_create_user", {
        p_email:    em,
        p_password: password.trim(),
        p_name:     fullName.trim() || null,
        p_username: uname || null,
      });

      if (rpcErr) { setError(rpcErr.message); setSaving(false); return; }
      if ((data as any)?.error) { setError((data as any).error); setSaving(false); return; }

      const userId = (data as any)?.id;

      // Premium berish
      if (premium.enabled && userId) {
        const startDate = new Date();
        const endDate   = new Date(Date.now() + premium.days * 86400000);
        await supabase.from("profiles").update({
          tariff_days:       premium.days,
          tariff_start_date: startDate.toISOString(),
          tariff_end_date:   endDate.toISOString(),
        }).eq("id", userId);
      }

      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message || "Xatolik yuz berdi");
    }
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }} onClick={onClose} />
      <div style={{ position: "relative", background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 40px 80px rgba(0,0,0,0.6)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: CS.textSecondary }}>
          <X size={15} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <UserPlus size={18} color="#fff" />
          </div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: CS.textPrimary }}>Yangi foydalanuvchi</h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={lbl}>To'liq ism</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Sardor Yusupov" style={inp}
              onFocus={e => (e.target.style.borderColor = "rgba(124,111,255,0.5)")}
              onBlur={e => (e.target.style.borderColor = CS.border)} />
          </div>

          <div>
            <label style={lbl}>Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="sardor123" style={inp}
              onFocus={e => (e.target.style.borderColor = "rgba(124,111,255,0.5)")}
              onBlur={e => (e.target.style.borderColor = CS.border)} />
          </div>

          <div>
            <label style={lbl}>Email <span style={{ color: CS.accentC }}>*</span></label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="sardor@gmail.com" type="email" style={inp}
              onFocus={e => (e.target.style.borderColor = "rgba(124,111,255,0.5)")}
              onBlur={e => (e.target.style.borderColor = CS.border)} />
          </div>

          <div>
            <label style={lbl}>Parol <span style={{ color: CS.accentC }}>*</span></label>
            <div style={{ position: "relative" }}>
              <input value={password} onChange={e => setPassword(e.target.value)} type={showPw ? "text" : "password"} placeholder="Kamida 6 ta belgi" style={{ ...inp, paddingRight: 44 }}
                onFocus={e => (e.target.style.borderColor = "rgba(124,111,255,0.5)")}
                onBlur={e => (e.target.style.borderColor = CS.border)} />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: CS.textSecondary, display: "flex" }}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <PremiumConfig value={premium} onChange={setPremium} />

          {error && (
            <div style={{ background: "rgba(255,95,109,0.1)", border: "1px solid rgba(255,95,109,0.25)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: CS.accentC }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: `1px solid ${CS.border}`, background: "transparent", color: CS.textSecondary, cursor: "pointer", fontSize: 14 }}>
              Bekor qilish
            </button>
            <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: "11px 0", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`, color: "#fff", fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {saving ? "Yaratilmoqda..." : <><Save size={15} /> Yaratish</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tahrirlash Modali ────────────────────────────────────────────────────────
function EditModal({ user, onClose, onSaved }: { user: Profile; onClose: () => void; onSaved: () => void }) {
  const [fullName, setFullName] = useState(user.full_name ?? "");
  const [username, setUsername] = useState(user.username ?? "");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  const handleSave = async () => {
    setSaving(true); setError("");
    const { error: err } = await supabase.from("profiles").update({
      full_name: fullName.trim() || null,
      username:  username.trim() || null,
    }).eq("id", user.id);
    if (err) { setError(err.message); setSaving(false); return; }
    onSaved(); onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }} onClick={onClose} />
      <div style={{ position: "relative", background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 400, boxShadow: "0 40px 80px rgba(0,0,0,0.6)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "#F1F5F9", border: "1px solid #E2E8F0", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: CS.textSecondary }}>
          <X size={15} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `rgba(0,201,196,0.15)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Edit3 size={18} color={CS.accentB} />
          </div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: CS.textPrimary }}>Tahrirlash</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={lbl}>Email (o'zgartirib bo'lmaydi)</label>
            <input value={user.email ?? ""} disabled style={{ ...inp, opacity: 0.4, cursor: "not-allowed" }} />
          </div>
          <div>
            <label style={lbl}>To'liq ism</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} style={inp}
              onFocus={e => (e.target.style.borderColor = "rgba(124,111,255,0.5)")}
              onBlur={e => (e.target.style.borderColor = CS.border)} />
          </div>
          <div>
            <label style={lbl}>Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} style={inp}
              onFocus={e => (e.target.style.borderColor = "rgba(124,111,255,0.5)")}
              onBlur={e => (e.target.style.borderColor = CS.border)} />
          </div>
          {error && <div style={{ background: "rgba(255,95,109,0.1)", border: "1px solid rgba(255,95,109,0.25)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: CS.accentC }}>{error}</div>}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: `1px solid ${CS.border}`, background: "transparent", color: CS.textSecondary, cursor: "pointer", fontSize: 14 }}>Bekor</button>
            <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: "11px 0", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`, color: "#fff", fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {saving ? "..." : <><Save size={15} /> Saqlash</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── O'chirish Modali ─────────────────────────────────────────────────────────
function DeleteModal({ user, onClose, onDeleted }: { user: Profile; onClose: () => void; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError]       = useState("");

  const handleDelete = async () => {
    setDeleting(true);
    const { error: err } = await (supabase as any).rpc("admin_delete_user", { p_user_id: user.id });
    if (err) {
      // Fallback: profiles dan o'chiramiz
      const { error: err2 } = await supabase.from("profiles").delete().eq("id", user.id);
      if (err2) { setError(err2.message); setDeleting(false); return; }
    }
    onDeleted(); onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }} onClick={onClose} />
      <div style={{ position: "relative", background: CS.card, border: `1px solid rgba(255,95,109,0.3)`, borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 380, boxShadow: "0 40px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,95,109,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <Trash2 size={22} color={CS.accentC} />
          </div>
          <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: CS.textPrimary }}>O'chirishni tasdiqlang</h3>
          <p style={{ margin: 0, fontSize: 14, color: CS.textSecondary, lineHeight: 1.6 }}>
            <strong style={{ color: CS.textPrimary }}>{user.full_name || user.email}</strong> foydalanuvchisi va uning barcha ma'lumotlari o'chiriladi.
          </p>
        </div>
        {error && <div style={{ background: "rgba(255,95,109,0.1)", border: "1px solid rgba(255,95,109,0.25)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: CS.accentC, marginBottom: 14 }}>{error}</div>}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: `1px solid ${CS.border}`, background: "transparent", color: CS.textSecondary, cursor: "pointer", fontSize: 14 }}>Bekor</button>
          <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", background: CS.accentC, color: "#fff", fontWeight: 700, fontSize: 14, cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {deleting ? "..." : <><Trash2 size={14} /> O'chirish</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Premium Boshqarish Paneli ────────────────────────────────────────────────
function PremiumPanel({ user, onSaved }: { user: Profile; onSaved: () => void }) {
  const [days,   setDays]   = useState(30);
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState("");

  const givePremium = async (d: number) => {
    setSaving(true); setMsg("");
    const start = new Date();
    const end   = new Date(Date.now() + d * 86400000);
    const { error } = await supabase.from("profiles").update({
      tariff_days: d, tariff_start_date: start.toISOString(), tariff_end_date: end.toISOString(),
    }).eq("id", user.id);
    if (error) setMsg("Xatolik: " + error.message);
    else { setMsg(`✓ ${d} kun premium berildi`); onSaved(); }
    setSaving(false);
  };

  const revokePremium = async () => {
    setSaving(true); setMsg("");
    const { error } = await supabase.from("profiles").update({
      tariff_days: 0, tariff_end_date: null, tariff_start_date: null,
    }).eq("id", user.id);
    if (error) setMsg("Xatolik: " + error.message);
    else { setMsg("✓ Premium bekor qilindi"); onSaved(); }
    setSaving(false);
  };

  const status = getStatus(user);

  return (
    <div style={{ padding: "16px 18px", background: "rgba(124,111,255,0.04)", borderBottom: `1px solid ${CS.border}` }}>
      {/* Joriy holat */}
      {status === "premium" && user.tariff_end_date && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "8px 12px", background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 10 }}>
          <Crown size={13} color={CS.gold} />
          <span style={{ fontSize: 12, color: CS.gold, fontWeight: 600 }}>
            Premium faol · {new Date(user.tariff_end_date).toLocaleDateString("uz-UZ")} gacha
          </span>
          <button onClick={revokePremium} disabled={saving} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 7, border: "none", background: "rgba(255,95,109,0.15)", color: CS.accentC, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
            <X size={11} /> Bekor qilish
          </button>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: CS.textPrimary }}>Premium berish:</span>
        {[7, 30, 90].map(d => (
          <button key={d} onClick={() => givePremium(d)} disabled={saving}
            style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
            {d} kun
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: CS.textSecondary }}>Maxsus:</span>
        <button onClick={() => setDays(d => Math.max(1, d - 1))} style={btnSm}><Minus size={12} /></button>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input type="number" min={1} max={999} value={days} onChange={e => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v >= 1 && v <= 999) setDays(v); }}
            style={{ width: 52, padding: "5px 8px", background: "rgba(124,111,255,0.08)", border: "1px solid rgba(124,111,255,0.35)", borderRadius: 8, color: CS.textPrimary, fontSize: 13, textAlign: "center" }} />
          <span style={{ fontSize: 12, color: CS.textSecondary }}>kun</span>
        </div>
        <button onClick={() => setDays(d => Math.min(999, d + 1))} style={btnSm}><Plus size={12} /></button>
        <button onClick={() => givePremium(days)} disabled={saving}
          style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`, color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
          <Check size={12} /> Berish
        </button>
        <span style={{ fontSize: 12, color: CS.textSecondary }}>
          → {new Date(Date.now() + days * 86400000).toLocaleDateString("uz-UZ")} gacha
        </span>
      </div>

      {msg && (
        <div style={{ marginTop: 10, fontSize: 12, color: msg.startsWith("✓") ? CS.accentB : CS.accentC, fontWeight: 600 }}>
          {msg}
        </div>
      )}

      <div style={{ marginTop: 10, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: CS.textSecondary }}>ID: <code style={{ fontSize: 10 }}>{user.id}</code></span>
        {user.tariff_days && user.tariff_days > 0 && (
          <span style={{ fontSize: 11, color: CS.textSecondary }}>Tarif: <span style={{ color: CS.gold, fontWeight: 700 }}>{user.tariff_days} kun</span></span>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
type ModalState =
  | null
  | "create"
  | { mode: "edit";   user: Profile }
  | { mode: "delete"; user: Profile };

export default function AdminUsers() {
  const [users,    setUsers]    = useState<Profile[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState<StatusFilter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page,     setPage]     = useState(1);
  const [modal,    setModal]    = useState<ModalState>(null);
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
    const matchSearch = !q
      || u.full_name?.toLowerCase().includes(q)
      || u.email?.toLowerCase().includes(q)
      || u.username?.toLowerCase().includes(q);
    const matchFilter = filter === "all" || getStatus(u) === filter;
    return matchSearch && matchFilter;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const counts: Record<StatusFilter, number> = {
    all:     users.length,
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

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: CS.textSecondary }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Ism, email yoki username..."
            style={{ width: "100%", padding: "10px 12px 10px 36px", background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 12, color: CS.textPrimary, fontSize: 14, outline: "none", boxSizing: "border-box" }}
            onFocus={e => (e.target.style.borderColor = "rgba(124,111,255,0.4)")}
            onBlur={e => (e.target.style.borderColor = CS.border)} />
        </div>
        <button onClick={fetchUsers} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 12, color: CS.textSecondary, cursor: "pointer", fontSize: 13 }}>
          <RefreshCw size={14} /> Yangilash
        </button>
        <button onClick={() => setModal("create")}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", background: `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`, border: "none", borderRadius: 12, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, boxShadow: `0 4px 16px rgba(124,111,255,0.3)` }}>
          <UserPlus size={15} /> Yangi foydalanuvchi
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {(["all", "premium", "trial", "free", "expired"] as StatusFilter[]).map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1); }}
            style={{ padding: "7px 16px", borderRadius: 100, cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: filter === f ? "rgba(124,111,255,0.2)" : "rgba(255,255,255,0.05)",
              color: filter === f ? CS.accent : CS.textSecondary,
              border: filter === f ? "1px solid rgba(124,111,255,0.35)" : `1px solid ${CS.border}`,
            } as any}>
            {{ all: "Hammasi", premium: "Premium", trial: "Trial", free: "Bepul", expired: "Muddati tugagan" }[f]}
            <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>({counts[f]})</span>
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
                  {["Foydalanuvchi", "Email", "Status", "Tugash", "Sana", "Amallar"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: CS.textSecondary, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: CS.textSecondary, fontSize: 14 }}>Foydalanuvchi topilmadi</td></tr>
                )}
                {paginated.map(u => {
                  const status = getStatus(u);
                  const isOpen = expanded === u.id;
                  return (
                    <>
                      <tr key={u.id}
                        style={{ borderBottom: `1px solid ${CS.border}` }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "12px 16px" }}>
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
                        <td style={{ padding: "12px 16px", fontSize: 13, color: CS.textSecondary }}>{u.email || "—"}</td>
                        <td style={{ padding: "12px 16px" }}><StatusBadge status={status} /></td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: CS.textSecondary }}>
                          {u.tariff_end_date ? new Date(u.tariff_end_date).toLocaleDateString("uz-UZ") : "—"}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: CS.textSecondary }}>
                          {new Date(u.created_at).toLocaleDateString("uz-UZ")}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => setExpanded(isOpen ? null : u.id)}
                              style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 8, color: CS.gold, cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                              title="Premium boshqarish">
                              <Crown size={12} /> {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                            <button onClick={() => setModal({ mode: "edit", user: u })}
                              style={{ display: "flex", alignItems: "center", padding: "6px 10px", background: "rgba(0,201,196,0.1)", border: "1px solid rgba(0,201,196,0.2)", borderRadius: 8, color: CS.accentB, cursor: "pointer" }}
                              title="Tahrirlash">
                              <Edit3 size={13} />
                            </button>
                            <button onClick={() => setModal({ mode: "delete", user: u })}
                              style={{ display: "flex", alignItems: "center", padding: "6px 10px", background: "rgba(255,95,109,0.1)", border: "1px solid rgba(255,95,109,0.2)", borderRadius: 8, color: CS.accentC, cursor: "pointer" }}
                              title="O'chirish">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr key={u.id + "_premium"}>
                          <td colSpan={6} style={{ padding: 0 }}>
                            <PremiumPanel user={u} onSaved={fetchUsers} />
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
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: "7px 16px", borderRadius: 10, border: `1px solid ${CS.border}`, background: CS.card, color: CS.textSecondary, cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1, fontSize: 13 }}>
            ← Oldingi
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .map((p, i, arr) => (
              <>
                {i > 0 && arr[i-1] !== p-1 && <span style={{ color: CS.textSecondary }}>...</span>}
                <button key={p} onClick={() => setPage(p)}
                  style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${page === p ? "rgba(124,111,255,0.4)" : CS.border}`, background: page === p ? "rgba(124,111,255,0.15)" : CS.card, color: page === p ? CS.accent : CS.textSecondary, cursor: "pointer", fontWeight: page === p ? 700 : 400, fontSize: 13 }}>
                  {p}
                </button>
              </>
            ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            style={{ padding: "7px 16px", borderRadius: 10, border: `1px solid ${CS.border}`, background: CS.card, color: CS.textSecondary, cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1, fontSize: 13 }}>
            Keyingi →
          </button>
        </div>
      )}

      <div style={{ marginTop: 12, textAlign: "center", fontSize: 13, color: CS.textSecondary }}>
        Jami {filtered.length} ta foydalanuvchi
      </div>
    </div>
  );
}