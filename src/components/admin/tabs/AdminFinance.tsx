import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Crown, RefreshCw, Users, Calendar, DollarSign, BarChart2 } from "lucide-react";

const C = {
  card: "#FFFFFF", surface: "#F8FAFC", border: "#E2E8F0",
  accent: "#4F46E5", accentB: "#06B6D4", green: "#10B981", gold: "#D97706",
  text: "#0F172A", muted: "#64748B", hint: "#94A3B8",
};

// Narxlar (so'm)
const PRICES: Record<number, number> = {
  7:  15000,
  30: 33000,
  90: 83000,
};

function getPlanPrice(days: number): number {
  // Eng yaqin tarif narxini topish
  if (days <= 7)  return PRICES[7];
  if (days <= 30) return PRICES[30];
  return PRICES[90];
}

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  tariff_days: number | null;
  tariff_start_date: string | null;
  tariff_end_date: string | null;
}

interface RevRecord {
  user: Profile;
  days: number;
  price: number;
  startDate: Date;
  endDate: Date;
  plan: string;
}

function fmt(n: number) {
  return n.toLocaleString("uz-UZ") + " so'm";
}

function getPlanName(days: number): string {
  if (days <= 7)  return "Haftalik";
  if (days <= 30) return "Oylik";
  return "3 Oylik";
}

