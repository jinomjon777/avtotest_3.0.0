import { Bookmark, BookmarkCheck, Check, Lightbulb, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLearnT } from "@/hooks/useLearnT";
import type { MistakeItem } from "@/hooks/useLearning";
import type { ResolvedQuestion } from "@/lib/questionLookup";

interface Props {
  item: MistakeItem;
  question?: ResolvedQuestion;
  topicLabel: string;
  isSaved: boolean;
  onToggleSave: () => void;
  onReview?: () => void;
}

/** Bitta xato savol: savol matni, foydalanuvchining javobi va to'g'ri javob. */
export function MistakeCard({ item, question, topicLabel, isSaved, onToggleSave, onReview }: Props) {
  const tl = useLearnT();
  const [open, setOpen] = useState(false);
  const wrongIdx = item.last_wrong_option;

  return (
    <Card className="p-4 border-border">
      <div className="flex items-center justify-between gap-2 mb-2 text-xs text-muted-foreground">
        <span className="truncate">{topicLabel}</span>
        {item.wrong_count > 0 && <span className="shrink-0">{tl("mist.wrongTimes", { n: item.wrong_count })}</span>}
      </div>

      {!question ? (
        <p className="text-sm text-muted-foreground">{tl("mist.notFound")}</p>
      ) : (
        <>
          <p className="text-sm md:text-base font-medium text-foreground leading-relaxed mb-3">{question.text}</p>
          {question.image && <img src={question.image} alt="" loading="lazy" className="max-h-40 object-contain rounded mb-3" />}
          <div className="space-y-2">
            {question.options.map((o, i) => {
              const correct = o.id === question.correctId;
              const mine = !correct && wrongIdx === i;
              if (!correct && !mine) return null;
              return (
                <div key={o.id} className={`flex items-start gap-2 rounded-lg p-2.5 text-sm ${correct ? "bg-success/10" : "bg-destructive/10"}`}>
                  {correct ? <Check className="w-4 h-4 text-success shrink-0 mt-0.5" /> : <X className="w-4 h-4 text-destructive shrink-0 mt-0.5" />}
                  <div>
                    <div className="text-xs text-muted-foreground">{correct ? tl("mist.correctAnswer") : tl("mist.yourAnswer")}</div>
                    <div className="text-foreground">{o.text}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {open && question.explanation && (
            <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3 flex gap-2">
              <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-foreground leading-relaxed">{question.explanation}</p>
            </div>
          )}
        </>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {onReview && question && (
          <Button size="sm" className="rounded-lg" onClick={onReview}>{tl("mist.reviewOne")}</Button>
        )}
        {question?.explanation && (
          <Button size="sm" variant="outline" className="rounded-lg gap-1.5" onClick={() => setOpen((v) => !v)}>
            <Lightbulb className="w-4 h-4" />{tl("mist.explain")}
          </Button>
        )}
        <Button size="sm" variant="ghost" className="rounded-lg gap-1.5" onClick={onToggleSave}>
          {isSaved ? <BookmarkCheck className="w-4 h-4 text-primary" /> : <Bookmark className="w-4 h-4" />}
          {isSaved ? tl("practice.saved") : tl("practice.save")}
        </Button>
      </div>
    </Card>
  );
}
