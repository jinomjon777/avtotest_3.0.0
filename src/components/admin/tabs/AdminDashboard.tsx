import { useEffect, useState } from "react";
import { supabaseAdmin } from "@/integrations/supabase/client";
import { Users, Crown, Clock, MessageSquare, TrendingUp, Activity, AlertCircle, RefreshCw } from "lucide-react";

const C = {
  bg: "#F1F5F9", card: "#FFFFFF", border: "#E2E8F0",
  accent: "#4F46E5", accentB: "#06B6D4", accentC: "#EF4444", gold: "#D97706",
  text: "#0F172A", muted: "#64748B", hint: "#94A3B8",
};

interface Stats {
  totalUsers: number; premiumUsers: number; trialUsers: number;
  freeUsers: number; expiredUsers: number; totalTests: number;
  avgScore: number; totalMessages: number; newUsersToday: number;
  expiringIn3Days: number;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  tariff_days: number | null;
  tariff_start_date: string | null;
  tariff_end_date: string | null;
  is_trial_used: boolean | null;
  trial_end_date: string | null;
  created_at: string;
}

function getStatus(u: Profile): "premium" | "trial" | "free" | "expired" {
  const now = new Date();
  const days = u.tariff_days ?? 0;
  if (days > 0 && u.tariff_end_date && new Date(u.tariff_end_date) > now) return "premium";
  if (days > 0 && u.tariff_end_date && new Date(u.tariff_end_date) <= now) return "expired";
  if (u.is_trial_used && u.trial_end_date)
    return new Date(u.trial_end_date) > now ? "trial" : "expired";
  return "free";
}