export default function AdminFinance() {
  const [records, setRecords] = useState<RevRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod]   = useState<"week" | "month" | "all">("month");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, email, full_name, tariff_days, tariff_start_date, tariff_end_date")
      .gt("tariff_days", 0)
      .not("tariff_start_date", "is", null);

    const recs: RevRecord[] = (data ?? [])
      .filter((u: Profile) => u.tariff_days && u.tariff_start_date)
      .map((u: Profile) => ({
        user: u,
        days:      u.tariff_days!,
        price:     getPlanPrice(u.tariff_days!),
        startDate: new Date(u.tariff_start_date!),
        endDate:   u.tariff_end_date ? new Date(u.tariff_end_date) : new Date(),
        plan:      getPlanName(u.tariff_days!),
      }))
      .sort((a: RevRecord, b: RevRecord) => b.startDate.getTime() - a.startDate.getTime());

    setRecords(recs);
    setLoading(false);
  };

  // Filtr
  const now   = new Date();
  const week  = new Date(now.getTime() - 7  * 86400000);
  const month = new Date(now.getTime() - 30 * 86400000);

  const filtered = records.filter(r => {
    if (period === "week")  return r.startDate >= week;
    if (period === "month") return r.startDate >= month;
    return true;
  });

  const totalRev   = filtered.reduce((s, r) => s + r.price, 0);
  const weekRev    = records.filter(r => r.startDate >= week).reduce((s, r) => s + r.price, 0);
  const monthRev   = records.filter(r => r.startDate >= month).reduce((s, r) => s + r.price, 0);
  const allRev     = records.reduce((s, r) => s + r.price, 0);

  const planStats = [
    { label: "Haftalik (7 kun)",  days: 7,  price: PRICES[7],  count: records.filter(r => r.days <= 7).length,  color: "#8B5CF6" },
    { label: "Oylik (30 kun)",    days: 30, price: PRICES[30], count: records.filter(r => r.days > 7 && r.days <= 30).length, color: C.gold },
    { label: "3 Oylik (90 kun)",  days: 90, price: PRICES[90], count: records.filter(r => r.days > 30).length, color: C.green },
  ];

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 260 }}>
      <div style={{ width: 34, height: 34, border: "3px solid #E0E7FF", borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>Moliya</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: C.muted }}>Premium obunalardan tushgan daromat</p>
        </div>
        <button onClick={fetchData} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.card, color: C.muted, cursor: "pointer", fontSize: 13 }}>
          <RefreshCw size={13} /> Yangilash
        </button>
      </div>

      {/* Umumiy kartochkalar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Haftalik daromat",  value: weekRev,  icon: <Calendar size={18} color="#8B5CF6" />, bg: "#EDE9FE", trend: "" },
          { label: "Oylik daromat",     value: monthRev, icon: <TrendingUp size={18} color={C.gold} />, bg: "#FEF3C7", trend: "" },
          { label: "Umumiy daromat",    value: allRev,   icon: <DollarSign size={18} color={C.green} />, bg: "#D1FAE5", trend: "" },
          { label: "Jami obunachi",     value: null,     count: records.length, icon: <Crown size={18} color={C.accent} />, bg: "#EEF2FF", trend: "" },
        ].map((card, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>{card.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.text, lineHeight: 1 }}>
                {card.value !== null ? card.value.toLocaleString("uz-UZ") : (card as any).count}
              </div>
              {card.value !== null && <div style={{ fontSize: 11, color: C.hint, marginTop: 4 }}>so'm</div>}
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: card.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Tarif taqsimoti */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
        {/* Plan stats */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: C.text }}>Tarif bo'yicha taqsimot</h3>
          {planStats.map((p, i) => {
            const rev = p.count * p.price;
            const pct = records.length > 0 ? Math.round((p.count / records.length) * 100) : 0;
            return (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
                    <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{p.label}</span>
                  </div>
                  <span style={{ fontSize: 12, color: C.muted }}>{p.count} ta · {rev.toLocaleString("uz-UZ")} so'm</span>
                </div>
                <div style={{ height: 6, background: "#F1F5F9", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: p.color, borderRadius: 3, transition: "width 1s ease" }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Narxlar */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: C.text }}>Tarif narxlari</h3>
          {planStats.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < planStats.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: p.color + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Crown size={16} color={p.color} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{p.count} ta foydalanuvchi</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{p.price.toLocaleString("uz-UZ")}</div>
                <div style={{ fontSize: 11, color: C.muted }}>so'm</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tranzaksiyalar jadvali */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
        {/* Jadval header + filter */}
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Obunalar tarixi</span>
          <div style={{ display: "flex", gap: 6 }}>
            {(["week", "month", "all"] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${period === p ? C.accent : C.border}`, background: period === p ? C.accent : C.card, color: period === p ? "#fff" : C.muted, cursor: "pointer", fontSize: 12, fontWeight: period === p ? 600 : 400 }}>
                {p === "week" ? "7 kun" : p === "month" ? "30 kun" : "Hammasi"}
              </button>
            ))}
          </div>
        </div>

        {/* Jami (filtrlangan) */}
        <div style={{ padding: "10px 20px", background: "#F8FAFC", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: C.muted }}>{filtered.length} ta obuna</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.green }}>{totalRev.toLocaleString("uz-UZ")} so'm</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.surface }}>
                {["Foydalanuvchi", "Tarif", "Narx", "Boshlangan", "Tugaydi"].map(h => (
                  <th key={h} style={{ padding: "10px 18px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.hint, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: C.muted, fontSize: 14 }}>Bu davrda obuna yo'q</td></tr>
              )}
              {filtered.map((r, i) => {
                const isActive = r.endDate > now;
                const planColor = r.days <= 7 ? "#8B5CF6" : r.days <= 30 ? C.gold : C.green;
                return (
                  <tr key={r.user.id + i} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none" }}
                    onMouseEnter={e => { e.currentTarget.style.background = C.surface; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                    <td style={{ padding: "11px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.accentB})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                          {(r.user.full_name || r.user.email || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{r.user.full_name || "—"}</div>
                          <div style={{ fontSize: 11, color: C.muted }}>{r.user.email || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "11px 18px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600, color: planColor, background: planColor + "18", border: `1px solid ${planColor}40` }}>
                        <Crown size={10} /> {r.plan}
                      </span>
                    </td>
                    <td style={{ padding: "11px 18px", fontSize: 13, fontWeight: 700, color: C.green }}>
                      {r.price.toLocaleString("uz-UZ")} so'm
                    </td>
                    <td style={{ padding: "11px 18px", fontSize: 13, color: C.muted }}>
                      {r.startDate.toLocaleDateString("uz-UZ")}
                    </td>
                    <td style={{ padding: "11px 18px" }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: isActive ? C.green : "#EF4444", background: isActive ? "#D1FAE5" : "#FEE2E2", border: `1px solid ${isActive ? "#6EE7B7" : "#FECACA"}`, padding: "2px 8px", borderRadius: 100 }}>
                        {r.endDate.toLocaleDateString("uz-UZ")}
                      </span>
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