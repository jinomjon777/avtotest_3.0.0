import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isSetupMissing } from "@/hooks/useLearning";
import { resolveQuestions, ResolvedQuestion } from "@/lib/questionLookup";
import { topicName } from "@/lib/topicName";

const C = { card: "#FFFFFF", border: "#E2E8F0", accent: "#4F46E5", text: "#0F172A", muted: "#64748B", hint: "#94A3B8", bad: "#EF4444", ok: "#10B981" };

interface Analytics {
  days: number;
  generated_at: string;
  users: { total: number; new_in_period: number; dau: number; wau: number; mau: number; premium_total: number; premium_pct: number | null; new_premium_in_period: number };
  series: { day: string; active_users: number; new_users: number; tests: number }[];
  tests: { finished: number; regular: number; exam: number; practice: number; avg_percent: number | null };
  starts: { test: number; exam: number; practice: number };
  retention: { d1: { cohort: number; retained: number }; d7: { cohort: number; retained: number } };
  hard_questions: { question_key: string; topic_id: string | null; answers: number; wrong: number; wrong_pct: number }[];
  hard_topics: { topic_id: string; answers: number; wrong: number; wrong_pct: number }[];
}

const pct = (a: number, b: number) => (b > 0 ? `${Math.round((100 * a) / b)}%` : "–");

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
      {title && <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>{title}</div>}
      {children}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card>
      <div style={{ fontSize: 24, fontWeight: 800, color: C.text }}>{value}</div>
      <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: C.hint, marginTop: 2 }}>{sub}</div>}
    </Card>
  );
}

