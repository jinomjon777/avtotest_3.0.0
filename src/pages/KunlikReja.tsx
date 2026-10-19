import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlarmClock, Check, Play } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { SEO } from "@/components/SEO";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MeterBar } from "@/components/ui/meter-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { TestInterface } from "@/components/TestInterface";
import { TestInterfaceBase } from "@/components/TestInterfaceBase";
import { ReminderSettings } from "@/components/learn/ReminderSettings";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { isSetupMissing, useDailyPlan } from "@/hooks/useLearning";
import { useLearnT } from "@/hooks/useLearnT";
import { useTestResults } from "@/hooks/useTestResults";
import { trackEvent } from "@/lib/analytics";
import { PLAN_FREE_VARIANT } from "@/lib/reminders";

const VARIANT_COUNT = 63;

/**
 * Kunlik reja: eslatma vaqtidan boshlab bugun 5 ta test.
 *   premium — navbatdagi variant (hali ishlanmagan yoki eng past natijali);
 *   bepul   — bepul bazadan tasodifiy 20 ta savol (variant 97 bilan saqlanadi).
 */
export default function KunlikReja() {
  const { user, isLoading } = useAuth();
  const { language } = useLanguage();
  const tl = useLearnT();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: plan, error, isLoading: planLoading } = useDailyPlan();
  const { variantResults } = useTestResults();
  const [running, setRunning] = useState<{ variant: number } | { free: true } | null>(null);

  useEffect(() => {
    if (!isLoading && !user) nav("/auth", { replace: true, state: { returnTo: "/kunlik-reja" } });
  }, [user, isLoading, nav]);

  // Navbatdagi variant: avval hech ishlanmaganlari, keyin eng past natijalisi
  const nextVariant = useMemo(() => {
    let best = 1, bestPct = Infinity;
    for (let v = 1; v <= VARIANT_COUNT; v++) {
      const r = variantResults[v];
      if (!r) return v;
      const pct = r.totalQuestions ? r.bestScore / r.totalQuestions : 0;
      if (pct < bestPct) { bestPct = pct; best = v; }
    }
    return best;
  }, [variantResults]);

  const onExit = () => {
    setRunning(null);
    qc.invalidateQueries({ queryKey: ["learn"] });
  };

  // Test ekrani — to'liq ekran komponentlari (Variantlar / Test ishlash sahifalaridagidek)
  if (running) {
    if ("variant" in running) {
      return <TestInterface onExit={onExit} variant={running.variant} sessionId={null} isPremiumSession />;
    }
    // ?reja — test holati oddiy "Test ishlash" bilan aralashmasligi uchun alohida kalit
    const file = language === "uz-lat" ? "/700baza2.json?reja" : "/700baza.json?reja";
    return (
      <TestInterfaceBase
        onExit={onExit}
        dataSource={file}
        testName={tl("plan.title")}
        questionCount={20}
        timeLimit={25 * 60}
        randomize
        variant={PLAN_FREE_VARIANT}
        sessionId={null}
        isPremiumSession={false}
      />
    );
  }

  const start = () => {
    if (!plan) return;
    trackEvent("test_start");
    setRunning(plan.premium ? { variant: nextVariant } : { free: true });
  };

  const finished = plan ? plan.done >= plan.target : false;
  const time = plan?.reminder?.enabled ? plan.reminder.time : null;

  return (
    <MainLayout>
      <SEO title={tl("plan.title")} description={tl("plan.subtitle")} path="/kunlik-reja" noIndex />
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-8 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><AlarmClock className="w-6 h-6 text-primary" />{tl("plan.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{tl("plan.subtitle")}</p>
        </div>

        {planLoading || !user ? (
          <Skeleton className="h-40 rounded-xl" />
        ) : error ? (
          <Card className="p-5 border-border text-sm text-muted-foreground">
            {isSetupMissing(error) ? tl("common.setupMissing") : tl("common.error")}
          </Card>
        ) : plan && (
          <>
            <Card className="p-5 border-border">
              <div className="flex items-end justify-between mb-2">
                <div className="text-lg font-semibold text-foreground">{tl("plan.progress", { done: plan.done, target: plan.target })}</div>
                {time && <div className="text-sm text-muted-foreground">⏰ {time}</div>}
              </div>
              <MeterBar value={Math.min(100, (plan.done / plan.target) * 100)} tone={finished ? "success" : "warning"} className="mb-3" />
              <p className="text-xs text-muted-foreground mb-4">
                {tl(plan.premium ? "plan.kind.premium" : "plan.kind.free")}
              </p>

              {!plan.started && time && (
                <p className="text-sm text-warning mb-3">{tl("plan.notStarted", { time })}</p>
              )}
              {!time && <p className="text-xs text-muted-foreground mb-3">{tl("plan.noReminder")}</p>}

              {finished ? (
                <div className="space-y-3">
                  <p className="text-sm text-success flex items-center gap-1.5"><Check className="w-4 h-4" />{tl("plan.done")}</p>
                  <Button variant="outline" className="w-full h-11 rounded-xl" onClick={start}>{tl("plan.extra")}</Button>
                </div>
              ) : (
                <Button className="w-full h-12 rounded-xl text-base gap-2" onClick={start}>
                  <Play className="w-4 h-4" />
                  {tl("plan.startN", { n: plan.done + 1 })}
                  {plan.premium && <span className="opacity-80 font-normal">· {tl("plan.variantN", { n: nextVariant })}</span>}
                </Button>
              )}
            </Card>

            <ReminderSettings plan={plan} />
          </>
        )}
      </div>
    </MainLayout>
  );
}
