import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Search, RefreshCw, Trash2, ChevronDown, ChevronUp, Phone, User } from "lucide-react";

const C = {
  card: "#FFFFFF", surface: "#F8FAFC", border: "#E2E8F0", borderFocus: "#A5B4FC",
  accent: "#4F46E5", accentB: "#06B6D4", accentC: "#EF4444",
  text: "#0F172A", muted: "#64748B", hint: "#94A3B8",
};

interface Message { id: string; name: string; phone: string | null; subject: string; message: string; user_id: string | null; created_at: string; }

export default function AdminMessages() {
  const [msgs, setMsgs]       = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [expanded, setExpand] = useState<string | null>(null);
  const [deleting, setDel]    = useState<string | null>(null);

  useEffect(() => { fetchMsgs(); }, []);
  const fetchMsgs = async () => {
    setLoading(true);
    const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
    setMsgs(data ?? []); setLoading(false);
  };
  const deleteMsg = async (id: string) => {
    if (!confirm("Xabarni o'chirishni tasdiqlaysizmi?")) return;
    setDel(id); await supabase.from("contact_messages").delete().eq("id", id);
    setMsgs(prev => prev.filter(m => m.id !== id)); setDel(null);
  };
  const filtered = msgs.filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.subject.toLowerCase().includes(search.toLowerCase()) || (m.phone && m.phone.includes(search)));
  const todayCount = msgs.filter(m => new Date(m.created_at) > new Date(Date.now() - 86400000)).length;

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Jami xabarlar",   value: msgs.length, iconBg: "#EEF2FF", iconColor: C.accent  },
          { label: "Bugungi xabarlar", value: todayCount, iconBg: "#CFFAFE", iconColor: C.accentB },
        ].map((s, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: s.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <MessageSquare size={19} color={s.iconColor} />
            </div>
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ism, mavzu yoki telefon..."
            style={{ width: "100%", padding: "9px 12px 9px 33px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" }}
            onFocus={e => (e.target.style.borderColor = C.borderFocus)} onBlur={e => (e.target.style.borderColor = C.border)} />
        </div>
        <button onClick={fetchMsgs} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, color: C.muted, cursor: "pointer", fontSize: 13 }}>
          <RefreshCw size={14} /> Yangilash
        </button>
      </div>

      {/* Messages */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 160 }}>
          <div style={{ width: 28, height: 28, border: "3px solid #E0E7FF", borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: 40, textAlign: "center" }}>
          <MessageSquare size={34} style={{ color: C.hint, marginBottom: 9 }} />
          <div style={{ fontSize: 14, color: C.muted }}>Xabarlar yo'q</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(m => {
            const isOpen = expanded === m.id;
            return (
              <div key={m.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, overflow: "hidden", transition: "border-color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "#C7D2FE")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
                <div style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => setExpand(isOpen ? null : m.id)}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#4F46E5,#06B6D4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {m.name[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{m.name}</span>
                      {m.phone && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12, color: C.accentB }}><Phone size={11} />{m.phone}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: C.accent, fontWeight: 600, marginTop: 1 }}>{m.subject}</div>
                    {!isOpen && <div style={{ fontSize: 12, color: C.muted, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 380 }}>{m.message}</div>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: C.hint, whiteSpace: "nowrap" }}>
                      {new Date(m.created_at).toLocaleString("uz-UZ", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {isOpen ? <ChevronUp size={15} color={C.hint} /> : <ChevronDown size={15} color={C.hint} />}
                  </div>
                </div>
                {isOpen && (
                  <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, marginBottom: 12 }}>
                      <p style={{ margin: 0, fontSize: 13, color: C.text, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{m.message}</p>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                      {m.phone && (
                        <a href={`tel:${m.phone}`} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 13px", background: "#CFFAFE", border: "1px solid #A5F3FC", borderRadius: 9, color: "#0891B2", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                          <Phone size={12} /> {m.phone}
                        </a>
                      )}
                      {m.user_id && (
                        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 13px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 12, color: C.muted }}>
                          <User size={12} /> Ro'yxatdan o'tgan
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: C.hint, display: "flex", alignItems: "center" }}>{new Date(m.created_at).toLocaleString("uz-UZ")}</div>
                    </div>
                    <button onClick={() => deleteMsg(m.id)} disabled={deleting === m.id}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 9, color: C.accentC, cursor: deleting === m.id ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}>
                      <Trash2 size={13} /> {deleting === m.id ? "O'chirilmoqda..." : "O'chirish"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <div style={{ marginTop: 10, textAlign: "center", fontSize: 13, color: C.hint }}>Jami {filtered.length} ta xabar</div>
    </div>
  );
}