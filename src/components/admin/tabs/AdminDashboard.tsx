import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Crown, Clock, MessageSquare, TrendingUp, Activity, AlertCircle, Archive } from "lucide-react";

const C = {
  bg: "#F1F5F9", card: "#FFFFFF", border: "#E2E8F0",
  accent: "#4F46E5", accentB: "#06B6D4", accentC: "#EF4444", gold: "#D97706",
  text: "#0F172A", muted: "#64748B", hint: "#94A3B8",
};

interface Stats {
  totalUsers: number; premiumUsers: number; trialUsers: number;
  freeUsers: number; archivedUsers: number; totalTests: number;
  avgScore: number; totalMessages: number; newUsersToday: number;
  expiringIn3Days: number;
}

interface Profile {
  id: string;
  full_name?: string | null;
  email?: string | null;
  tariff_days?: number | null;
  tariff_start_date?: string | null;
  tariff_end_date?: string | null;
  is_trial_used?: boolean | null;
  trial_end_date?: string | null;
  created_at?: string | null;
  is_archived?: boolean | null;
}

interface TestResult {
  correct_answers: number;
  total_questions: number;
}

function StatCard({ icon, label, value, sub, color, iconBg }: {
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; color: string; iconBg: string;
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
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const in3   = new Date(); in3.setDate(in3.getDate() + 3);

      // Use typed queries and clearer response variable names to avoid incorrect inference
      const [profilesRes, testsRes, messagesRes] = await Promise.all([
        supabase.from("profiles").select("id, tariff_days, tariff_end_date, is_trial_used, trial_end_date, created_at, full_name, email, is_archived"),
        supabase.from("test_results").select("correct_answers, total_questions"),
        supabase.from("contact_messages").select("id"),
      ]);

      const p = (profilesRes.data ?? []) as unknown as Profile[];
      const t = (testsRes.data ?? []) as unknown as TestResult[];
      const msgs = (messagesRes.data ?? []) as unknown as any[];

      const premium = p.filter(u => (u.tariff_days ?? 0) > 0 && u.tariff_end_date && new Date(u.tariff_end_date) > new Date());
      const trial   = p.filter(u => u.is_trial_used && u.trial_end_date && new Date(u.trial_end_date) > new Date());
      const archived = p.filter(u => u.is_archived);
      const newToday = p.filter(u => u.created_at && new Date(u.created_at) >= today);
      const expiring = p.filter(u => u.tariff_end_date && new Date(u.tariff_end_date) > new Date() && new Date(u.tariff_end_date) <= in3);

      const avgScore = t.length ? Math.round(t.reduce((s, r) => s + (r.correct_answers / r.total_questions) * 100, 0) / t.length) : 0;

      setStats({
        totalUsers: p.length,
        premiumUsers: premium.length,
        trialUsers: trial.length,
        freeUsers: p.length - premium.length - trial.length,
        archivedUsers: archived.length,
        totalTests: t.length,
        avgScore,
        totalMessages: msgs.length,
        newUsersToday: newToday.length,
        expiringIn3Days: expiring.length,
      });

      setRecent([...p].sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime()).slice(0, 8));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const isPremium = (u: any) => u.tariff_days > 0 && u.tariff_end_date && new Date(u.tariff_end_date) > new Date();

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 260 }}>
      <div style={{ width: 34, height: 34, border: "3px solid #E0E7FF", borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  const CARDS = [
    { icon: <Users size={20} color="#4F46E5" />,       iconBg: "#EEF2FF", label: "Jami foydalanuvchilar", value: stats?.totalUsers ?? 0,    sub: `+${stats?.newUsersToday} bugun` },
    { icon: <Crown size={20} color="#D97706" />,        iconBg: "#FEF3C7", label: "Aktiv PRO",             value: stats?.premiumUsers ?? 0,   sub: "tarif_end_date > now" },
    { icon: <Activity size={20} color="#06B6D4" />,     iconBg: "#CFFAFE", label: "Aktiv Trial",           value: stats?.trialUsers ?? 0,     sub: "" },
    { icon: <AlertCircle size={20} color="#EF4444" />,  iconBg: "#FEE2E2", label: "Trial Tugagan",         value: stats?.expiringIn3Days ?? 0, sub: "subscriptions dan" },
    { icon: <Users size={20} color="#8B5CF6" />,        iconBg: "#EDE9FE", label: "Bepul",                 value: stats?.freeUsers ?? 0,      sub: "" },
    { icon: <Clock size={20} color="#0EA5E9" />,        iconBg: "#E0F2FE", label: "Bugungi yangi",         value: stats?.newUsersToday ?? 0,   sub: "bugun ro'yxatdan o'tgan" },
    { icon: <TrendingUp size={20} color="#10B981" />,   iconBg: "#D1FAE5", label: "Jami test natijalari",  value: stats?.totalTests ?? 0,     sub: `O'rtacha: ${stats?.avgScore}%` },
    { icon: <MessageSquare size={20} color="#F59E0B" />,iconBg: "#FEF3C7", label: "Xabarlar",              value: stats?.totalMessages ?? 0,   sub: "" },
    { icon: <Archive size={20} color="#6B7280" />,      iconBg: "#F3F4F6", label: "Arxiv",                 value: stats?.archivedUsers ?? 0,   sub: "" },
  ];

  return (
    <div>
      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px,1fr))", gap: 12, marginBottom: 20 }}>
        {CARDS.map((c, i) => <StatCard key={i} {...c} color="" />)}
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Progress bars */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: C.text }}>Foydalanuvchilar taqsimoti</h3>
          {[
            { label: "Premium", value: stats?.premiumUsers ?? 0, color: "#D97706", bg: "#FEF3C7" },
            { label: "Trial",   value: stats?.trialUsers ?? 0,   color: "#06B6D4", bg: "#CFFAFE" },
            { label: "Bepul",   value: stats?.freeUsers ?? 0,    color: "#6B7280", bg: "#F3F4F6" },
          ].map((item, i) => {
            const total = (stats?.totalUsers || 1);
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
          <div style={{ fontSize: 60, fontWeight: 800, color: C.accentB, lineHeight: 1, marginBottom: 6 }}>{stats?.avgScore}%</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>O'rtacha test natijasi</div>
          <div style={{ fontSize: 13, color: C.muted }}>{stats?.totalTests} ta test ishlandi</div>
          <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 5, background: "#CFFAFE", border: "1px solid #A5F3FC", borderRadius: 100, padding: "4px 12px" }}>
            <TrendingUp size={12} color={C.accentB} />
            <span style={{ fontSize: 11, fontWeight: 600, color: C.accentB }}>{(stats?.avgScore ?? 0) >= 70 ? "Yaxshi daraja" : "Yaxshilanishi kerak"}</span>
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
          <table>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                {["Ism", "Email", "Status", "Qo'shildi"].map(h => (
                  <th key={h} style={{ padding: "10px 18px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.hint, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((u, i) => (
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
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 100, fontSize: 11, fontWeight: 600, background: isPremium(u) ? "#FEF3C7" : "#F1F5F9", color: isPremium(u) ? "#D97706" : C.muted, border: `1px solid ${isPremium(u) ? "#FDE68A" : C.border}` }}>
                      {isPremium(u) ? <><Crown size={10} />Premium</> : "Bepul"}
                    </span>
                  </td>
                  <td style={{ padding: "11px 18px", fontSize: 13, color: C.muted }}>{new Date(u.created_at).toLocaleDateString("uz-UZ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}