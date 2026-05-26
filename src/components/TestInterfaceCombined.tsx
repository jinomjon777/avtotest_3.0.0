import { useState, useEffect, useRef, useCallback } from "react";
import { QuestionNavigation } from "./QuestionNavigation";
import { TestResults } from "./TestResults";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getInitialTimeRemaining,
  getInitialStartedAt,
  getSavedTestState,
  clearTestState,
} from "@/lib/testPersistence";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Clock, ChevronLeft, ChevronRight, X, Check, SkipForward } from "lucide-react";
import { ImageLightbox } from "./ImageLightbox";

interface QuestionDataFormat2 {
  id: number;
  question: string;
  choises: Array<{
    text: string;
    answer: boolean;
  }>;
  image?: string;
  media?: { exist: boolean; name: string };
}

interface Question {
  id: number;
  text: string;
  image?: string;
  correctAnswer: number;
  answers: { id: number; text: string }[];
}

interface TestInterfaceCombinedProps {
  onExit: () => void;
  dataSources: string[];
  testName: string;
  questionCount?: number;
  timeLimit?: number;
  randomize?: boolean;
  imagePrefix?: string;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const TestInterfaceCombined = ({ 
  onExit, 
  dataSources,
  testName,
  questionCount = 50,
  timeLimit = 50 * 60,
  randomize = true,
  imagePrefix = "/images/"
}: TestInterfaceCombinedProps) => {
  const { t, questionLang } = useLanguage();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [correctAnswers, setCorrectAnswers] = useState<Record<number, boolean>>({});
  const [revealedQuestions, setRevealedQuestions] = useState<Record<number, boolean>>({});
  const storageKey = `testState_combined_${questionCount}`;
  // Init from endsAt so refresh doesn't reset the timer
  const [timeRemaining, setTimeRemaining] = useState(() =>
    getInitialTimeRemaining(storageKey, timeLimit)
  );
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [showResults, setShowResults] = useState(false);
  // Restored from localStorage so timeTaken stays accurate after refresh
  const [testStartTime] = useState(() => getInitialStartedAt(storageKey));
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  // Increment to restart the timer interval (used by onTryAgain)
  const [timerKey, setTimerKey] = useState(0);

  const autoAdvanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Persist autoAdvance like language setting – survives page refresh
  const [autoAdvance, setAutoAdvance] = useState(() => {
    try { return localStorage.getItem('autoAdvance') === 'true'; } catch { return false; }
  });
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);

  const fetchAndMergeData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data sources in parallel
      const responses = await Promise.all(
        dataSources.map(source => fetch(source).then(res => res.json()))
      );

      // Merge all questions from all sources
      let allQuestions: any[] = [];
      responses.forEach(jsonData => {
        let rawArray: any[] = [];
        if (jsonData.data && Array.isArray(jsonData.data)) {
          rawArray = jsonData.data;
        } else if (Array.isArray(jsonData)) {
          rawArray = jsonData;
        } else if (jsonData.questions && Array.isArray(jsonData.questions)) {
          rawArray = jsonData.questions;
        }
        allQuestions = [...allQuestions, ...rawArray];
      });

      if (allQuestions.length === 0) {
        throw new Error(t("test.noQuestionsFound"));
      }

      // Randomize and take required count
      const selectedQuestions = randomize
        ? shuffleArray(allQuestions).slice(0, questionCount)
        : allQuestions.slice(0, questionCount);

