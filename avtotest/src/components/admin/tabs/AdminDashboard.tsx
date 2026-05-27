import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Crown, Clock, MessageSquare, TrendingUp, Activity, CheckCircle, AlertCircle } from "lucide-react";

const CS = {
  bg: "#0A0B14", card: "#16172a", border: "rgba(255,255,255,0.07)",
  accent: "#7C6FFF", accentB: "#00C9C4", accentC: "#FF5F6D", gold: "#F5A623",
  textPrimary: "#FFFFFF", textSecondary: "rgba(255,255,255,0.55)",
};

interface Stats {
  totalUsers: number;
  premiumUsers: number;
  trialUsers: number;
  freeUsers: number;
  totalTests: number;
  avgScore: number;
  totalMessages: number;
  newUsersToday: number;
  expiringIn3Days: number;
}

interface RecentUser {
  id: string;
  full_name: string | null;
  email: string | null;
  tariff_days: number | null;
  tariff_end_date: string | null;
  created_at: string;
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div style={{ background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 16, padding: "20px 22px", display: "flex", alignItems: "flex-start", gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 13, color: CS.textSecondary, marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: CS.textPrimary, lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: CS.textSecondary, marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats]   = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const today = new Date(); today.setHours(0,0,0,0);
      const in3   = new Date(); in3.setDate(in3.getDate() + 3);

      const [{ data: profiles }, { data: tests }, { data: messages }] = await Promise.all([
        supabase.from("profiles").select("id, tariff_days, tariff_end_date, is_trial_used, trial_end_date, created_at, full_name, email"),
        supabase.from("test_results").select("correct_answers, total_questions"),
        supabase.from("contact_messages").select("id"),
      ]);

      const p = profiles ?? [];
      const premium = p.filter(u => {
        const days = u.tariff_days ?? 0;
        if (days <= 0) return false;
        if (u.tariff_end_date) return new Date(u.tariff_end_date) > new Date();
        return false;
      });
      const trial = p.filter(u => {
        if (u.is_trial_used && u.trial_end_date) return new Date(u.trial_end_date) > new Date();
        return false;
      });
      const newToday = p.filter(u => new Date(u.created_at) >= today);
      const expiring = p.filter(u => {
        if (!u.tariff_end_date) return false;
        const end = new Date(u.tariff_end_date);
        return end > new Date() && end <= in3;
      });

      const t = tests ?? [];
      const avgScore = t.length
        ? Math.round(t.reduce((s, r) => s + (r.correct_answers / r.total_questions) * 100, 0) / t.length)
        : 0;

      setStats({
        totalUsers:       p.length,
        premiumUsers:     premium.length,
        trialUsers:       trial.length,
        freeUsers:        p.length - premium.length - trial.length,
        totalTests:       t.length,
        avgScore,
        totalMessages:    (messages ?? []).length,
        newUsersToday:    newToday.length,
        expiringIn3Days:  expiring.length,
      });

      // Recent 6 users
      const sorted = [...p].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6);
      setRecent(sorted as RecentUser[]);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const isPremium = (u: RecentUser) => {
    const days = u.tariff_days ?? 0;
    if (days <= 0) return false;
    if (u.tariff_end_date) return new Date(u.tariff_end_date) > new Date();
    return false;
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
      <div style={{ width: 36, height: 36, border: "3px solid rgba(124,111,255,0.2)", borderTopColor: CS.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  return (
    <div>
      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard icon={<Users size={20} color={CS.accent} />}    label="Jami foydalanuvchilar" value={stats?.totalUsers ?? 0}    sub={`+${stats?.newUsersToday} bugun`} color={CS.accent} />
        <StatCard icon={<Crown size={20} color={CS.gold} />}      label="Premium foydalanuvchi"  value={stats?.premiumUsers ?? 0}  color={CS.gold} />
        <StatCard icon={<Clock size={20} color={CS.accentB} />}   label="Trial foydalanuvchi"    value={stats?.trialUsers ?? 0}    color={CS.accentB} />
        <StatCard icon={<Activity size={20} color={CS.accentC}/>} label="Jami testlar"            value={stats?.totalTests ?? 0}    sub={`O'rtacha: ${stats?.avgScore}%`} color={CS.accentC} />
        <StatCard icon={<MessageSquare size={20} color={CS.accent}/>} label="Xabarlar"           value={stats?.totalMessages ?? 0} color={CS.accent} />
        <StatCard icon={<AlertCircle size={20} color={CS.accentC}/>} label="3 kunda tugaydi"     value={stats?.expiringIn3Days ?? 0} sub="Premium muddati" color={CS.accentC} />
      </div>

      {/* Premium breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
        {/* Tarqalish */}
        <div style={{ background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 16, padding: 22 }}>
          <h3 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 700, color: CS.textPrimary }}>Foydalanuvchilar taqsimoti</h3>
          {[
            { label: "Premium",  value: stats?.premiumUsers ?? 0, color: CS.gold },
            { label: "Trial",    value: stats?.trialUsers ?? 0,   color: CS.accentB },
            { label: "Bepul",    value: stats?.freeUsers ?? 0,    color: "rgba(255,255,255,0.2)" },
          ].map((item, i) => {
            const total = stats?.totalUsers || 1;
            const pct   = Math.round((item.value / total) * 100);
            return (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: CS.textSecondary }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: CS.textPrimary }}>{item.value} ({pct}%)</span>
                </div>
                <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: item.color, borderRadius: 4, transition: "width 1s ease" }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* O'rtacha natija */}
        <div style={{ background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 16, padding: 22, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <div style={{ fontSize: 64, fontWeight: 800, color: CS.accentB, lineHeight: 1, marginBottom: 8 }}>{stats?.avgScore}%</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: CS.textPrimary, marginBottom: 4 }}>O'rtacha test natijasi</div>
          <div style={{ fontSize: 13, color: CS.textSecondary }}>{stats?.totalTests} ta test ishlandi</div>
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6, background: "rgba(0,201,196,0.1)", border: "1px solid rgba(0,201,196,0.2)", borderRadius: 100, padding: "5px 14px" }}>
            <TrendingUp size={13} color={CS.accentB} />
            <span style={{ fontSize: 12, fontWeight: 600, color: CS.accentB }}>
              {(stats?.avgScore ?? 0) >= 70 ? "Yaxshi daraja" : "Yaxshilanishi kerak"}
            </span>
          </div>
        </div>
      </div>