export default function AdminAnalytics() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [qmap, setQmap] = useState<Map<string, ResolvedQuestion>>(new Map());

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data: r, error: e } = await (supabase as any).rpc("get_admin_analytics", { p_days: days });
      if (e) throw e;
      if (r?.ok === false) throw new Error(r.error === "forbidden" ? "Ruxsat yo'q (admin emas)" : r.error);
      setData(r as Analytics);
      const keys = (r.hard_questions ?? []).map((q: { question_key: string }) => q.question_key);
      if (keys.length) resolveQuestions(keys, "oz").then(setQmap).catch(() => undefined);
    } catch (e: any) {
      setData(null);
      setError(isSetupMissing(e) ? "Analitika migratsiyasi (20260803000000_admin_analytics.sql) hali qo'llanmagan." : e?.message || "Xatolik");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const maxActive = Math.max(1, ...(data?.series ?? []).map((s) => s.active_users));
  const funnel = data ? [
    { label: "Oddiy testlar", start: data.starts.test, done: data.tests.regular },
    { label: "Real imtihon", start: data.starts.exam, done: data.tests.exam },
    { label: "Mashq", start: data.starts.practice, done: data.tests.practice },
  ] : [];

  return (
    <div style={{ padding: 20, maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: C.text }}>Analitika</h2>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d)}
              style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${days === d ? C.accent : C.border}`, background: days === d ? "#EEF2FF" : "#fff", color: days === d ? C.accent : C.muted, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
              {d} kun
            </button>
          ))}
          <button onClick={load} title="Yangilash" style={{ padding: 7, borderRadius: 8, border: `1px solid ${C.border}`, background: "#fff", cursor: "pointer", color: C.muted, display: "flex" }}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {error && <Card><div style={{ color: C.bad, fontSize: 13 }}>{error}</div></Card>}
      {loading && !data && <Card><div style={{ color: C.muted, fontSize: 13 }}>Yuklanmoqda...</div></Card>}

      {data && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
            <Stat label="DAU (bugun)" value={data.users.dau} />
            <Stat label="WAU (7 kun)" value={data.users.wau} />
            <Stat label="MAU (30 kun)" value={data.users.mau} />
            <Stat label={`Yangi foydalanuvchilar (${data.days} kun)`} value={data.users.new_in_period} sub={`Jami: ${data.users.total}`} />
            <Stat label="Yakunlangan testlar" value={data.tests.finished} sub={data.tests.avg_percent == null ? undefined : `O'rtacha natija: ${data.tests.avg_percent}%`} />
            <Stat label="Premium (faol)" value={data.users.premium_total} sub={`${data.users.premium_pct ?? 0}% · davrda yangi: ${data.users.new_premium_in_period}`} />
          </div>

          <Card title={`Kunlik faol foydalanuvchilar (${data.days} kun)`}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 110 }}>
              {data.series.map((s) => (
                <div key={s.day} title={`${s.day}: ${s.active_users} faol, ${s.new_users} yangi, ${s.tests} test`}
                  style={{ flex: 1, minWidth: 2, height: `${Math.max(3, (s.active_users / maxActive) * 100)}%`, background: s.active_users ? C.accent : C.border, borderRadius: 2 }} />
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.hint, marginTop: 6 }}>
              <span>{data.series[0]?.day}</span><span>eng ko'p: {maxActive}</span><span>{data.series[data.series.length - 1]?.day}</span>
            </div>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
            <Card title="Testni boshlash va tugatish">
              <table style={{ fontSize: 13 }}>
                <thead><tr style={{ color: C.hint, textAlign: "left" }}><th style={{ padding: "4px 0" }}></th><th>Boshlandi</th><th>Tugadi</th><th>Tugatish</th></tr></thead>
                <tbody>
                  {funnel.map((f) => (
                    <tr key={f.label} style={{ borderTop: `1px solid ${C.border}` }}>
                      <td style={{ padding: "7px 0", color: C.text }}>{f.label}</td>
                      <td>{f.start}</td><td>{f.done}</td>
                      <td style={{ fontWeight: 700 }}>{f.start > 0 ? pct(Math.min(f.done, f.start), f.start) : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ fontSize: 11, color: C.hint, marginTop: 8 }}>"Boshlandi" faqat tizimga kirgan foydalanuvchilar uchun va yangilanish deploy qilingandan keyin hisoblanadi.</div>
            </Card>

            <Card title="Retention (qaytish)">
              <table style={{ fontSize: 13 }}>
                <thead><tr style={{ color: C.hint, textAlign: "left" }}><th style={{ padding: "4px 0" }}></th><th>Guruh</th><th>Qaytdi</th><th>%</th></tr></thead>
                <tbody>
                  {([["1-kun", data.retention.d1], ["7-kun", data.retention.d7]] as const).map(([l, r]) => (
                    <tr key={l} style={{ borderTop: `1px solid ${C.border}` }}>
                      <td style={{ padding: "7px 0", color: C.text }}>{l}</td><td>{r.cohort}</td><td>{r.retained}</td>
                      <td style={{ fontWeight: 700 }}>{pct(r.retained, r.cohort)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ fontSize: 11, color: C.hint, marginTop: 8 }}>Ro'yxatdan o'tgan kundan keyin aynan 1 yoki 7-kuni faol bo'lgan foydalanuvchilar ulushi.</div>
            </Card>
          </div>

          <Card title="Eng ko'p xato qilinadigan savollar">
            {data.hard_questions.length === 0 ? (
              <div style={{ fontSize: 13, color: C.muted }}>Hali yetarli ma'lumot yo'q (kamida 5 ta javob kerak).</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ fontSize: 13 }}>
                  <thead><tr style={{ color: C.hint, textAlign: "left" }}><th style={{ padding: "4px 8px 4px 0" }}>Savol</th><th>Mavzu</th><th>Javob</th><th>Xato</th></tr></thead>
                  <tbody>
                    {data.hard_questions.map((q) => (
                      <tr key={q.question_key} style={{ borderTop: `1px solid ${C.border}`, verticalAlign: "top" }}>
                        <td style={{ padding: "7px 8px 7px 0", color: C.text, minWidth: 260 }}>{qmap.get(q.question_key)?.text ?? <span style={{ color: C.hint }}>{q.question_key}</span>}</td>
                        <td style={{ color: C.muted, whiteSpace: "nowrap" }}>{topicName(q.topic_id, "uz_lat")}</td>
                        <td>{q.answers}</td>
                        <td style={{ fontWeight: 700, color: C.bad }}>{q.wrong_pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card title="Eng ko'p xato qilinadigan mavzular">
            {data.hard_topics.length === 0 ? (
              <div style={{ fontSize: 13, color: C.muted }}>Hali yetarli ma'lumot yo'q (kamida 10 ta javob kerak).</div>
            ) : (
              <table style={{ fontSize: 13 }}>
                <thead><tr style={{ color: C.hint, textAlign: "left" }}><th style={{ padding: "4px 0" }}>Mavzu</th><th>Javob</th><th>Xato</th></tr></thead>
                <tbody>
                  {data.hard_topics.map((t) => (
                    <tr key={t.topic_id} style={{ borderTop: `1px solid ${C.border}` }}>
                      <td style={{ padding: "7px 8px 7px 0", color: C.text }}>{topicName(t.topic_id, "uz_lat")}</td>
                      <td>{t.answers}</td>
                      <td style={{ fontWeight: 700, color: C.bad }}>{t.wrong_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
