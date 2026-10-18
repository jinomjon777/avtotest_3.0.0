import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { useNavigate } from "react-router-dom";
import { Clock, FileQuestion, Shuffle, EyeOff } from "lucide-react";
import { SEO } from "@/components/SEO";
import { MainLayout } from "@/components/layout/MainLayout";
import { ExamSession } from "@/components/learn/ExamSession";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLearnT } from "@/hooks/useLearnT";
import { EXAM_MINUTES, EXAM_QUESTIONS } from "@/lib/learnTheme";
import { loadAllPool, ResolvedQuestion, shuffle } from "@/lib/questionLookup";

export default function Imtihon() {
  const { user, isLoading } = useAuth();
  const { questionLang } = useLanguage();
  const tl = useLearnT();
  const nav = useNavigate();
  const [qs, setQs] = useState<ResolvedQuestion[] | null>(null);
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (!isLoading && !user) nav("/auth", { replace: true });
  }, [user, isLoading, nav]);

  // Savollar sahifa ochilganda va "Qayta imtihon" bosilganda yangidan tanlanadi
  useEffect(() => {
    if (!user) return;
    let alive = true;
    setQs(null); setStarted(false);
    loadAllPool(questionLang as any)
      .then((pool) => alive && setQs(shuffle(pool).slice(0, EXAM_QUESTIONS)))
      .catch(() => alive && setQs([]));
    return () => { alive = false; };
  }, [user, questionLang, round]);

  const rules = [
    { icon: FileQuestion, text: tl("exam.rule.questions", { n: EXAM_QUESTIONS }) },
    { icon: Clock, text: tl("exam.rule.minutes", { n: EXAM_MINUTES }) },
    { icon: Shuffle, text: tl("exam.rule.random") },
    { icon: EyeOff, text: tl("exam.rule.result") },
  ];

  return (
    <MainLayout>
      <SEO title={tl("exam.title")} description={tl("exam.title")} path="/imtihon" noIndex />
      {started && qs && qs.length > 0 ? (
        <ExamSession key={round} questions={qs} onAgain={() => setRound((r) => r + 1)} onExit={() => nav("/dashboard")} />
      ) : qs && qs.length === 0 ? (
        <div className="max-w-xl mx-auto px-4 py-10">
          <EmptyState icon={FileQuestion} title={tl("practice.empty")} description="" actionLabel={tl("practice.toDashboard")} onAction={() => nav("/dashboard")} />
        </div>
      ) : (
        <div className="max-w-xl mx-auto px-4 py-8">
          <Card className="p-6 md:p-8 border-border">
            <h1 className="text-2xl font-bold text-foreground mb-5">{tl("exam.title")}</h1>
            <ul className="space-y-3 mb-6">
              {rules.map((r) => (
                <li key={r.text} className="flex items-center gap-3 text-foreground">
                  <r.icon className="w-5 h-5 text-primary shrink-0" />{r.text}
                </li>
              ))}
            </ul>
            {qs === null ? (
              <Skeleton className="h-12 rounded-xl" />
            ) : (
              <Button className="w-full h-12 rounded-xl text-base" onClick={() => { trackEvent("exam_start"); setStarted(true); }}>{tl("exam.start")}</Button>
            )}
          </Card>
        </div>
      )}
    </MainLayout>
  );
}