      {/* Oxirgi ro'yxatdan o'tganlar */}
      <div style={{ background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${CS.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: CS.textPrimary }}>So'nggi foydalanuvchilar</h3>
          <span style={{ fontSize: 12, color: CS.textSecondary }}>Oxirgi 6 ta</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${CS.border}` }}>
                {["Ism", "Email", "Status", "Qo'shildi"].map(h => (
                  <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: CS.textSecondary, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: i < recent.length - 1 ? `1px solid ${CS.border}` : "none" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "12px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                        {(u.full_name || u.email || "?")[0].toUpperCase()}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: CS.textPrimary }}>{u.full_name || "—"}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 20px", fontSize: 13, color: CS.textSecondary }}>{u.email || "—"}</td>
                  <td style={{ padding: "12px 20px" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "4px 10px", borderRadius: 100, fontSize: 12, fontWeight: 600,
                      background: isPremium(u) ? "rgba(245,166,35,0.12)" : "rgba(255,255,255,0.06)",
                      color: isPremium(u) ? CS.gold : CS.textSecondary,
                      border: `1px solid ${isPremium(u) ? "rgba(245,166,35,0.25)" : CS.border}`,
                    }}>
                      {isPremium(u) ? <><Crown size={11} />Premium</> : "Bepul"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 20px", fontSize: 13, color: CS.textSecondary }}>
                    {new Date(u.created_at).toLocaleDateString("uz-UZ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
