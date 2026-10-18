import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MeterBar } from "@/components/ui/meter-bar";
import { ImageLightbox } from "@/components/ImageLightbox";
import { useAuth } from "@/contexts/AuthContext";
import { useLearnT } from "@/hooks/useLearnT";
import { useTestResults } from "@/hooks/useTestResults";
import { buildAnswerPayload } from "@/lib/answerTracking";
import { EXAM_MINUTES, EXAM_VARIANT, formatDuration, toneFor } from "@/lib/learnTheme";
import type { ResolvedQuestion } from "@/lib/questionLookup";

interface Props {
  questions: ResolvedQuestion[];
  onAgain: () => void;
  onExit: () => void;
}

/** Real imtihon: taymer, javoblar yakunda ko'rsatiladi (darhol tekshiruv yo'q), natija variant=98 bilan saqlanadi. */
export function ExamSession({ questions, onAgain, onExit }: Props) {
  const tl = useLearnT();
  const nav = useNavigate();
  const { user } = useAuth();
  const { saveTestResult } = useTestResults();

  const total = questions.length;
  const limit = EXAM_MINUTES * 60;
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [left, setLeft] = useState(limit);
  const [finished, setFinished] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [zoom, setZoom] = useState<string | null>(null);
  const endAt = useRef(Date.now() + limit * 1000);
  const usedSeconds = useRef(0);
  const saved = useRef(false);

  const finish = useCallback((byTimer = false) => {
    usedSeconds.current = Math.min(limit, Math.round((Date.now() - (endAt.current - limit * 1000)) / 1000));
    setTimeUp(byTimer);
    setConfirm(false);
    setFinished(true);
  }, [limit]);

  useEffect(() => {
    if (finished) return;
    const id = setInterval(() => {
      const rem = Math.max(0, Math.round((endAt.current - Date.now()) / 1000));
      setLeft(rem);
      if (rem <= 0) finish(true);
    }, 1000);
    return () => clearInterval(id);
  }, [finished, finish]);

  const correctMap = useMemo(() => {
    const m: Record<number, boolean> = {};
    for (const [n, id] of Object.entries(picked)) m[Number(n)] = questions[Number(n) - 1].correctId === id;
    return m;
  }, [picked, questions]);
  const correct = Object.values(correctMap).filter(Boolean).length;
  const answered = Object.keys(picked).length;

  useEffect(() => {
    if (!finished || saved.current || !user) return;
    saved.current = true;
    const adapt = questions.map((x) => ({ qkey: x.key, answers: x.options }));
    buildAnswerPayload(adapt, picked, correctMap, correct).then((answers) =>
      saveTestResult(EXAM_VARIANT, correct, total, usedSeconds.current, null, false, answers),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  if (finished) {
    const pct = total ? Math.round((correct / total) * 100) : 0;
    const wrong = answered - correct;
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <Card className="p-6 md:p-8 border-border text-center">
          {timeUp && <p className="text-sm text-destructive mb-1">{tl("exam.timeUp")}</p>}
          <h1 className="text-xl font-bold text-foreground mb-4">{tl("exam.result")}</h1>
          <div className="text-5xl font-bold text-foreground">{correct} / {total}</div>
          <div className="text-lg font-semibold text-muted-foreground mb-4">{pct}%</div>
          <MeterBar value={pct} tone={toneFor(pct)} className="mb-5" />
          <div className="text-sm text-muted-foreground space-y-0.5 mb-6">
            <div>{tl("exam.correctN", { n: correct })}</div>
            <div>{tl("exam.wrongN", { n: wrong })}</div>
            {total - answered > 0 && <div>{tl("exam.unansweredN", { n: total - answered })}</div>}
            <div>{formatDuration(usedSeconds.current)}</div>
          </div>
          <div className="flex flex-col gap-2">
            <Button className="h-12 rounded-xl" onClick={() => nav("/xatolarim")}>{tl("exam.seeMistakes")}</Button>
            <Button variant="outline" className="h-11 rounded-xl" onClick={onAgain}>{tl("exam.again")}</Button>
            <Button variant="outline" className="h-11 rounded-xl" onClick={() => nav("/zaif-mavzular")}>{tl("exam.practiceWeak")}</Button>
            <Button variant="ghost" className="h-11 rounded-xl" onClick={onExit}>{tl("practice.toDashboard")}</Button>
          </div>
        </Card>
      </div>
    );
  }

  const q = questions[idx];
  const chosen = picked[idx + 1];
  const low = left <= 60;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 md:py-8 pb-40 lg:pb-28">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-foreground">{idx + 1} / {total}</span>
        <span className={`inline-flex items-center gap-1.5 text-sm font-bold tabular-nums ${low ? "text-destructive" : "text-foreground"}`}>
          <Clock className="w-4 h-4" />{formatDuration(left)}
        </span>
      </div>
      <MeterBar value={(answered / total) * 100} tone="success" height="sm" className="mb-4" />

      <div className="flex flex-wrap gap-1.5 mb-4">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-label={String(i + 1)}
            className={`w-7 h-7 rounded-md text-xs font-medium border ${i === idx ? "border-primary bg-primary text-primary-foreground" : picked[i + 1] != null ? "border-success/40 bg-success/10 text-foreground" : "border-border text-muted-foreground"}`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <Card className="p-4 md:p-5 border-border mb-4">
        <p className="text-base md:text-lg font-medium text-foreground leading-relaxed">{q.text}</p>
      </Card>
      {q.image && (
        <Card className="p-3 border-border mb-4">
          <button type="button" className="block w-full max-w-sm mx-auto cursor-zoom-in" onClick={() => setZoom(q.image!)}>
            <img src={q.image} alt="" className="w-full max-h-64 object-contain rounded" loading="lazy" />
          </button>
        </Card>
      )}

      <div className="space-y-2.5">
        {q.options.map((o) => {
          const on = chosen === o.id;
          return (
            <button
              key={o.id}
              onClick={() => setPicked((p) => ({ ...p, [idx + 1]: o.id }))}
              className={`w-full flex items-center gap-3 text-left p-3.5 rounded-xl border-2 transition-colors ${on ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"}`}
            >
              <span className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${on ? "bg-primary text-primary-foreground" : "border-2 border-border text-muted-foreground"}`}>
                {on ? <Check className="w-4 h-4" /> : o.id}
              </span>
              <span className="text-sm md:text-base font-medium text-foreground">{o.text}</span>
            </button>
          );
        })}
      </div>

      <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 lg:left-[260px] z-30 bg-card/95 backdrop-blur border-t border-border px-4 py-3 safe-area-bottom">
        <div className="max-w-2xl mx-auto">
          {confirm ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-foreground">{tl("exam.confirmFinish", { n: total - answered })}</span>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => setConfirm(false)}>{tl("exam.confirmNo")}</Button>
                <Button size="sm" onClick={() => finish(false)}>{tl("exam.confirmYes")}</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <Button variant="outline" className="rounded-xl h-11" disabled={idx === 0} onClick={() => setIdx((i) => i - 1)}>
                <ChevronLeft className="w-4 h-4 mr-1" />{tl("practice.prev")}
              </Button>
              <Button variant="ghost" className="rounded-xl h-11" onClick={() => (answered === total ? finish(false) : setConfirm(true))}>
                {tl("exam.finish")}
              </Button>
              <Button className="rounded-xl h-11" disabled={idx === total - 1} onClick={() => setIdx((i) => i + 1)}>
                {tl("practice.next")}<ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
      <ImageLightbox imageUrl={zoom} onClose={() => setZoom(null)} />
    </div>
  );
}
