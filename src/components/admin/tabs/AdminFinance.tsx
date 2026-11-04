import { useEffect, useMemo, useState } from "react";
import { TrendingUp, Crown, RefreshCw, Calendar, DollarSign } from "lucide-react";
import { adminApi, type ChekRow } from "@/lib/adminApi";

const C = {
  card: "#FFFFFF", surface: "#F8FAFC", border: "#E2E8F0",
  accent: "#4F46E5", accentB: "#06B6D4", green: "#10B981", gold: "#D97706",
  text: "#0F172A", muted: "#64748B", hint: "#94A3B8",
};

const PLAN_COLORS = ["#8B5CF6", C.gold, C.green, C.accent, C.accentB];

interface Plan { id: string; days: number; amount: number; label: string; sort: number; is_active: boolean }

/**
 * Moliya — FAQAT haqiqiy, tasdiqlangan to'lovlar (chek.status = 'approved') asosida.
 * Avval daromad profiles jadvalidagi joriy tarifdan "taxmin" qilinardi: uzaytirishlar oldingi xaridni
 * o'chirardi, muddati tugaganlar yo'qolardi va admin bergan bepul premium ham daromad sanalardi.
 */
export default function AdminFinance() {
  const [cheks, setCheks] = useState<ChekRow[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState<"week" | "month" | "all">("month");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [c, p] = await Promise.all([
        adminApi<{ data: ChekRow[] }>("list_chek"),
        adminApi<{ data: Plan[] }>("list_plans"),
      ]);
      setCheks((c.data ?? []).filter((x) => x.status === "approved"));
      setPlans(p.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik");
    }
    setLoading(false);
  };
  useEffect(() => { void fetchData(); }, []);

  const paidAt = (c: ChekRow) => new Date(c.reviewed_at ?? c.created_at);
  const now = Date.now();
  const since = { week: now - 7 * 86400000, month: now - 30 * 86400000, all: 0 };
  const sum = (rows: ChekRow[]) => rows.reduce((s, c) => s + (c.amount ?? 0), 0);

  const filtered = useMemo(
    () => cheks.filter((c) => paidAt(c).getTime() >= since[period]).sort((a, b) => paidAt(b).getTime() - paidAt(a).getTime()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cheks, period],
  );
  const weekRev = sum(cheks.filter((c) => paidAt(c).getTime() >= since.week));
  const monthRev = sum(cheks.filter((c) => paidAt(c).getTime() >= since.month));
  const allRev = sum(cheks);
  const payers = new Set(cheks.map((c) => c.user_id ?? c.email)).size;

  // Tarif bo'yicha: chekdagi kun soniga ko'ra (narx o'zgargan bo'lsa ham haqiqiy summa olinadi)
  const byDays = useMemo(() => {
    const m = new Map<number, { count: number; amount: number }>();
    for (const c of cheks) {
      const d = c.tariff_days ?? 0;
      const v = m.get(d) ?? { count: 0, amount: 0 };
      v.count++; v.amount += c.amount ?? 0;
      m.set(d, v);
    }
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, [cheks]);
  const planLabel = (days: number) => plans.find((p) => p.days === days)?.label ?? (days ? `${days} kun` : "Noma'lum");

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 260 }}>
      <div style={{ width: 34, height: 34, border: "3px solid #E0E7FF", borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>Moliya</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: C.muted }}>Tasdiqlangan to'lovlar asosida</p>
        </div>
        <button onClick={fetchData} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.card, color: C.muted, cursor: "pointer", fontSize: 13 }}>
          <RefreshCw size={13} /> Yangilash
        </button>
      </div>

      {error && <div role="alert" style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 10, background: "#FEE2E2", color: "#EF4444", fontSize: 13 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Oxirgi 7 kun", value: `${weekRev.toLocaleString("uz-UZ")} so'm`, icon: <Calendar size={18} color="#8B5CF6" />, bg: "#EDE9FE" },
          { label: "Oxirgi 30 kun", value: `${monthRev.toLocaleString("uz-UZ")} so'm`, icon: <TrendingUp size={18} color={C.gold} />, bg: "#FEF3C7" },
          { label: "Umumiy daromad", value: `${allRev.toLocaleString("uz-UZ")} so'm`, icon: <DollarSign size={18} color={C.green} />, bg: "#D1FAE5" },
          { label: "To'lovlar / to'lovchilar", value: `${cheks.length} / ${payers}`, icon: <Crown size={18} color={C.accent} />, bg: "#EEF2FF" },
        ].map((card, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>{card.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.text, lineHeight: 1.2 }}>{card.value}</div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: card.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>{card.icon}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginBottom: 18 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: C.text }}>Tarif bo'yicha taqsimot</h3>
          {byDays.length === 0 && <p style={{ fontSize: 13, color: C.muted }}>Hali tasdiqlangan to'lov yo'q</p>}
          {byDays.map(([days, v], i) => {
            const pct = cheks.length > 0 ? Math.round((v.count / cheks.length) * 100) : 0;
            const color = PLAN_COLORS[i % PLAN_COLORS.length];
            return (
              <div key={days} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                    <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{planLabel(days)}</span>
                  </div>
                  <span style={{ fontSize: 12, color: C.muted }}>{v.count} ta · {v.amount.toLocaleString("uz-UZ")} so'm</span>
                </div>
                <div style={{ height: 6, background: "#F1F5F9", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3 }} />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: C.text }}>Joriy narxlar <span style={{ fontWeight: 400, color: C.muted, fontSize: 12 }}>(Sozlamalar bo'limida o'zgartiriladi)</span></h3>
          {plans.map((p, i) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < plans.length - 1 ? `1px solid ${C.border}` : "none", opacity: p.is_active ? 1 : 0.5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: PLAN_COLORS[i % PLAN_COLORS.length] + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Crown size={16} color={PLAN_COLORS[i % PLAN_COLORS.length]} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{p.days} kun{p.is_active ? "" : " · o'chirilgan"}</div>
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{p.amount.toLocaleString("uz-UZ")} <span style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>so'm</span></div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>To'lovlar tarixi</span>
          <div style={{ display: "flex", gap: 6 }}>
            {(["week", "month", "all"] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${period === p ? C.accent : C.border}`, background: period === p ? C.accent : C.card, color: period === p ? "#fff" : C.muted, cursor: "pointer", fontSize: 12, fontWeight: period === p ? 600 : 400 }}>
                {p === "week" ? "7 kun" : p === "month" ? "30 kun" : "Hammasi"}
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding: "10px 20px", background: C.surface, borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: C.muted }}>{filtered.length} ta to'lov</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.green }}>{sum(filtered).toLocaleString("uz-UZ")} so'm</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.surface }}>
                {["Foydalanuvchi", "Tarif", "Summa", "Tasdiqlangan", "Premium tugashi", "Manba"].map((h) => (
                  <th key={h} style={{ padding: "10px 18px", textAlign: "left", fontSize: 11, fontWeight: 600, color: C.hint, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: C.muted, fontSize: 14 }}>Bu davrda to'lov yo'q</td></tr>
              )}
              {filtered.map((c, i) => {
                const active = c.premium_until ? new Date(c.premium_until).getTime() > now : false;
                return (
                  <tr key={c.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none" }}>
                    <td style={{ padding: "11px 18px", fontSize: 13, fontWeight: 600, color: C.text }}>
                      {c.email || "—"}
                      {c.telegram_username && <div style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>@{c.telegram_username}</div>}
                    </td>
                    <td style={{ padding: "11px 18px", fontSize: 13, color: C.text }}>{planLabel(c.tariff_days ?? 0)}</td>
                    <td style={{ padding: "11px 18px", fontSize: 13, fontWeight: 700, color: C.green }}>{(c.amount ?? 0).toLocaleString("uz-UZ")} so'm</td>
                    <td style={{ padding: "11px 18px", fontSize: 13, color: C.muted }}>{paidAt(c).toLocaleDateString("uz-UZ")}</td>
                    <td style={{ padding: "11px 18px" }}>
                      {c.premium_until ? (
                        <span style={{ fontSize: 12, fontWeight: 500, color: active ? C.green : "#EF4444", background: active ? "#D1FAE5" : "#FEE2E2", padding: "2px 8px", borderRadius: 100 }}>
                          {new Date(c.premium_until).toLocaleDateString("uz-UZ")}
                        </span>
                      ) : <span style={{ color: C.hint }}>—</span>}
                    </td>
                    <td style={{ padding: "11px 18px", fontSize: 12, color: C.muted }}>{c.source === "telegram" ? "Telegram" : "Sayt/admin"}</td>
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
