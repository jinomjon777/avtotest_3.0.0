import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText, CheckCircle, Clock, Wallet, Search, RefreshCw,
  ExternalLink, Edit3, Trash2, X, Save, Plus,
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

interface Chek {
  id: string; email: string | null; chek_link: string | null; created_at: string;
  amount: number | null; tariff_days: number | null; processed: boolean;
  source?: string; telegram_username?: string | null; telegram_chat_id?: number | null;
}

type PeriodFilter = "all" | 7 | 30 | 90;

function fmtSom(n: number | null | undefined) {
  if (!n) return "—";
  return n.toLocaleString("uz-UZ") + " so'm";
}

function EditModal({ chek, onClose, onSaved }: { chek: Chek; onClose: () => void; onSaved: () => void }) {
  const [amount, setAmount] = useState(chek.amount ?? 0);
  const [days, setDays] = useState(chek.tariff_days ?? 0);
  const [processed, setProcessed] = useState(chek.processed);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const save = async () => {
    setLoading(true); setErr("");
    try {
      await adminApi("update_chek", { chekId: chek.id, amount, tariff_days: days, processed });
      onSaved(); onClose();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(6px)" }} onClick={onClose} />
      <div style={{ position: "relative", background: C.card, borderRadius: 18, padding: "24px 22px", maxWidth: 420, width: "100%", zIndex: 1, boxShadow: "0 24px 60px rgba(0,0,0,0.16)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "#F1F5F9", border: "none", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.muted }}><X size={14} /></button>
        <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: C.text }}>Chekni tahrirlash</h3>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
          {chek.email || (chek.telegram_username ? `@${chek.telegram_username}` : "Noma'lum foydalanuvchi")}
          {chek.source === "telegram" && (
            <span style={{ fontSize: 10, fontWeight: 700, color: "#0EA5E9", background: "rgba(14,165,233,0.12)", padding: "2px 7px", borderRadius: 100 }}>TELEGRAM</span>
          )}
        </div>

        {chek.chek_link && (
          <a href={chek.chek_link} target="_blank" rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 5, color: C.accent, fontSize: 13, textDecoration: "none", marginBottom: 16 }}>
            <ExternalLink size={12} /> Chekni ko'rish
          </a>
        )}

        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5 }}>To'lov summasi (so'm)</label>
        <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))}
          style={{ width: "100%", padding: "9px 12px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 12 }} />

        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5 }}>Tarif muddati (kun)</label>
        <div style={{ display: "flex", gap: 7, marginBottom: 14 }}>
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: `1px solid ${days === d ? C.accent : C.border}`, background: days === d ? C.accent : C.surface, color: days === d ? "#fff" : C.muted, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {d} kun
            </button>
          ))}
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 18 }}>
          <div onClick={() => setProcessed(v => !v)}
            style={{ width: 38, height: 21, borderRadius: 11, background: processed ? C.green : "#CBD5E1", position: "relative", cursor: "pointer", flexShrink: 0 }}>
            <div style={{ position: "absolute", top: 3, left: processed ? 19 : 3, width: 15, height: 15, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Yuklangan (ko'rib chiqilgan)</span>
        </label>

        {err && <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 9, background: "#FEE2E2", fontSize: 13, color: C.accentC }}>{err}</div>}

        <div style={{ display: "flex", gap: 9 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.muted, cursor: "pointer", fontSize: 13 }}>Bekor qilish</button>
          <button onClick={save} disabled={loading}
            style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#4F46E5,#06B6D4)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: loading ? "not-allowed" : "pointer" }}>
            <Save size={14} /> {loading ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddChekModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [email, setEmail] = useState("");
  const [link, setLink] = useState("");
  const [amount, setAmount] = useState(0);
  const [days, setDays] = useState(7);
  const [processed, setProcessed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const isSoliqLink = (url: string) => /^https?:\/\/(www\.)?(ofd\.)?soliq\.uz\//i.test(url.trim());

  const save = async () => {
    setErr("");
    if (!email.trim()) return setErr("Email kiritilishi shart");
    const trimmedLink = link.trim();
    if (!trimmedLink) return setErr("Chek havolasi (soliq.uz) kiritilishi shart");
    if (!isSoliqLink(trimmedLink)) return setErr("Havola soliq.uz domenidan bo'lishi kerak (masalan: https://ofd.soliq.uz/check/...)");
    setLoading(true);
    try {
      await adminApi("create_chek", {
        email: email.trim(),
        link: trimmedLink,
        amount,
        tariff_days: days,
        processed,
      });
      onSaved(); onClose();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(6px)" }} onClick={onClose} />
      <div style={{ position: "relative", background: C.card, borderRadius: 18, padding: "24px 22px", maxWidth: 440, width: "100%", zIndex: 1, boxShadow: "0 24px 60px rgba(0,0,0,0.16)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: "#F1F5F9", border: "none", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.muted }}><X size={14} /></button>
        <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: C.text }}>Yangi chek qo'shish</h3>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>To'lov qabul qilingach, foydalanuvchiga chek yuklang</div>

        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5 }}>Foydalanuvchi email</label>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="user@gmail.com" autoComplete="off" name="user-email-field"
          style={{ width: "100%", padding: "9px 12px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 12 }} />

        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5 }}>Chek havolasi (soliq.uz)</label>
        <input value={link} onChange={e => setLink(e.target.value)} placeholder="https://ofd.soliq.uz/check/..." autoComplete="off" name="receipt-link-field"
          style={{ width: "100%", padding: "9px 12px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 4 }} />
        <div style={{ fontSize: 11, color: C.hint, marginBottom: 12 }}>Faqat soliq.uz (ofd.soliq.uz) tekshiruv havolasi qabul qilinadi</div>

        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5 }}>To'lov summasi (so'm)</label>
        <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))}
          style={{ width: "100%", padding: "9px 12px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 12 }} />

        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 5 }}>Tarif muddati (kun)</label>
        <div style={{ display: "flex", gap: 7, marginBottom: 14 }}>
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: `1px solid ${days === d ? C.accent : C.border}`, background: days === d ? C.accent : C.surface, color: days === d ? "#fff" : C.muted, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {d} kun
            </button>
          ))}
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 18 }}>
          <div onClick={() => setProcessed(v => !v)}
            style={{ width: 38, height: 21, borderRadius: 11, background: processed ? C.green : "#CBD5E1", position: "relative", cursor: "pointer", flexShrink: 0 }}>
            <div style={{ position: "absolute", top: 3, left: processed ? 19 : 3, width: 15, height: 15, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Yuklangan (ko'rib chiqilgan) deb belgilash</span>
        </label>

        {err && <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 9, background: "#FEE2E2", fontSize: 13, color: C.accentC }}>{err}</div>}

        <div style={{ display: "flex", gap: 9 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.muted, cursor: "pointer", fontSize: 13 }}>Bekor qilish</button>
          <button onClick={save} disabled={loading}
            style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#4F46E5,#06B6D4)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: loading ? "not-allowed" : "pointer" }}>
            <Save size={14} /> {loading ? "Yuklanmoqda..." : "Saqlash"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminChek() {
  const [cheks, setCheks] = useState<Chek[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "processed" | "pending">("all");
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [editing, setEditing] = useState<Chek | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const fetchCheks = async () => {
    setLoading(true); setErr("");
    try {
      const { data } = await adminApi("list_chek");
      setCheks(data ?? []);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchCheks(); }, []);

  const deleteChek = async (id: string) => {
    if (!confirm("Bu chekni o'chirishni tasdiqlaysizmi?")) return;
    setDeleting(id);
    try {
      await adminApi("delete_chek", { chekId: id });
      setCheks(prev => prev.filter(c => c.id !== id));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDeleting(null);
    }
  };

  const groups = useMemo(() => {
    const map = new Map<number, { count: number; amount: number }>();
    cheks.forEach(c => {
      const d = c.tariff_days ?? 0;
      if (!d) return;
      const prev = map.get(d) ?? { count: 0, amount: 0 };
      map.set(d, { count: prev.count + 1, amount: c.amount ?? prev.amount });
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [cheks]);

  const filtered = useMemo(() => {
    return cheks.filter(c => {
      const q = search.toLowerCase();
      if (search && !(c.email?.toLowerCase().includes(q) || c.telegram_username?.toLowerCase().includes(q))) return false;
      if (statusFilter === "processed" && !c.processed) return false;
      if (statusFilter === "pending" && c.processed) return false;
      if (period !== "all" && c.tariff_days !== period) return false;
      if (dateFrom && new Date(c.created_at) < new Date(dateFrom)) return false;
      if (dateTo && new Date(c.created_at) > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });
  }, [cheks, search, statusFilter, period, dateFrom, dateTo]);

  const totalAmount = cheks.reduce((s, c) => s + (c.amount ?? 0), 0);
  const processedCount = cheks.filter(c => c.processed).length;
  const pendingCount = cheks.length - processedCount;

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {editing && <EditModal chek={editing} onClose={() => setEditing(null)} onSaved={fetchCheks} />}
      {adding && <AddChekModal onClose={() => setAdding(false)} onSaved={fetchCheks} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.text }}>Cheklar</h2>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>Faqat PRO foydalanuvchilar cheklari</div>
        </div>
        <button onClick={() => setAdding(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#4F46E5,#06B6D4)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          <Plus size={15} /> Yangi chek qo'shish
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12, marginBottom: 14 }}>
        {[
          { label: "Jami cheklar", value: cheks.length, icon: <FileText size={19} color={C.accent} />, iconBg: "#EEF2FF" },
          { label: "Yuklangan", value: processedCount, icon: <CheckCircle size={19} color={C.green} />, iconBg: "#DCFCE7" },
          { label: "Yuklanmagan", value: pendingCount, icon: <Clock size={19} color={C.gold} />, iconBg: "#FEF3C7" },
          { label: "Jami to'lov", value: fmtSom(totalAmount), icon: <Wallet size={19} color={C.accentB} />, iconBg: "#CFFAFE", big: true },
        ].map((s, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: s.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 12, color: C.muted }}>{s.label}</div>
              <div style={{ fontSize: s.big ? 18 : 24, fontWeight: 800, color: C.text }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Period quick chips */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {groups.map(([d, g]) => (
          <button key={d} onClick={() => setPeriod(period === d as PeriodFilter ? "all" : (d as PeriodFilter))}
            style={{ padding: "6px 14px", borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: period === d ? C.accent : C.card, color: period === d ? "#fff" : C.muted,
              border: `1px solid ${period === d ? C.accent : C.border}` }}>
            {d}-kun · {fmtSom(g.amount)} · {g.count} ta
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: C.hint }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Email bo'yicha qidirish..."
            style={{ width: "100%", padding: "9px 12px 9px 33px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" }}
            onFocus={e => (e.target.style.borderColor = C.borderFocus)} onBlur={e => (e.target.style.borderColor = C.border)} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
          style={{ padding: "9px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13 }}>
          <option value="all">Barchasi</option>
          <option value="processed">Yuklangan</option>
          <option value="pending">Yuklanmagan</option>
        </select>
        <select value={period === "all" ? "all" : String(period)} onChange={e => setPeriod(e.target.value === "all" ? "all" : Number(e.target.value) as PeriodFilter)}
          style={{ padding: "9px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13 }}>
          <option value="all">Barcha tariflar</option>
          {groups.map(([d]) => <option key={d} value={d}>{d} kun</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          style={{ padding: "9px 10px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13 }} />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          style={{ padding: "9px 10px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13 }} />
        <button onClick={fetchCheks} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.muted, cursor: "pointer", fontSize: 13 }}>
          <RefreshCw size={14} /> Yangilash
        </button>
      </div>

      {err && <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 10, background: "#FEE2E2", color: C.accentC, fontSize: 13 }}>{err}</div>}

      <div style={{ fontSize: 13, color: C.hint, marginBottom: 8 }}>{filtered.length} ta chek</div>

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
                  {["#", "Email", "Holat", "To'lov summasi", "Chek", "Sana", "Tahrir"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.hint, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: C.muted, fontSize: 14 }}>Cheklar topilmadi</td></tr>
                )}
                {filtered.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = C.surface)}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: C.hint }}>{i + 1}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: C.text }}>{c.email || (c.telegram_username ? `@${c.telegram_username}` : "—")}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 100, fontSize: 11, fontWeight: 600,
                        color: c.processed ? C.green : C.gold, background: c.processed ? "#DCFCE7" : "#FEF3C7", border: `1px solid ${c.processed ? "#BBF7D0" : "#FDE68A"}` }}>
                        {c.processed ? "Yuklangan" : "Yuklanmagan"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 9px", borderRadius: 100, background: "#EEF2FF", color: C.accent, fontWeight: 600, fontSize: 12 }}>
                        {fmtSom(c.amount)}{c.tariff_days ? ` · ${c.tariff_days}k` : ""}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {c.chek_link ? (
                        <a href={c.chek_link} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: C.accent, fontSize: 13, textDecoration: "none" }}>
                          <ExternalLink size={12} /> Ko'rish
                        </a>
                      ) : <span style={{ color: C.hint }}>—</span>}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: C.muted, whiteSpace: "nowrap" }}>{new Date(c.created_at).toLocaleString("uz-UZ")}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 7 }}>
                        <button onClick={() => setEditing(c)}
                          style={{ display: "flex", alignItems: "center", padding: "5px 9px", background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 8, color: C.accent, cursor: "pointer" }}>
                          <Edit3 size={12} />
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
    </div>
  );
}