function StatCard({ icon, label, value, sub, iconBg }: {
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; iconBg: string;
}) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
      <div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: C.text, lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: C.hint, marginTop: 5 }}>{sub}</div>}
      </div>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats]   = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const in3   = new Date(); in3.setDate(in3.getDate() + 3);

      // Fetch all three tables in parallel — each handled independently so one failure
      // doesn't block the others
      const [profilesRes, testsRes, messagesRes] = await Promise.all([
        supabaseAdmin.from("profiles").select("id, tariff_days, tariff_end_date, tariff_start_date, is_trial_used, trial_end_date, created_at, full_name, email"),
        supabaseAdmin.from("test_results").select("correct_answers, total_questions"),
        supabaseAdmin.from("contact_messages").select("id"),
      ]);

      // Log errors for debugging but keep going with empty arrays
      if (profilesRes.error)  console.error("profiles error:",  profilesRes.error.message);
      if (testsRes.error)     console.error("test_results error:", testsRes.error.message);
      if (messagesRes.error)  console.error("contact_messages error:", messagesRes.error.message);

      const p    = (profilesRes.data  ?? []) as Profile[];
      const t    = (testsRes.data     ?? []) as { correct_answers: number; total_questions: number }[];
      const msgs = (messagesRes.data  ?? []) as { id: string }[];

      // Use shared getStatus for consistency with AdminUsers
      const premium  = p.filter(u => getStatus(u) === "premium");
      const trial    = p.filter(u => getStatus(u) === "trial");
      const expired  = p.filter(u => getStatus(u) === "expired");
      const free     = p.filter(u => getStatus(u) === "free");
      const newToday = p.filter(u => new Date(u.created_at) >= today);
      const expiring = p.filter(u =>
        u.tariff_end_date &&
        new Date(u.tariff_end_date) > new Date() &&
        new Date(u.tariff_end_date) <= in3
      );

      const avgScore = t.length
        ? Math.round(t.reduce((s, r) => s + (r.total_questions > 0 ? (r.correct_answers / r.total_questions) * 100 : 0), 0) / t.length)
        : 0;

      setStats({
        totalUsers:     p.length,
        premiumUsers:   premium.length,
        trialUsers:     trial.length,
        freeUsers:      free.length,
        expiredUsers:   expired.length,
        totalTests:     t.length,
        avgScore,
        totalMessages:  msgs.length,
        newUsersToday:  newToday.length,
        expiringIn3Days: expiring.length,
      });

      setRecent(
        [...p]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 8)
      );
    } catch (e: any) {
      console.error("Dashboard fetch error:", e);
      setError("Ma'lumotlarni yuklashda xatolik: " + (e?.message || "noma'lum xato"));
    }
    setLoading(false);
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 260 }}>
      <div style={{ width: 34, height: 34, border: "3px solid #E0E7FF", borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  if (error) return (
    <div style={{ background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 12, padding: "16px 20px", color: C.accentC, display: "flex", alignItems: "center", gap: 10 }}>
      <AlertCircle size={18} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Xatolik</div>
        <div style={{ fontSize: 13 }}>{error}</div>
      </div>
      <button onClick={fetchAll} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: "1px solid #FECACA", background: "#fff", color: C.accentC, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
        <RefreshCw size={13} /> Qayta
      </button>
    </div>
  );

  const CARDS = [
    { icon: <Users size={20} color="#4F46E5" />,        iconBg: "#EEF2FF", label: "Jami foydalanuvchilar", value: stats?.totalUsers ?? 0,     sub: `+${stats?.newUsersToday ?? 0} bugun` },
    { icon: <Crown size={20} color="#D97706" />,         iconBg: "#FEF3C7", label: "Aktiv Premium",         value: stats?.premiumUsers ?? 0,    sub: "" },
    { icon: <Activity size={20} color="#06B6D4" />,      iconBg: "#CFFAFE", label: "Aktiv Trial",           value: stats?.trialUsers ?? 0,      sub: "" },
    { icon: <AlertCircle size={20} color="#EF4444" />,   iconBg: "#FEE2E2", label: "Muddati o'tgan",        value: stats?.expiredUsers ?? 0,    sub: "" },
    { icon: <Users size={20} color="#8B5CF6" />,         iconBg: "#EDE9FE", label: "Bepul",                 value: stats?.freeUsers ?? 0,       sub: "obuna yo'q" },
    { icon: <Clock size={20} color="#0EA5E9" />,         iconBg: "#E0F2FE", label: "Bugungi yangi",         value: stats?.newUsersToday ?? 0,   sub: "bugun ro'yxatdan o'tgan" },
    { icon: <TrendingUp size={20} color="#10B981" />,    iconBg: "#D1FAE5", label: "Jami test natijalari",  value: stats?.totalTests ?? 0,      sub: `O'rtacha: ${stats?.avgScore ?? 0}%` },
    { icon: <MessageSquare size={20} color="#F59E0B" />, iconBg: "#FEF3C7", label: "Xabarlar",              value: stats?.totalMessages ?? 0,   sub: "contact_messages" },
    { icon: <Crown size={20} color="#0EA5E9" />,         iconBg: "#E0F2FE", label: "3 kunda tugaydi",       value: stats?.expiringIn3Days ?? 0, sub: "premium muddati" },
  ];

  const total = stats?.totalUsers || 1;

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Refresh button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button onClick={fetchAll} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.card, color: C.muted, cursor: "pointer", fontSize: 13 }}>
          <RefreshCw size={13} /> Yangilash
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px,1fr))", gap: 12, marginBottom: 20 }}>
        {CARDS.map((c, i) => <StatCard key={i} {...c} />)}
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Distribution bars */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: C.text }}>Foydalanuvchilar taqsimoti</h3>
          {[
            { label: "Premium",           value: stats?.premiumUsers ?? 0, color: "#D97706", bg: "#FEF3C7" },
            { label: "Trial",             value: stats?.trialUsers ?? 0,   color: "#06B6D4", bg: "#CFFAFE" },
            { label: "Muddati o'tgan",    value: stats?.expiredUsers ?? 0, color: "#EF4444", bg: "#FEE2E2" },
            { label: "Bepul",             value: stats?.freeUsers ?? 0,    color: "#6B7280", bg: "#F3F4F6" },
          ].map((item, i) => {
            const pct = Math.round((item.value / total) * 100);
            return (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 13, color: C.muted }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{item.value} ({pct}%)</span>
                </div>
                <div style={{ height: 7, background: "#F1F5F9", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: item.color, borderRadius: 4, transition: "width 1s ease" }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Avg score */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <div style={{ fontSize: 60, fontWeight: 800, color: C.accentB, lineHeight: 1, marginBottom: 6 }}>{stats?.avgScore ?? 0}%</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>O'rtacha test natijasi</div>
          <div style={{ fontSize: 13, color: C.muted }}>{stats?.totalTests ?? 0} ta test ishlandi</div>
          <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 5, background: "#CFFAFE", border: "1px solid #A5F3FC", borderRadius: 100, padding: "4px 12px" }}>
            <TrendingUp size={12} color={C.accentB} />
            <span style={{ fontSize: 11, fontWeight: 600, color: C.accentB }}>
              {(stats?.avgScore ?? 0) >= 70 ? "Yaxshi daraja" : "Yaxshilanishi kerak"}
            </span>
          </div>
        </div>
      </div>

      {/* Recent users table */}
      <div style={{ marginTop: 16, background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>So'nggi foydalanuvchilar</span>
          <span style={{ fontSize: 12, color: C.hint }}>Oxirgi 8 ta</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                {["Ism", "Email", "Status", "Qo'shildi"].map(h => (
                  <th key={h} style={{ padding: "10px 18px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.hint, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: 32, color: C.muted, fontSize: 14 }}>Foydalanuvchi topilmadi</td></tr>
              )}
              {recent.map((u, i) => {
                const st = getStatus(u);
                const statusMap: Record<string, { label: string; color: string; bg: string; border: string }> = {
                  premium: { label: "Premium", color: "#D97706", bg: "#FEF3C7", border: "#FDE68A" },
                  trial:   { label: "Trial",   color: "#0891B2", bg: "#CFFAFE", border: "#A5F3FC" },
                  free:    { label: "Bepul",   color: "#64748B", bg: "#F1F5F9", border: "#E2E8F0" },
                  expired: { label: "Tugagan", color: "#DC2626", bg: "#FEE2E2", border: "#FECACA" },
                };
                const s = statusMap[st];
                return (
                  <tr key={u.id} style={{ borderBottom: i < recent.length - 1 ? `1px solid ${C.border}` : "none" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#F8FAFC"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                    <td style={{ padding: "11px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#4F46E5,#06B6D4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                          {(u.full_name || u.email || "?")[0].toUpperCase()}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{u.full_name || "—"}</span>
                      </div>
                    </td>
                    <td style={{ padding: "11px 18px", fontSize: 13, color: C.muted }}>{u.email || "—"}</td>
                    <td style={{ padding: "11px 18px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 100, fontSize: 11, fontWeight: 600, color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
                        {st === "premium" && <Crown size={10} />}
                        {st === "trial"   && <Clock size={10} />}
                        {s.label}
                      </span>
                    </td>
                    <td style={{ padding: "11px 18px", fontSize: 13, color: C.muted }}>
                      {new Date(u.created_at).toLocaleDateString("uz-UZ")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}