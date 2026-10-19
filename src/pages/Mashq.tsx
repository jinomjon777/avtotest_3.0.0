import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { MainLayout } from "@/components/layout/MainLayout";
import { PracticeSession } from "@/components/learn/PracticeSession";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLearnT } from "@/hooks/useLearnT";
import { buildPractice, PracticeMode } from "@/lib/practiceBuilder";
import type { ResolvedQuestion } from "@/lib/questionLookup";
import { topicName } from "@/lib/topicName";
import { claimFreeSession, ClaimResult, FreeKind } from "@/lib/freeLimit";
import { PremiumGate } from "@/components/learn/PremiumGate";
import { useAccessState } from "@/hooks/useAccessState";

const LANG = { "uz-lat": "uz_lat", uz: "uz_cyr", ru: "ru" } as const;

export default function Mashq() {
  const { user, isLoading } = useAuth();
  const { language, questionLang } = useLanguage();
  const tl = useLearnT();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const rawMode = sp.get("mode");
  const mode: PracticeMode = rawMode === "mistakes" || rawMode === "topic" ? rawMode : "today";
  const topic = sp.get("topic");
  const first = sp.get("first");

  const [qs, setQs] = useState<ResolvedQuestion[] | null>(null);
  const [round, setRound] = useState(0);
  const [claim, setClaim] = useState<ClaimResult | null>(null);
  const { isPremium } = useAccessState();
  const kind: FreeKind = mode === "today" ? "practice" : mode;

  useEffect(() => {
    if (!isLoading && !user) nav("/auth", { replace: true });
  }, [user, isLoading, nav]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    setQs(null);
    setClaim(null);
    const run = async () => {
      // Xatolar mashqi: avval savollar (bo'sh bo'lsa limit sarflanmaydi), keyin limit.
      // Mavzu / bugungi mashq: avval limit — bepul foydalanuvchiga savollarni server shundan keyingina beradi.
      let c: ClaimResult | null = null;
      if (mode !== "mistakes") {
        c = await claimFreeSession(kind, isPremium);
        if (!alive) return;
        if (c === "limit" || c === "error") { setClaim(c); setQs([]); return; }
      }
      const r = await buildPractice(mode, questionLang as any, { topic, first, premium: c === "ok" });
      if (!alive) return;
      if (c === null) {
        if (r.length === 0) { setClaim("ok"); setQs(r); return; }
        c = await claimFreeSession(kind, isPremium);
        if (!alive) return;
      }
      setClaim(c);
      setQs(r);
      if ((c === "ok" || c === "ok_free") && r.length > 0) trackEvent("practice_start");
    };
    run().catch((e) => {
      if (!alive) return;
      setClaim(e?.code === "daily_limit" ? "limit" : "error");
      setQs([]);
    });
    return () => { alive = false; };
    // isPremium faqat zaxira holat uchun; o'zgarganda sessiyani qayta boshlamaymiz
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, mode, topic, first, round, questionLang]);

  const title =
    mode === "topic" ? topicName(topic, LANG[language as keyof typeof LANG] ?? "uz_lat")
    : mode === "mistakes" ? tl("practice.title.mistakes")
    : tl("practice.title.today");

  return (
    <MainLayout>
      <SEO title={title} description="Mashq" path="/mashq" noIndex />
      {claim === "limit" ? (
        <PremiumGate kind={kind} />
      ) : claim === "error" ? (
        <div className="max-w-2xl mx-auto px-4 py-10">
          <EmptyState icon={BookOpen} title={tl("common.error")} description="" actionLabel={tl("common.retry")} onAction={() => setRound((r) => r + 1)} />
        </div>
      ) : qs === null || claim === null ? (
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-3">
          <p className="text-sm text-muted-foreground">{tl("practice.building")}</p>
          <Skeleton className="h-24 rounded-xl" /><Skeleton className="h-14 rounded-xl" /><Skeleton className="h-14 rounded-xl" />
        </div>
      ) : qs.length === 0 ? (
        <div className="max-w-2xl mx-auto px-4 py-10">
          <EmptyState
            icon={BookOpen}
            title={mode === "mistakes" ? tl("practice.emptyMistakes") : tl("practice.empty")}
            description=""
            actionLabel={tl("practice.toDashboard")}
            onAction={() => nav("/dashboard")}
          />
        </div>
      ) : (
        <>
        {claim === "ok_free" && (
          <p className="max-w-2xl mx-auto px-4 pt-4 text-xs text-muted-foreground">{tl("limit.freeNote")}</p>
        )}
        <PracticeSession
          key={round}
          questions={qs}
          title={title}
          onAgain={() => setRound((r) => r + 1)}
          onExit={() => nav("/dashboard")}
        />
        </>
      )}
    </MainLayout>
  );
}
