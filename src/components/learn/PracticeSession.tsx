import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, BookmarkCheck, Check, ChevronLeft, ChevronRight, Lightbulb, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MeterBar } from "@/components/ui/meter-bar";
import { ImageLightbox } from "@/components/ImageLightbox";
import { useAuth } from "@/contexts/AuthContext";
import { useLearnT } from "@/hooks/useLearnT";
import { useSavedKeys, useToggleSaved } from "@/hooks/useLearning";
import { useTestResults } from "@/hooks/useTestResults";
import { buildAnswerPayload } from "@/lib/answerTracking";
import { formatDuration, PRACTICE_VARIANT, toneFor } from "@/lib/learnTheme";
import type { ResolvedQuestion } from "@/lib/questionLookup";
import { toast } from "@/hooks/use-toast";

interface Props {
  questions: ResolvedQuestion[];
  title: string;
  /** "Yana mashq" tugmasi uchun */
  onAgain: () => void;
  onExit: () => void;
}

/**
 * Yengil mashq sessiyasi: javob darhol tekshiriladi, tushuntirish va "saqlash" bor.
 * Tugagach natija submit_test orqali saqlanadi (variant = 99), javoblar "xatolar" va
 * "zaif mavzular" hisobiga qo'shiladi.
 */
export function PracticeSession({ questions, title, onAgain, onExit }: Props) {
  const tl = useLearnT();
  const nav = useNavigate();
  const { user } = useAuth();
  const { saveTestResult } = useTestResults();
  const toggleSaved = useToggleSaved();
  const { data: savedRows } = useSavedKeys();

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<Record<number, number>>({}); // savol raqami (1..n) -> option id
  const [showIzoh, setShowIzoh] = useState(false);
  const [finished, setFinished] = useState(false);
  const [zoom, setZoom] = useState<string | null>(null);
  const startedAt = useRef(Date.now());
  const saved = useRef(false);

  const [savedLocal, setSavedLocal] = useState<Record<string, boolean>>({});
  const isSaved = (k: string) => savedLocal[k] ?? !!savedRows?.some((r) => r.question_key === k);

  const q = questions[idx];
  const total = questions.length;
  const answeredCount = Object.keys(picked).length;

  const correctMap = useMemo(() => {
    const m: Record<number, boolean> = {};
    for (const [n, id] of Object.entries(picked)) m[Number(n)] = questions[Number(n) - 1].correctId === id;
    return m;
  }, [picked, questions]);
  const correct = Object.values(correctMap).filter(Boolean).length;

  useEffect(() => setShowIzoh(false), [idx]);

  // Tugaganda bir marta saqlash
  useEffect(() => {
    if (!finished || saved.current || !user || answeredCount === 0) return;
    saved.current = true;
    const adapt = questions.map((x) => ({ qkey: x.key, answers: x.options }));
    buildAnswerPayload(adapt, picked, correctMap, correct).then((answers) =>
      saveTestResult(
        PRACTICE_VARIANT,
        correct,
        total,
        Math.floor((Date.now() - startedAt.current) / 1000),
        null,
        false,
        answers,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const choose = (optionId: number) => {
    if (picked[idx + 1] != null) return;
    setPicked((p) => ({ ...p, [idx + 1]: optionId }));
  };

  const onSave = async () => {
    try {
      const r = await toggleSaved(q.key);
      setSavedLocal((s) => ({ ...s, [q.key]: r.saved }));
    } catch (e: any) {
      toast({ title: e?.message === "limit_reached" ? tl("saved.limit") : tl("common.error"), variant: "destructive" });
    }
  };

  if (finished) {
    const pct = total ? Math.round((correct / total) * 100) : 0;
    const tone = toneFor(pct);
    const wrong = answeredCount - correct;
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <Card className="p-6 md:p-8 border-border text-center">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <h1 className="text-2xl font-bold text-foreground mb-5">{tl("practice.done")}</h1>
          <div className="text-5xl font-bold mb-1 text-foreground">{correct} / {total}</div>
          <div className="text-lg font-semibold mb-4 text-muted-foreground">{pct}%</div>
          <MeterBar value={pct} tone={tone} className="mb-5" />
          <div className="grid grid-cols-3 gap-3 text-sm mb-6">
            <div className="rounded-xl bg-success/10 p-3"><div className="font-bold text-success text-lg">{correct}</div>{tl("practice.correct")}</div>
            <div className="rounded-xl bg-destructive/10 p-3"><div className="font-bold text-destructive text-lg">{wrong}</div>{tl("practice.wrong")}</div>
            <div className="rounded-xl bg-muted p-3"><div className="font-bold text-foreground text-lg">{formatDuration(Math.floor((Date.now() - startedAt.current) / 1000))}</div>{tl("practice.time")}</div>
          </div>
          <div className="flex flex-col gap-2">
            {wrong > 0 && (
              <Button className="h-12 rounded-xl" onClick={() => nav("/xatolarim")}>{tl("practice.seeMistakes")}</Button>
            )}
            <Button variant="outline" className="h-11 rounded-xl" onClick={onAgain}>{tl("practice.again")}</Button>
            <Button variant="ghost" className="h-11 rounded-xl" onClick={() => nav("/zaif-mavzular")}>{tl("practice.weakTopics")}</Button>
            <Button variant="ghost" className="h-11 rounded-xl" onClick={onExit}>{tl("practice.toDashboard")}</Button>
          </div>
        </Card>
      </div>
    );
  }

  const chosen = picked[idx + 1];
  const revealed = chosen != null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 md:py-8 pb-40 lg:pb-28">
      <div className="flex items-center justify-between mb-3 gap-3">
        <button onClick={onExit} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <X className="w-4 h-4" /> {tl("practice.exit")}
        </button>
        <span className="text-sm font-medium text-muted-foreground truncate">{title}</span>
        <span className="text-sm font-semibold text-foreground">{idx + 1} / {total}</span>
      </div>
      <MeterBar value={(answeredCount / total) * 100} tone="success" height="sm" className="mb-4" />

      <Card className="p-4 md:p-5 border-border mb-4">
        <p className="text-base md:text-lg font-medium text-foreground leading-relaxed">{q.text}</p>
      </Card>

      {q.image && (
        <Card className="p-3 border-border mb-4 overflow-hidden">
          <button type="button" className="block w-full max-w-sm mx-auto cursor-zoom-in" onClick={() => setZoom(q.image!)}>
            <img src={q.image} alt="" className="w-full max-h-64 object-contain rounded" loading="lazy" />
          </button>
        </Card>
      )}

      <div className="space-y-2.5">
        {q.options.map((o) => {
          const isCorrect = o.id === q.correctId;
          const isChosen = o.id === chosen;
          const state = !revealed ? "idle" : isCorrect ? "correct" : isChosen ? "wrong" : "idle";
          return (
            <button
              key={o.id}
              disabled={revealed}
              onClick={() => choose(o.id)}
              className={[
                "w-full flex items-center gap-3 text-left p-3.5 rounded-xl border-2 transition-colors",
                state === "correct" ? "border-success bg-success/10" : state === "wrong" ? "border-destructive bg-destructive/10" : "border-border bg-card hover:border-primary/40",
              ].join(" ")}
            >
              <span className={[
                "w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold",
                state === "correct" ? "bg-success text-white" : state === "wrong" ? "bg-destructive text-white" : "border-2 border-border text-muted-foreground",
              ].join(" ")}>
                {state === "correct" ? <Check className="w-4 h-4" /> : state === "wrong" ? <X className="w-4 h-4" /> : o.id}
              </span>
              <span className="text-sm md:text-base font-medium text-foreground">{o.text}</span>
            </button>
          );
        })}
      </div>

      {showIzoh && q.explanation && (
        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3.5 flex gap-2.5">
          <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-foreground leading-relaxed">{q.explanation}</p>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        {q.explanation && (
          <Button variant={showIzoh ? "default" : "outline"} size="sm" className="rounded-lg gap-1.5" onClick={() => setShowIzoh((v) => !v)}>
            <Lightbulb className="w-4 h-4" /> {tl("practice.explain")}
          </Button>
        )}
        <Button variant="outline" size="sm" className="rounded-lg gap-1.5" onClick={onSave}>
          {isSaved(q.key) ? <BookmarkCheck className="w-4 h-4 text-primary" /> : <Bookmark className="w-4 h-4" />}
          {isSaved(q.key) ? tl("practice.saved") : tl("practice.save")}
        </Button>
      </div>

      <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 lg:left-[260px] z-30 bg-card/95 backdrop-blur border-t border-border px-4 py-3 safe-area-bottom">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <Button variant="outline" className="rounded-xl h-11" disabled={idx === 0} onClick={() => setIdx((i) => i - 1)}>
            <ChevronLeft className="w-4 h-4 mr-1" />{tl("practice.prev")}
          </Button>
          {idx < total - 1 ? (
            <Button className="rounded-xl h-11 min-w-[120px]" onClick={() => setIdx((i) => i + 1)}>
              {tl("practice.next")}<ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button className="rounded-xl h-11 min-w-[120px]" disabled={answeredCount === 0} onClick={() => setFinished(true)}>
              {tl("practice.finish")}
            </Button>
          )}
        </div>
      </div>
      <ImageLightbox imageUrl={zoom} onClose={() => setZoom(null)} />
    </div>
  );
}