      // Transform to Question format
      const transformedQuestions: Question[] = selectedQuestions.map((q, idx) => {
        // Format 3: New format (barcha.json)
        if (q.content && (q.content.uz_lat || q.content.uz_cyr || q.content.ru)) {
          const langKey = questionLang === 'oz' ? 'uz_lat' : questionLang === 'uz' ? 'uz_cyr' : 'ru';
          const langContent = q.content[langKey] || q.content.uz_lat || q.content.uz_cyr || q.content.ru;
          const correctOption = langContent.options.find((o: any) => o.is_correct);
          const correctAnswer = correctOption ? correctOption.id : 1;
          let imagePath: string | undefined;
          if (q.media_url?.trim()) {
            imagePath = q.media_url.startsWith('http') ? q.media_url : `${imagePrefix}${q.media_url}`;
          }
          return {
            id: idx + 1,
            text: langContent.text,
            image: imagePath,
            correctAnswer,
            answers: langContent.options.map((o: any) => ({ id: o.id, text: o.text })),
          };
        }

        if (q.choises && Array.isArray(q.choises)) {
          const correctIndex = q.choises.findIndex((c: { answer: boolean }) => c.answer === true);
          let imagePath: string | undefined;
          if (q.media?.exist && q.media?.name) {
            imagePath = `${imagePrefix}${q.media.name}.png`;
          } else if (q.image) {
            imagePath = `${imagePrefix}${q.image}`;
          }
          return {
            id: idx + 1,
            text: q.question,
            image: imagePath,
            correctAnswer: correctIndex + 1,
            answers: q.choises.map((choice: { text: string }, ansIdx: number) => ({
              id: ansIdx + 1,
              text: choice.text,
            })),
          };
        }

        // Fallback for other formats
        return { id: idx + 1, text: q.question || '', image: undefined, correctAnswer: 1, answers: [] };
      });

