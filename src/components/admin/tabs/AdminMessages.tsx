import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Search, RefreshCw, Trash2, ChevronDown, ChevronUp, Phone, User, Mail } from "lucide-react";

const CS = {
  bg: "#F4F6FB", surface: "#F8FAFC", card: "#FFFFFF",
  border: "#E2E8F0", accent: "#6C5FF5", accentB: "#00A8A5",
  accentC: "#EF4444", gold: "#D97706",
  textPrimary: "#0F172A", textSecondary: "#64748B", textHint: "#94A3B8",
};

interface Message {
  id: string;
  name: string;
  phone: string | null;
  subject: string;
  message: string;
  user_id: string | null;
  created_at: string;
}

export default function AdminMessages() {
  const [msgs, setMsgs]       = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [expanded, setExpand] = useState<string | null>(null);
  const [deleting, setDel]    = useState<string | null>(null);

  useEffect(() => { fetchMsgs(); }, []);

  const fetchMsgs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    setMsgs(data ?? []);
    setLoading(false);
  };

  const deleteMsg = async (id: string) => {
    if (!confirm("Xabarni o'chirishni tasdiqlaysizmi?")) return;
    setDel(id);
    await supabase.from("contact_messages").delete().eq("id", id);
    setMsgs(prev => prev.filter(m => m.id !== id));
    setDel(null);
  };

  const filtered = msgs.filter(m =>
    !search ||
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.subject.toLowerCase().includes(search.toLowerCase()) ||
    (m.phone && m.phone.includes(search))
  );

  const todayCount = msgs.filter(m => new Date(m.created_at) > new Date(Date.now() - 86400000)).length;

  return (
    <div>
      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Jami xabarlar", value: msgs.length, color: CS.accent },
          { label: "Bugungi xabarlar", value: todayCount, color: CS.accentB },
        ].map((s, i) => (
          <div key={i} style={{ background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MessageSquare size={18} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: CS.textSecondary }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: CS.textPrimary }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: CS.textSecondary }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ism, mavzu yoki telefon bo'yicha..."
            style={{ width: "100%", padding: "10px 12px 10px 36px", background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 12, color: CS.textPrimary, fontSize: 14, outline: "none", boxSizing: "border-box" }}
            onFocus={e => (e.target.style.borderColor = "rgba(124,111,255,0.4)")}
            onBlur={e => (e.target.style.borderColor = CS.border)}
          />
        </div>
        <button onClick={fetchMsgs} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 12, color: CS.textSecondary, cursor: "pointer", fontSize: 13 }}>
          <RefreshCw size={14} /> Yangilash
        </button>
      </div>

      {/* Messages list */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
          <div style={{ width: 32, height: 32, border: "3px solid rgba(124,111,255,0.2)", borderTopColor: CS.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 16, padding: 48, textAlign: "center" }}>
          <MessageSquare size={36} style={{ color: CS.textSecondary, opacity: 0.3, marginBottom: 10 }} />
          <div style={{ fontSize: 15, color: CS.textSecondary }}>Xabarlar yo'q</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(m => {
            const isOpen = expanded === m.id;
            return (
              <div key={m.id} style={{ background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 14, overflow: "hidden", transition: "border-color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(124,111,255,0.2)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = CS.border)}
              >
                {/* Header row */}
                <div
                  style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
                  onClick={() => setExpand(isOpen ? null : m.id)}
                >
                  {/* Avatar */}
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {m.name[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: CS.textPrimary }}>{m.name}</span>
                      {m.phone && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: CS.accentB }}>
                          <Phone size={11} />{m.phone}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: CS.accent, fontWeight: 600, marginTop: 2 }}>{m.subject}</div>
                    {!isOpen && (
                      <div style={{ fontSize: 12, color: CS.textSecondary, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 400 }}>
                        {m.message}
                      </div>
                    )}
                  </div>

                  {/* Right side */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <span style={{ fontSize: 12, color: CS.textSecondary, whiteSpace: "nowrap" }}>
                      {new Date(m.created_at).toLocaleString("uz-UZ", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {isOpen ? <ChevronUp size={16} color={CS.textSecondary} /> : <ChevronDown size={16} color={CS.textSecondary} />}
                  </div>
                </div>

                {/* Expanded body */}
                {isOpen && (
                  <div style={{ padding: "0 18px 18px", borderTop: `1px solid ${CS.border}`, paddingTop: 16 }}>
                    {/* Message body */}
                    <div style={{ background: "#F8FAFC", borderRadius: 12, padding: 16, marginBottom: 14 }}>
                      <p style={{ margin: 0, fontSize: 14, color: CS.textPrimary, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{m.message}</p>
                    </div>

                    {/* Meta */}
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
                      {m.phone && (
                        <a href={`tel:${m.phone}`} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "rgba(0,201,196,0.1)", border: "1px solid rgba(0,201,196,0.2)", borderRadius: 10, color: CS.accentB, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                          <Phone size={13} /> {m.phone}
                        </a>
                      )}
                      {m.user_id && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#F8FAFC", borderRadius: 10, fontSize: 12, color: CS.textSecondary }}>
                          <User size={12} /> Ro'yxatdan o'tgan foydalanuvchi
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: CS.textSecondary, display: "flex", alignItems: "center" }}>
                        {new Date(m.created_at).toLocaleString("uz-UZ")}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => deleteMsg(m.id)} disabled={deleting === m.id}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "rgba(255,95,109,0.10)", border: "1px solid rgba(255,95,109,0.2)", borderRadius: 10, color: CS.accentC, cursor: deleting === m.id ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}>
                        <Trash2 size={14} /> {deleting === m.id ? "O'chirilmoqda..." : "O'chirish"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}