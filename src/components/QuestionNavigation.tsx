import { useRef, useEffect } from "react";

interface QuestionNavigationProps {
  currentQuestion: number;
  totalQuestions: number;
  answeredQuestions: Record<number, number>;
  correctAnswers: Record<number, boolean>;
  onQuestionSelect: (questionNumber: number) => void;
}

export const QuestionNavigation = ({ 
  currentQuestion, 
  totalQuestions,
  answeredQuestions,
  correctAnswers,
  onQuestionSelect 
}: QuestionNavigationProps) => {
  const questions = Array.from({ length: totalQuestions }, (_, i) => i + 1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const activeButton = activeRef.current;
      const containerRect = container.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      
      const scrollLeft = buttonRect.left - containerRect.left - containerRect.width / 2 + buttonRect.width / 2 + container.scrollLeft;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [currentQuestion]);

  const getButtonStyles = (questionNum: number) => {
    const isActive = currentQuestion === questionNum;
    const isAnswered = answeredQuestions[questionNum] !== undefined;
    const isCorrect = correctAnswers[questionNum];
    
    if (isActive) {
      return "bg-[hsl(250_70%_56%)] text-white shadow-md shadow-[hsl(250_70%_56%/0.3)] scale-110";
    }
    
    if (isAnswered) {
      if (isCorrect === true) {
        return "bg-[hsl(160_60%_45%)] text-white border-[hsl(160_60%_45%)]";
      } else if (isCorrect === false) {
        return "bg-[hsl(0_72%_55%)] text-white border-[hsl(0_72%_55%)]";
      }
    }
    
    return "bg-muted/50 text-muted-foreground hover:bg-[hsl(250_70%_56%/0.1)] border border-border";
  };

  return (
    <div className="bg-card/80 backdrop-blur-sm border-b border-border py-2.5 md:py-3 shrink-0">
      <div 
        ref={scrollRef}
        className="max-w-5xl mx-auto px-3 md:px-4 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex gap-2 md:gap-2.5 pb-0.5 min-w-max">
          {questions.map((questionNum) => {
            const isActive = currentQuestion === questionNum;
            
            return (
              <button
                key={questionNum}
                ref={isActive ? activeRef : null}
                onClick={() => onQuestionSelect(questionNum)}
                className={`
                  w-9 h-9 md:w-10 md:h-10 text-xs md:text-sm font-semibold rounded-full transition-all duration-200
                  flex items-center justify-center
                  ${getButtonStyles(questionNum)}
                `}
              >
                {questionNum}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
