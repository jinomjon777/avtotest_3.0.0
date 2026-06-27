import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  User, Lock, CreditCard, Activity, Archive, Plus, Trash2,
  RefreshCw, Save, Database, ShieldCheck,
} from "lucide-react";

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
  accent: "#4F46E5", accentB: "#06B6D4", accentC: "#EF4444", gold: "#D97706", green: "#16A34A",
  text: "#0F172A", muted: "#64748B", hint: "#94A3B8",
};

const inp: React.CSSProperties = {
  width: "100%", padding: "9px 13px", background: C.surface, border: `1px solid ${C.border}`,
  borderRadius: 10, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box",
};
const lbl: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5 };
const card: React.CSSProperties = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 };

const SUBTABS = [
  { id: "profil", label: "Profil", icon: User },
  { id: "tolov", label: "To'lov turlari", icon: CreditCard },
  { id: "audit", label: "Audit", icon: Activity },
  { id: "arxiv", label: "Arxiv", icon: Archive },
];

// ───────────────────────── PROFIL ─────────────────────────
function ProfilTab() {
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setEmail(data.user.email ?? "");
        setUserId(data.user.id);
        setCreatedAt(data.user.created_at ?? "");
      }
    });
  }, []);

  const changePassword = async () => {
    setMsg(null);
    if (newPass.length < 6) return setMsg({ type: "err", text: "Yangi parol kamida 6 belgi bo'lishi kerak" });
    if (newPass !== confirmPass) return setMsg({ type: "err", text: "Parollar mos kelmadi" });
    setSaving(true);
    try {
      await adminApi("change_admin_password", { newPassword: newPass });
      setMsg({ type: "ok", text: "✓ Parol muvaffaqiyatli o'zgartirildi" });
      setOldPass(""); setNewPass(""); setConfirmPass("");
    } catch (e: any) {
      setMsg({ type: "err", text: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}><User size={17} color={C.accent} /></div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Admin profili</div>
            <div style={{ fontSize: 12, color: C.muted }}>Joriy sessiya ma'lumotlari</div>
          </div>
        </div>
        {[
          ["Email", email],
          ["User ID", userId],
          ["Ro'yxat sanasi", createdAt ? new Date(createdAt).toLocaleDateString("uz-UZ") : "—"],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
            <span style={{ color: C.muted }}>{k}</span>
            <span style={{ color: C.text, fontWeight: 600, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center" }}><Lock size={17} color={C.gold} /></div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Parolni o'zgartirish</div>
            <div style={{ fontSize: 12, color: C.muted }}>Kuchli parol ishlating</div>
          </div>
        </div>
        <label style={lbl}>Joriy parol</label>
        <input type="password" value={oldPass} onChange={e => setOldPass(e.target.value)} style={{ ...inp, marginBottom: 12 }} />
        <label style={lbl}>Yangi parol</label>
        <input type="password" placeholder="Kamida 6 ta belgi" value={newPass} onChange={e => setNewPass(e.target.value)} style={{ ...inp, marginBottom: 12 }} />
        <label style={lbl}>Tasdiqlash</label>
        <input type="password" placeholder="Parolni qayta kiriting" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} style={{ ...inp, marginBottom: 14 }} />
        {msg && (
          <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 9, fontSize: 13, background: msg.type === "ok" ? "#DCFCE7" : "#FEE2E2", color: msg.type === "ok" ? C.green : C.accentC }}>{msg.text}</div>
        )}
        <button onClick={changePassword} disabled={saving}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 10, border: "none", background: C.accent, color: "#fff", fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer" }}>
          <Save size={14} /> {saving ? "Saqlanmoqda..." : "Parolni o'zgartirish"}
        </button>
      </div>

      <div style={{ ...card, gridColumn: "1 / -1" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center" }}><Database size={17} color={C.green} /></div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Tizim ma'lumotlari</div>
            <div style={{ fontSize: 12, color: C.muted }}>Supabase ulanish va xavfsizlik</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, padding: "8px 12px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, fontSize: 13, color: C.green }}>
          <ShieldCheck size={14} /> Edge Function orqali JWT/role tekshiruvi yoqilgan
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── TO'LOV TURLARI ─────────────────────────
function TolovTurlariTab() {
  const [methods, setMethods] = useState<{ id: string; name: string; is_active: boolean; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState("");

  const fetchMethods = async () => {
    setLoading(true); setErr("");
    try {
      const { data } = await adminApi("list_payment_methods");
      setMethods(data ?? []);
    } catch (e: any) {
      setErr(e.message);
    } finally { setLoading(false); }
  };
  useEffect(() => { fetchMethods(); }, []);

  const addMethod = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await adminApi("add_payment_method", { name: newName.trim() });
      setNewName("");
      await fetchMethods();
    } catch (e: any) {
      setErr(e.message);
    } finally { setAdding(false); }
  };

  const removeMethod = async (id: string) => {
    if (!confirm("Bu to'lov turini o'chirishni tasdiqlaysizmi?")) return;
    try {
      await adminApi("delete_payment_method", { methodId: id });
      setMethods(prev => prev.filter(m => m.id !== id));
    } catch (e: any) {
      setErr(e.message);
    }
  };

  return (
    <div style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>To'lov turlari</div>
          <div style={{ fontSize: 12, color: C.muted }}>Foydalanuvchilarga ko'rsatiladigan to'lov usullari</div>
        </div>
        <button onClick={fetchMethods} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, color: C.muted, cursor: "pointer", fontSize: 12 }}>
          <RefreshCw size={13} /> Yangilash
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Yangi to'lov turi nomi (masalan: Click)"
          onKeyDown={e => e.key === "Enter" && addMethod()} style={inp} />
        <button onClick={addMethod} disabled={adding || !newName.trim()}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, border: "none", background: C.accent, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", opacity: !newName.trim() ? 0.6 : 1 }}>
          <Plus size={14} /> Qo'shish
        </button>
      </div>

      {err && <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 9, background: "#FEE2E2", fontSize: 13, color: C.accentC }}>{err}</div>}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 30 }}>
          <div style={{ width: 26, height: 26, border: "3px solid #E0E7FF", borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : methods.length === 0 ? (
        <div style={{ textAlign: "center", padding: 30, color: C.muted, fontSize: 13 }}>To'lov turlari yo'q</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {methods.map(m => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CreditCard size={15} color={C.accent} />
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{m.name}</span>
              </div>
              <button onClick={() => removeMethod(m.id)} style={{ display: "flex", alignItems: "center", padding: "5px 9px", background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 8, color: C.accentC, cursor: "pointer" }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ───────────────────────── AUDIT ─────────────────────────
interface AuditEntry { id: string; user_id: string; action: string; details: any; created_at: string; }

const ACTION_LABELS: Record<string, string> = {
  give_premium: "Premium berildi", revoke_premium: "Premium bekor qilindi",
  update_profile: "Profil tahrirlandi", delete_user: "Foydalanuvchi o'chirildi",
  update_chek: "Chek tahrirlandi", delete_chek: "Chek o'chirildi",
  add_payment_method: "To'lov turi qo'shildi", delete_payment_method: "To'lov turi o'chirildi",
  change_admin_password: "Admin parol o'zgartirildi",
};

function AuditTab() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const fetchLogs = async () => {
    setLoading(true); setErr("");
    try {
      const { data } = await adminApi("list_audit");
      setLogs(data ?? []);
    } catch (e: any) {
      setErr(e.message);
    } finally { setLoading(false); }
  };
  useEffect(() => { fetchLogs(); }, []);

  return (
    <div style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Audit jurnali</div>
          <div style={{ fontSize: 12, color: C.muted }}>Admin tomonidan bajarilgan amallar tarixi</div>
        </div>
        <button onClick={fetchLogs} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, color: C.muted, cursor: "pointer", fontSize: 12 }}>
          <RefreshCw size={13} /> Yangilash
        </button>
      </div>

      {err && <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 9, background: "#FEE2E2", fontSize: 13, color: C.accentC }}>{err}</div>}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 30 }}>
          <div style={{ width: 26, height: 26, border: "3px solid #E0E7FF", borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: "center", padding: 30, color: C.muted, fontSize: 13 }}>Hali yozuvlar yo'q</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
                {["Amal", "Tafsilotlar", "Sana"].map(h => (
                  <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.hint, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: "nowrap" }}>{ACTION_LABELS[l.action] ?? l.action}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: C.muted, maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {l.details ? JSON.stringify(l.details) : "—"}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: C.muted, whiteSpace: "nowrap" }}>{new Date(l.created_at).toLocaleString("uz-UZ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── ARXIV ─────────────────────────
function ArxivTab() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const fetchArchive = async () => {
    setLoading(true); setErr("");
    try {
      const { data } = await adminApi("list_audit");
      setLogs((data ?? []).filter((l: AuditEntry) => l.action === "delete_user" || l.action === "delete_chek"));
    } catch (e: any) {
      setErr(e.message);
    } finally { setLoading(false); }
  };
  useEffect(() => { fetchArchive(); }, []);

  return (
    <div style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Arxiv</div>
          <div style={{ fontSize: 12, color: C.muted }}>O'chirilgan foydalanuvchilar va cheklar</div>
        </div>
        <button onClick={fetchArchive} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, color: C.muted, cursor: "pointer", fontSize: 12 }}>
          <RefreshCw size={13} /> Yangilash
        </button>
      </div>

      {err && <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 9, background: "#FEE2E2", fontSize: 13, color: C.accentC }}>{err}</div>}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 30 }}>
          <div style={{ width: 26, height: 26, border: "3px solid #E0E7FF", borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: "center", padding: 30, color: C.muted, fontSize: 13 }}>Arxiv bo'sh</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {logs.map(l => (
            <div key={l.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Archive size={15} color={C.muted} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{ACTION_LABELS[l.action] ?? l.action}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{l.details?.email ?? l.details?.full_name ?? "—"}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: C.hint }}>{new Date(l.created_at).toLocaleDateString("uz-UZ")}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ───────────────────────── MAIN ─────────────────────────
export default function AdminSettings() {
  const [tab, setTab] = useState("profil");

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {SUBTABS.map(t => {
          const Icon = t.icon;
          const on = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, cursor: "pointer", fontSize: 13, fontWeight: on ? 700 : 500,
                background: on ? "#EEF2FF" : C.card, color: on ? C.accent : C.muted, border: `1px solid ${on ? "#C7D2FE" : C.border}` }}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "profil" && <ProfilTab />}
      {tab === "tolov" && <TolovTurlariTab />}
      {tab === "audit" && <AuditTab />}
      {tab === "arxiv" && <ArxivTab />}
    </div>
  );
}