import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!isLoading && !user) nav("/auth", { replace: true });
  }, [user, isLoading, nav]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    setQs(null);
    buildPractice(mode, questionLang as any, { topic, first })
      .then((r) => alive && setQs(r))
      .catch(() => alive && setQs([]));
    return () => { alive = false; };
  }, [user, mode, topic, first, round, questionLang]);

  const title =
    mode === "topic" ? topicName(topic, LANG[language as keyof typeof LANG] ?? "uz_lat")
    : mode === "mistakes" ? tl("practice.title.mistakes")
    : tl("practice.title.today");

  return (
    <MainLayout>
      <SEO title={title} description="Mashq" path="/mashq" noIndex />
      {qs === null ? (
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
        <PracticeSession
          key={round}
          questions={qs}
          title={title}
          onAgain={() => setRound((r) => r + 1)}
          onExit={() => nav("/dashboard")}
        />
      )}
    </MainLayout>
  );
}