      // Restore from localStorage – use saved questions to preserve randomisation
      const saved = getSavedTestState(storageKey);
      if (saved?.questions && Array.isArray(saved.questions) && saved.questions.length === questionCount) {
        setQuestions(saved.questions as typeof transformedQuestions);
        setCurrentQuestion(saved.currentQuestion ?? 1);
        setSelectedAnswers((saved.selectedAnswers as Record<number, number>) ?? {});
        setCorrectAnswers((saved.correctAnswers as Record<number, boolean>) ?? {});
        setRevealedQuestions((saved.revealedQuestions as Record<number, boolean>) ?? {});
      } else {
        setQuestions(transformedQuestions);
      }
    } catch (err: any) {
      console.error('Error fetching test data:', err);
      setError(err.message || t("test.errorLoadingData"));
    } finally {
      setLoading(false);
    }
  }, [dataSources, questionCount, randomize, imagePrefix, questionLang, t, storageKey]);

  useEffect(() => {
    fetchAndMergeData();
  }, [fetchAndMergeData]);

  // Timer – restarted whenever timerKey changes (e.g. after onTryAgain)
  useEffect(() => {
    if (showResults) return;
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerKey]);

  // Auto-finish when timer reaches 0
  useEffect(() => {
    if (timeRemaining === 0 && !showResults && !loading && questions.length > 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      clearTestState(storageKey);
      setShowResults(true);
    }
  }, [timeRemaining, showResults, loading, questions.length, storageKey]);

  useEffect(() => {
    return () => {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, []);

  // Persist test state – save full questions array so randomisation is preserved on refresh
  useEffect(() => {
    if (questions.length === 0 || showResults) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        questions,
        currentQuestion,
        selectedAnswers,
        correctAnswers,
        revealedQuestions,
        endsAt: Date.now() + timeRemaining * 1000,
        startedAt: testStartTime,
      }));
    } catch { /* ignore quota errors */ }
  }, [questions, currentQuestion, selectedAnswers, correctAnswers, revealedQuestions, timeRemaining, showResults, storageKey, testStartTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalQuestions = questions.length;
  const question = questions[currentQuestion - 1];
  const isRevealed = revealedQuestions[currentQuestion];
  const selectedAnswer = selectedAnswers[currentQuestion];

  const handleAnswerSelect = (answerId: number) => {
    if (isRevealed) return;
    
    const isCorrect = answerId === question.correctAnswer;
    
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion]: answerId
    }));
    
    setCorrectAnswers(prev => ({
      ...prev,
      [currentQuestion]: isCorrect
    }));
    
    setRevealedQuestions(prev => ({
      ...prev,
      [currentQuestion]: true
    }));

    // Check if this was the last question - auto-submit after brief delay
    const answeredCount = Object.keys(selectedAnswers).length + 1; // +1 for current answer
    if (answeredCount >= totalQuestions) {
      // Clear timer and auto-submit after showing feedback
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
      autoAdvanceTimeoutRef.current = setTimeout(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        clearTestState(storageKey);
        setShowResults(true);
      }, 1500);
      return;
    }

    // Auto-advance (only if enabled)
    if (autoAdvance && currentQuestion < totalQuestions) {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
      autoAdvanceTimeoutRef.current = setTimeout(() => {
        setCurrentQuestion(prev => Math.min(totalQuestions, prev + 1));
      }, 1100);
    }
  };

  const handleSwipe = () => {
    const swipeThreshold = 60;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > swipeThreshold) {
      isSwiping.current = true;
      if (diff > 0 && currentQuestion < totalQuestions) {
        if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current);
        setCurrentQuestion(prev => Math.min(totalQuestions, prev + 1));
      } else if (diff < 0 && currentQuestion > 1) {
        if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current);
        setCurrentQuestion(prev => Math.max(1, prev - 1));
      }
      setTimeout(() => { isSwiping.current = false; }, 100);
    } else {
      isSwiping.current = false;
    }
  };

  const getAnswerState = (answerId: number) => {
    if (!isRevealed || !question) return "default";
    if (answerId === question.correctAnswer) return "correct";
    if (answerId === selectedAnswer && answerId !== question.correctAnswer) return "incorrect";
    return "default";
  };

  const handleFinishTest = () => {
    setShowFinishDialog(true);
  };

  const confirmFinishTest = () => {
    setShowFinishDialog(false);
    if (timerRef.current) clearInterval(timerRef.current);
    clearTestState(storageKey);
    setShowResults(true);
  };

  const getTestStats = () => {
    let correct = 0;
    let incorrect = 0;
    
    Object.entries(correctAnswers).forEach(([_, isCorrect]) => {
      if (isCorrect) correct++;
      else incorrect++;
    });
    
    return { correct, incorrect };
  };

  if (showResults) {
    const stats = getTestStats();
    const timeTaken = Math.floor((Date.now() - testStartTime) / 1000);
    
    return (
      <TestResults
        totalQuestions={totalQuestions}
        correctAnswers={stats.correct}
        incorrectAnswers={stats.incorrect}
        timeTaken={timeTaken}
        variant={0}
        onBackToHome={onExit}
        onTryAgain={() => {
          clearTestState(storageKey);
          setSelectedAnswers({});
          setCorrectAnswers({});
          setRevealedQuestions({});
          setCurrentQuestion(1);
          setTimeRemaining(timeLimit);
          setShowResults(false);
          setTimerKey(k => k + 1); // restart timer interval
          fetchAndMergeData();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">{testName} {t("test.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <p className="text-destructive mb-6 text-lg">{error}</p>
          <Button size="lg" onClick={onExit}>{t("test.goBack")}</Button>
        </Card>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <p className="text-muted-foreground mb-6 text-lg">{t("test.noQuestionsFound")}</p>
          <Button size="lg" onClick={onExit}>{t("test.goBack")}</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-card border-b border-border px-3 py-2 md:px-4 md:py-2.5 shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-xs md:text-sm font-medium text-muted-foreground">{testName}</span>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="text-sm md:text-base font-medium">{formatTime(timeRemaining)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className={`h-7 px-2 md:h-8 md:px-3 text-xs ${autoAdvance ? 'bg-primary/10 text-primary border-primary/30' : 'text-muted-foreground'}`}
              onClick={() => setAutoAdvance(prev => {
                const next = !prev;
                try { localStorage.setItem('autoAdvance', String(next)); } catch {}
                return next;
              })}
              title={autoAdvance ? "Avto-o'tish yoqilgan" : "Avto-o'tish o'chirilgan"}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 px-2 md:h-8 md:px-3 text-xs bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/20"
              onClick={handleFinishTest}
            >
              {t("test.finish")}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 px-2 md:h-8 md:px-3 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={onExit}
            >
              {t("test.exit")}
            </Button>
          </div>
        </div>
      </header>

      {/* Question Navigation */}
      <QuestionNavigation
        currentQuestion={currentQuestion}
        totalQuestions={totalQuestions}
        answeredQuestions={selectedAnswers}
        correctAnswers={correctAnswers}
        onQuestionSelect={(num) => {
          if (autoAdvanceTimeoutRef.current) {
            clearTimeout(autoAdvanceTimeoutRef.current);
          }
          setCurrentQuestion(num);
        }}
      />

      {/* Main Content */}
      <main 
        className="flex-1 px-4 py-4 md:px-8 md:py-5 w-full overflow-y-auto"
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; isSwiping.current = false; }}
        onTouchMove={(e) => { if (Math.abs(e.touches[0].clientX - touchStartX.current) > 30) isSwiping.current = true; }}
        onTouchEnd={(e) => { touchEndX.current = e.changedTouches[0].clientX; if (isSwiping.current) { e.preventDefault(); handleSwipe(); } }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-sm md:text-base text-muted-foreground mb-3 font-medium">
          </div>

          <div className="md:flex md:gap-8 md:items-start">
            <div className="md:w-[60%] md:flex-shrink-0">
              <Card className="p-4 md:p-5 bg-card border-border mb-4">
                <p className="text-base md:text-lg font-medium text-foreground leading-relaxed">
                  {question.text}
                </p>
              </Card>

              {question.image && (
                <Card className="md:hidden p-3 bg-card border-border mb-4 overflow-hidden">
                  <button type="button" className="block w-full cursor-zoom-in focus:outline-none" onClick={() => setZoomImage(question.image!)}>
                    <img src={question.image} alt="Question illustration" className="w-full max-w-[300px] h-auto mx-auto object-contain rounded" />
                  </button>
                </Card>
              )}

              <div className="space-y-3">
                {question.answers.map((answer) => {
                  const state = getAnswerState(answer.id);
                  const isSelected = selectedAnswer === answer.id;
                  
                  return (
                    <button
                      key={answer.id}
                      onClick={() => { if (!isSwiping.current) handleAnswerSelect(answer.id); }}
                      disabled={isRevealed}
                      className={`w-full p-3 md:p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-start gap-3 ${
                        state === "correct"
                          ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400"
                          : state === "incorrect"
                          ? "border-destructive bg-destructive/10 text-destructive"
                          : isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 hover:bg-primary/5"
                      } ${isRevealed ? "cursor-default" : "cursor-pointer"}`}
                    >
                      <span className={`w-6 h-6 md:w-7 md:h-7 rounded-full border-2 flex items-center justify-center text-xs md:text-sm font-medium shrink-0 mt-0.5 ${
                        state === "correct"
                          ? "border-green-500 bg-green-500 text-white"
                          : state === "incorrect"
                          ? "border-destructive bg-destructive text-white"
                          : "border-current"
                      }`}>
                        {state === "correct" ? (
                          <Check className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        ) : state === "incorrect" ? (
                          <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        ) : (
                          String.fromCharCode(64 + answer.id)
                        )}
                      </span>
                      <span className="text-sm md:text-base">{answer.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {question.image && (
              <div className="hidden md:block md:w-[40%]">
                <Card className="p-4 bg-card border-border overflow-hidden">
                  <button type="button" className="block w-full cursor-zoom-in focus:outline-none" onClick={() => setZoomImage(question.image!)}>
                    <img src={question.image} alt="Question illustration" className="w-full h-auto object-contain rounded" />
                  </button>
                </Card>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6 gap-4">
            <Button
              variant="outline"
              onClick={() => {
                if (autoAdvanceTimeoutRef.current) {
                  clearTimeout(autoAdvanceTimeoutRef.current);
                }
                setCurrentQuestion(prev => Math.max(1, prev - 1));
              }}
              disabled={currentQuestion === 1}
              className="flex-1 max-w-[140px]"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {t("test.previous")}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (autoAdvanceTimeoutRef.current) {
                  clearTimeout(autoAdvanceTimeoutRef.current);
                }
                setCurrentQuestion(prev => Math.min(totalQuestions, prev + 1));
              }}
              disabled={currentQuestion === totalQuestions}
              className="flex-1 max-w-[140px]"
            >
              {t("test.next")}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </main>

      {/* Finish Dialog */}
      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("test.finishConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("test.finishConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("test.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmFinishTest}>
              {t("test.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ImageLightbox imageUrl={zoomImage} onClose={() => setZoomImage(null)} />
    </div>
  );
};