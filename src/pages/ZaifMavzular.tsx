import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import { SEO } from "@/components/SEO";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MeterBar } from "@/components/ui/meter-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { isSetupMissing, useWeakTopics } from "@/hooks/useLearning";
import { useLearnT } from "@/hooks/useLearnT";
import { toneFor, toneText } from "@/lib/learnTheme";
import { topicName } from "@/lib/topicName";
import topics from "@/data/topics.json";

const LANG = { "uz-lat": "uz_lat", uz: "uz_cyr", ru: "ru" } as const;
const AGGREGATES = new Set(["31", "35a", "35b"]);

export default function ZaifMavzular() {
  const { user, isLoading } = useAuth();
  const { language } = useLanguage();
  const tl = useLearnT();
  const nav = useNavigate();
  const lang = LANG[language as keyof typeof LANG] ?? "uz_lat";
  const { data, isLoading: loading, error } = useWeakTopics();

  useEffect(() => {
    if (!isLoading && !user) nav("/auth", { replace: true });
  }, [user, isLoading, nav]);

  // 'other' (aniqlanmagan) alohida ro'yxatda ko'rsatilmaydi — u haqida izoh qatori bor
  const rows = (data?.topics ?? []).filter((x) => x.topic_id !== "other");
  const sorted = [...rows].sort((a, b) => Number(b.enough_data) - Number(a.enough_data) || a.accuracy_percent - b.accuracy_percent);
  const started = new Set(rows.map((x) => x.topic_id));
  const unstarted = (topics as { id: string }[]).filter((x) => !AGGREGATES.has(String(x.id)) && !started.has(String(x.id)));

  return (
    <MainLayout>
      <SEO title={tl("weak.title")} description={tl("weak.subtitle")} path="/zaif-mavzular" noIndex />
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-10">
        <h1 className="text-2xl font-bold text-foreground">{tl("weak.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-5">{tl("weak.subtitle")}</p>

        {error && isSetupMissing(error) ? (
          <p className="text-sm text-muted-foreground">{tl("common.setupMissing")}</p>
        ) : loading ? (
          <div className="space-y-3"><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-24 rounded-xl" /></div>
        ) : sorted.length === 0 ? (
          <EmptyState icon={BarChart3} title={tl("weak.empty")} description="" actionLabel={tl("weak.startPractice")} onAction={() => nav("/mashq")} />
        ) : (
          <>
            <div className="space-y-3">
              {sorted.map((x) => {
                const tone = x.enough_data ? toneFor(x.accuracy_percent) : "muted";
                return (
                  <Card key={x.topic_id} className="p-4 border-border">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <div className="font-medium text-foreground leading-snug">{topicName(x.topic_id, lang)}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{tl("weak.stats", { correct: x.correct, total: x.answered })}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-lg font-bold ${toneText[tone]}`}>{Math.round(x.accuracy_percent)}%</div>
                        {!x.enough_data && <span className="text-[11px] text-muted-foreground">{tl("weak.fewData")}</span>}
                      </div>
                    </div>
                    <MeterBar value={x.accuracy_percent} tone={tone} className="mb-3" />
                    <Button size="sm" variant="outline" className="rounded-lg" onClick={() => nav(`/mashq?mode=topic&topic=${x.topic_id}`)}>
                      {tl("weak.practice")}
                    </Button>
                  </Card>
                );
              })}
            </div>

            {(data?.unclassified_answers ?? 0) > 0 && (
              <p className="text-xs text-muted-foreground mt-4">{tl("weak.coverage", { n: data!.unclassified_answers })}</p>
            )}

            {unstarted.length > 0 && (
              <div className="mt-8">
                <h2 className="text-sm font-semibold text-foreground mb-2">{tl("weak.unstarted")}</h2>
                <div className="flex flex-wrap gap-2">
                  {unstarted.map((x) => (
                    <button
                      key={x.id}
                      onClick={() => nav(`/mashq?mode=topic&topic=${x.id}`)}
                      className="px-3 py-1.5 rounded-full border border-border text-xs text-foreground hover:border-primary/50"
                    >
                      {topicName(String(x.id), lang)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
