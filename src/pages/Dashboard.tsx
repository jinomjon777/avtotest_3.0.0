import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, ChevronRight, Crown, Flame, ListX, Settings2, TrendingDown } from "lucide-react";
import { SEO } from "@/components/SEO";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MeterBar } from "@/components/ui/meter-bar";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  isSetupMissing, useDashboardStats, useMistakeCount, useRecentActivity, useSaveGoals, useWeakTopics,
} from "@/hooks/useLearning";
import { useLearnT } from "@/hooks/useLearnT";
import { formatDuration, PRACTICE_VARIANT, toneFor, toneText } from "@/lib/learnTheme";
import { topicName } from "@/lib/topicName";
import { toast } from "@/hooks/use-toast";

const LANG = { "uz-lat": "uz_lat", uz: "uz_cyr", ru: "ru" } as const;

export default function Dashboard() {
  const { user, profile, isLoading } = useAuth();
  const { language } = useLanguage();
  const tl = useLearnT();
  const nav = useNavigate();
  const lang = LANG[language as keyof typeof LANG] ?? "uz_lat";

  const stats = useDashboardStats();
  const activity = useRecentActivity(7);
  const weak = useWeakTopics();
  const mistakes = useMistakeCount();
  const saveGoals = useSaveGoals();

  const [editing, setEditing] = useState(false);
  const [examDate, setExamDate] = useState("");
  const [goal, setGoal] = useState(20);

  useEffect(() => {
    if (!isLoading && !user) nav("/auth", { replace: true });
  }, [user, isLoading, nav]);

  const s = stats.data;
  useEffect(() => {
    if (s) { setExamDate(s.exam_date ?? ""); setGoal(s.daily_goal || 20); }
  }, [s?.exam_date, s?.daily_goal]); // eslint-disable-line react-hooks/exhaustive-deps

  const name = profile?.full_name || profile?.username || user?.email?.split("@")[0] || "";
  const hasData = !!s && (s.total_tests > 0 || s.answered_total > 0);
  const readiness = s?.readiness_percent ?? null;
  const topicsList = (weak.data?.topics ?? []).filter((x) => x.topic_id !== "other" && x.enough_data);
  const weakest = [...topicsList].sort((a, b) => a.accuracy_percent - b.accuracy_percent).slice(0, 3);
  const strongest = [...topicsList].sort((a, b) => b.accuracy_percent - a.accuracy_percent).slice(0, 3);

  const onSaveGoals = async () => {
    try {
      await saveGoals({ exam_date: examDate || null, daily_goal: Math.min(200, Math.max(5, Number(goal) || 20)) });
      setEditing(false);
      toast({ title: tl("dash.goalsSaved") });
    } catch { toast({ title: tl("common.error"), variant: "destructive" }); }
  };

  const examLabel = !s?.exam_date ? tl("dash.noExam")
    : s.days_to_exam == null ? s.exam_date
    : s.days_to_exam > 0 ? tl("dash.daysLeft", { n: s.days_to_exam })
    : s.days_to_exam === 0 ? tl("dash.examToday") : tl("dash.examPassed");

  const days = activity.data ?? [];
  const goalPct = s && s.daily_goal ? Math.min(100, (s.today_answers / s.daily_goal) * 100) : 0;

  return (
    <MainLayout>
      <SEO title={tl("dash.title")} description={tl("dash.title")} path="/dashboard" noIndex />
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-10 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">{tl("dash.hello", { name })}</h1>
          {profile?.is_pro && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              <Crown className="w-3.5 h-3.5" />{tl("dash.premiumActive")}
            </span>
          )}
        </div>

        {stats.error && isSetupMissing(stats.error) ? (
          <Card className="p-5 border-border text-sm text-muted-foreground">{tl("common.setupMissing")}</Card>
        ) : stats.isLoading ? (
          <div className="space-y-3"><Skeleton className="h-56 rounded-2xl" /><Skeleton className="h-24 rounded-2xl" /></div>
        ) : (
          <>
            {/* Tayyorlik + asosiy CTA */}
            <Card className="p-5 md:p-6 border-border">
              <div className="flex flex-col sm:flex-row items-center gap-5">
                <ProgressRing value={readiness ?? 0} tone={toneFor(readiness)} label={tl("dash.readiness")}>
                  <span className={`text-3xl font-bold ${toneText[toneFor(readiness)]}`}>{readiness == null ? "–" : `${Math.round(readiness)}%`}</span>
                </ProgressRing>
                <div className="flex-1 w-full text-center sm:text-left">
                  <div className="font-semibold text-foreground">{tl("dash.readiness")}</div>
                  <p className="text-sm text-muted-foreground mt-0.5 mb-4">
                    {readiness == null ? tl("dash.noReadiness") : tl("dash.readinessHint")}
                  </p>
                  <Button className="w-full sm:w-auto h-12 rounded-xl px-6" onClick={() => nav(hasData ? "/mashq" : "/test-ishlash")}>
                    {hasData ? tl("dash.startToday") : tl("dash.startFirst")}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Maqsad: imtihon sanasi + kunlik maqsad */}
            <Card className="p-4 border-border">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs text-muted-foreground">{tl("dash.examDate")}</div>
                  <div className="font-semibold text-foreground">{examLabel}</div>
                </div>
                <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setEditing((v) => !v)}>
                  <Settings2 className="w-4 h-4" />{tl("dash.editGoals")}
                </Button>
              </div>
              {editing && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <label className="text-xs text-muted-foreground">{tl("dash.examDate")}
                    <Input type="date" className="mt-1" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
                  </label>
                  <label className="text-xs text-muted-foreground">{tl("dash.dailyGoal")}
                    <Input type="number" min={5} max={200} className="mt-1" value={goal} onChange={(e) => setGoal(Number(e.target.value))} />
                  </label>
                  <Button className="col-span-2 rounded-lg" onClick={onSaveGoals}>{tl("common.save")}</Button>
                </div>
              )}
              <div className="text-sm text-foreground mb-1.5">
                {s?.today_done ? tl("dash.goalReached") : tl("dash.todayProgress", { done: s?.today_answers ?? 0, goal: s?.daily_goal ?? 20 })}
              </div>
              <MeterBar value={goalPct} tone={s?.today_done ? "success" : "warning"} />
            </Card>

            {/* Streak */}
            <Card className="p-4 border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <Flame className="w-5 h-5 text-warning" />{tl("dash.streak")}
                </div>
                <span className="font-bold text-foreground">{tl("dash.streakDays", { n: s?.current_streak ?? 0 })}</span>
              </div>
              <div className="flex gap-2 justify-between">
                {days.map((d) => (
                  <div key={d.day} className="flex-1 text-center">
                    <div className={`h-2 rounded-full ${d.answers > 0 ? "bg-success" : "bg-muted"}`} />
                    <div className="text-[10px] text-muted-foreground mt-1">{d.day.slice(8)}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Raqamlar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                [tl("dash.testsTaken"), s?.total_tests ?? 0],
                [tl("dash.avgScore"), s?.avg_percent == null ? "–" : `${Math.round(s.avg_percent)}%`],
                [tl("dash.answers"), s?.answered_total ?? 0],
                [tl("dash.accuracy"), s?.accuracy_percent == null ? "–" : `${Math.round(s.accuracy_percent)}%`],
              ].map(([label, value]) => (
                <Card key={String(label)} className="p-3.5 border-border">
                  <div className="text-xl font-bold text-foreground">{value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                </Card>
              ))}
            </div>

            {/* Tez havolalar */}
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { icon: ListX, label: tl("dash.mistakes"), sub: tl("dash.mistakesCount", { n: mistakes.data ?? 0 }), to: "/xatolarim" },
                { icon: Bookmark, label: tl("dash.saved"), sub: String(s?.saved_count ?? 0), to: "/xatolarim" },
                { icon: TrendingDown, label: tl("dash.weakTopics"), sub: "", to: "/zaif-mavzular" },
              ].map((x) => (
                <button key={x.label} onClick={() => nav(x.to)} className="text-left">
                  <Card className="p-4 border-border flex items-center gap-3 hover:border-primary/40 transition-colors">
                    <x.icon className="w-5 h-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{x.label}</div>
                      {x.sub && <div className="text-xs text-muted-foreground">{x.sub}</div>}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Card>
                </button>
              ))}
            </div>

            {/* Mavzular */}
            {topicsList.length === 0 ? (
              <Card className="p-4 border-border text-sm text-muted-foreground">{tl("dash.noTopics")}</Card>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {[[tl("dash.weakest"), weakest], [tl("dash.strongest"), strongest]].map(([title, list]) => (
                  <Card key={String(title)} className="p-4 border-border">
                    <div className="text-sm font-semibold text-foreground mb-3">{title as string}</div>
                    <div className="space-y-3">
                      {(list as typeof weakest).map((x) => (
                        <div key={x.topic_id}>
                          <div className="flex justify-between gap-2 text-xs mb-1">
                            <span className="text-foreground truncate">{topicName(x.topic_id, lang)}</span>
                            <span className={`font-semibold ${toneText[toneFor(x.accuracy_percent)]}`}>{Math.round(x.accuracy_percent)}%</span>
                          </div>
                          <MeterBar value={x.accuracy_percent} tone={toneFor(x.accuracy_percent)} height="sm" />
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* So'nggi natijalar */}
            <Card className="p-4 border-border">
              <div className="text-sm font-semibold text-foreground mb-3">{tl("dash.recent")}</div>
              {!s?.last_results?.length ? (
                <p className="text-sm text-muted-foreground">{tl("dash.noResults")}</p>
              ) : (
                <div className="divide-y divide-border">
                  {s.last_results.map((r) => (
                    <div key={r.id} className="flex items-center justify-between py-2.5 text-sm">
                      <div>
                        <div className="font-medium text-foreground">
                          {r.variant === PRACTICE_VARIANT ? tl("dash.practiceLabel") : tl("dash.variantLabel", { n: r.variant })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(r.completed_at).toLocaleDateString()} · {formatDuration(r.time_seconds)}
                        </div>
                      </div>
                      <div className={`font-bold ${toneText[toneFor(r.percent)]}`}>{r.correct}/{r.total}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}

        {!profile?.is_pro && (
          <Card className="p-4 border-primary/30 bg-primary/5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Crown className="w-5 h-5 text-primary shrink-0" />
              <div className="text-sm font-medium text-foreground">{tl("dash.premiumCta")}</div>
            </div>
            <Button size="sm" className="rounded-lg shrink-0" onClick={() => nav("/pro")}>{tl("dash.premiumBtn")}</Button>
          </Card>
        )}
        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={() => nav("/profile")}>{tl("dash.profile")}</Button>
        </div>
      </div>
    </MainLayout>
  );
}
