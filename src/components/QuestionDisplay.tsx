import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Answer {
  id: string;
  text: string;
  label: string;
}

interface QuestionDisplayProps {
  questionText: string;
  answers: Answer[];
  selectedAnswer: string | null;
  onAnswerSelect: (answerId: string) => void;
}

export const QuestionDisplay = ({ 
  questionText, 
  answers, 
  selectedAnswer, 
  onAnswerSelect 
}: QuestionDisplayProps) => {
  return (
    <div className="flex-1 space-y-6">
      <Card className="p-6 bg-question-bg border-border shadow-sm">
        <h2 className="text-lg font-semibold text-foreground leading-relaxed">
          {questionText}
        </h2>
      </Card>

      <div className="space-y-3">
        {answers.map((answer) => (
          <Button
            key={answer.id}
            variant="outline"
            className={`
              w-full p-4 h-auto text-left justify-start border-border
              hover:bg-answer-hover transition-colors duration-200
              ${selectedAnswer === answer.id 
                ? "border-primary bg-primary/5 text-primary" 
                : "text-foreground"
              }
            `}
            onClick={() => onAnswerSelect(answer.id)}
          >
            <div className="flex items-center gap-3">
              <div className={`
                w-4 h-4 rounded-full border-2 flex items-center justify-center
                ${selectedAnswer === answer.id 
                  ? "border-primary bg-primary" 
                  : "border-muted-foreground"
                }
              `}>
                {selectedAnswer === answer.id && (
                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                )}
              </div>
              <span className="font-medium text-sm">{answer.label}</span>
              <span className="text-sm">{answer.text}</span>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};