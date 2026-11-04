import { useState, useEffect, useRef, useCallback } from "react";
import { errorMessage } from "@/lib/utils";
import { QuestionNavigation } from "./QuestionNavigation";
import { TestResults } from "./TestResults";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTestResults } from "@/hooks/useTestResults";
import { buildAnswerPayload } from "@/lib/answerTracking";
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
import { loadQuestions, type NormalizedQuestion, type QuestionLang } from "@/lib/questionFormat";
import { useAppViewportHeight } from "@/hooks/use-app-viewport-height";

type Question = NormalizedQuestion;

interface TestInterfaceBaseProps {
  onExit: () => void;
  dataSource: string;
  testName: string;
  questionCount?: number;
  timeLimit?: number;
  randomize?: boolean;
  imagePrefix?: string;
  variant?: number;
  /** Backend session id returned by start_test_session RPC */
  sessionId?: string | null;
  /** Whether this is a premium session — controls fail-closed save behaviour */
  isPremiumSession?: boolean;
}


export const TestInterfaceBase = ({
  onExit,
  dataSource,
  testName,
  questionCount = 20,
  timeLimit = 25 * 60,
  randomize = false,
  imagePrefix = "/images/",
  variant = 0,
  sessionId = null,
  isPremiumSession = false,
}: TestInterfaceBaseProps) => {
  useAppViewportHeight();
  const footerRef = useRef<HTMLElement>(null);

  // index.html'da SAYTNING BOSHQA SAHIFALARI uchun mobil holatda
  // body/#root/main elementlariga majburiy (!important) pastki
  // bo'shliq (padding-bottom) qo'shib qo'yiladi (pastki navigatsiya
  // uchun joy ochish maqsadida). Bu test ekranida pastdagi
  // "Oldingi/Keyingi" qatori bilan to'qnashib, bo'sh joy/sakrash
  // muammosiga sabab bo'lyapti. Shu sabab test ekrani ochiq
  // turganda <body>ga maxsus klass qo'shib, o'sha bo'shliqni
  // index.css orqali bekor qilamiz (faqat shu sahifada).
  useEffect(() => {
    document.body.classList.add("test-interface-active");
    return () => { document.body.classList.remove("test-interface-active"); };
  }, []);

  // Footer endi position:fixed (viewport pastiga doim mahkamlangan) —
  // shu sabab uning haqiqiy balandligini o'lchab, <main> ostiga xuddi
  // shuncha bo'shliq qo'shamiz, aks holda uzun savol/javob matni
  // footer ostida yashirinib qolardi.
  useEffect(() => {
    const measure = () => {
      if (footerRef.current) {
        const h = footerRef.current.offsetHeight;
        document.documentElement.style.setProperty("--test-footer-clearance", `${h + 16}px`);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const { t, questionLang } = useLanguage();
  const { user } = useAuth();
  const { saveTestResult } = useTestResults();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [correctAnswers, setCorrectAnswers] = useState<Record<number, boolean>>({});
  const [revealedQuestions, setRevealedQuestions] = useState<Record<number, boolean>>({});
  const storageKey = `testState_base_${dataSource}_${questionCount}`;
  // Init from endsAt so refresh doesn't reset the timer
  const [timeRemaining, setTimeRemaining] = useState(() =>
    getInitialTimeRemaining(storageKey, timeLimit)
  );
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [showResults, setShowResults] = useState(false);
  // Restored from localStorage so timeTaken stays accurate after refresh
  const [testStartTime] = useState(() => getInitialStartedAt(storageKey));
  const [resultSaved, setResultSaved] = useState(false);
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

  // Fetch test data from JSON file

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const transformedQuestions = await loadQuestions([dataSource], questionCount, {
          randomize, lang: questionLang as QuestionLang, imagePrefix,
        });
        if (transformedQuestions.length === 0) {
          throw new Error(t("test.noQuestionsFound"));
        }

        // Restore from localStorage – use saved questions to preserve randomisation
        const saved = getSavedTestState(storageKey);
        if (
          saved?.questions &&
          Array.isArray(saved.questions) &&
          saved.questions.length === questionCount
        ) {
          setQuestions(saved.questions as typeof transformedQuestions);
          setCurrentQuestion(saved.currentQuestion ?? 1);
          setSelectedAnswers((saved.selectedAnswers as Record<number, number>) ?? {});
          setCorrectAnswers((saved.correctAnswers as Record<number, boolean>) ?? {});
          setRevealedQuestions((saved.revealedQuestions as Record<number, boolean>) ?? {});
          // timeRemaining already initialised from endsAt via useState lazy init
        } else {
          setQuestions(transformedQuestions);
        }
      } catch (err) {
        console.error('Error fetching test data:', err);
        setError(errorMessage(err) || t("test.errorLoadingData"));
      } finally {
        setLoading(false);
      }
    };

    fetchTestData();
  }, [dataSource, questionLang, t, questionCount, randomize, imagePrefix, storageKey]);

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

  // Cleanup auto-advance timeout on unmount
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

    // Auto-advance to next question (only if enabled)
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

  const getTestStats = useCallback(() => {
    let correct = 0;
    let incorrect = 0;
    
    Object.entries(correctAnswers).forEach(([_, isCorrect]) => {
      if (isCorrect) correct++;
      else incorrect++;
    });
    
    return { correct, incorrect };
  }, [correctAnswers]);

  // timeTaken ni saqlash uchun: testStartTime asosida emas, balki
  // timer qoldig'i asosida hisoblash zarur — chunki startTime
  // o'zgaruvchisi sahifa birinchi ochilganidan boshlab hisoblanadi,
  // lekin foydalanuvchi tab'ni yopib, soatlar o'tib qaytsa,
  // Date.now() - testStartTime juda katta bo'lib qoladi (424:03
  // kabi anomal qiymatlar). Vaqt limiti MINUS qolgan vaqt esa
  // har doim aniq, haqiqiy test vaqtini beradi.
  const getTimeTaken = useCallback(() => Math.max(0, timeLimit - timeRemaining), [timeLimit, timeRemaining]);

  // Save result when showing results — uses backend RPC which re-validates access
  useEffect(() => {
    if (showResults && user && !resultSaved && variant > 0) {
      const stats = getTestStats();
      const timeTaken = getTimeTaken();
      buildAnswerPayload(questions, selectedAnswers, correctAnswers, stats.correct).then((answers) =>
        saveTestResult(variant, stats.correct, totalQuestions, timeTaken, sessionId, isPremiumSession, answers)
      );
      setResultSaved(true);
    }
  // resultSaved — natija faqat bir marta saqlanishini kafolatlaydi (qolgan qiymatlar shu paytdagi holat)
  }, [showResults, user, resultSaved, variant, correctAnswers, getTestStats, getTimeTaken, isPremiumSession, questions, saveTestResult, selectedAnswers, sessionId, totalQuestions]);

  // Show results screen
  if (showResults) {
    const stats = getTestStats();
    const timeTaken = getTimeTaken();
    
    return (
      <TestResults
        totalQuestions={totalQuestions}
        correctAnswers={stats.correct}
        incorrectAnswers={stats.incorrect}
        timeTaken={timeTaken}
        variant={variant}
        onBackToHome={onExit}
        onTryAgain={() => {
          // Reset state and re-fetch to get NEW random questions
          clearTestState(storageKey);
          setSelectedAnswers({});
          setCorrectAnswers({});
          setRevealedQuestions({});
          setCurrentQuestion(1);
          setTimeRemaining(timeLimit);
          setShowResults(false);
          setResultSaved(false);
          setTimerKey(k => k + 1); // restart timer interval
          setLoading(true);
          // Trigger re-fetch by calling fetchTestData again
          loadQuestions([dataSource], questionCount, { randomize, lang: questionLang as QuestionLang, imagePrefix })
            .then((qs) => {
              setQuestions(qs);
              setLoading(false);
            })
            .catch((err: unknown) => {
              setError(err instanceof Error ? err.message : t("test.errorLoadingData"));
              setLoading(false);
            });
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
    <div
      className="bg-background flex flex-col"
      style={{ minHeight: "calc(var(--app-vh, 1vh) * 100)" }}
    >
      <div className="sticky top-0 z-20">
        {/* Header */}
        <header className="bg-card border-b border-border px-3 py-2 md:px-4 md:py-2.5 shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-xs md:text-sm font-medium text-muted-foreground">{testName}</span>
            <div className="flex items-center gap-1.5 text-[hsl(250_70%_56%)]">
              <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="text-sm md:text-base font-semibold">{formatTime(timeRemaining)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className={`h-7 px-2 md:h-8 md:px-3 text-xs rounded-full ${autoAdvance ? 'bg-primary/10 text-primary border-primary/30' : 'text-muted-foreground'}`}
              onClick={() => setAutoAdvance(prev => {
                const next = !prev;
                try { localStorage.setItem('autoAdvance', String(next)); } catch { /* ixtiyoriy: xato e'tiborsiz qoldiriladi */ }
                return next;
              })}
              title={autoAdvance ? "Avto-o'tish yoqilgan" : "Avto-o'tish o'chirilgan"}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 px-2 md:h-8 md:px-3 text-xs rounded-full bg-[hsl(160_60%_45%/0.1)] text-[hsl(160_60%_45%)] border-[hsl(160_60%_45%/0.3)] hover:bg-[hsl(160_60%_45%/0.2)]"
              onClick={handleFinishTest}
            >
              {t("test.finish")}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 px-2 md:h-8 md:px-3 text-xs rounded-full text-destructive border-destructive/30 hover:bg-destructive/10"
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
      </div>

      {/* Main Content */}
      <main 
        className="flex-1 px-4 py-4 md:px-8 md:py-5 w-full"
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; isSwiping.current = false; }}
        onTouchMove={(e) => { if (Math.abs(e.touches[0].clientX - touchStartX.current) > 30) isSwiping.current = true; }}
        onTouchEnd={(e) => { touchEndX.current = e.changedTouches[0].clientX; if (isSwiping.current) { e.preventDefault(); handleSwipe(); } }}
      >
        <div className="max-w-7xl mx-auto">
          <div
            className="text-sm md:text-base text-muted-foreground mb-3 font-medium"
            style={question.image ? undefined : { maxWidth: 672, marginLeft: "auto", marginRight: "auto" }}
          >
            {t("test.question")} {currentQuestion} / {totalQuestions}
          </div>

          {/* Desktop: 60/40 split layout when image exists, centered single column otherwise */}
          <div
            className={question.image ? "md:flex md:gap-8 md:items-start" : ""}
            style={question.image ? undefined : { maxWidth: 672, marginLeft: "auto", marginRight: "auto" }}
          >
            {/* Left Column: Question + Answers (60% with image, full width centered without) */}
            <div className={question.image ? "md:w-[60%] md:flex-shrink-0" : ""}>
              {/* Question Text */}
              <Card className="p-4 md:p-5 bg-card border-border mb-4">
                <p className="text-base md:text-lg font-medium text-foreground leading-relaxed">
                  {question.text}
                </p>
              </Card>

              {/* Mobile Only: Question Image - bosilsa kattalashadi */}
              {question.image && (
                <Card className="md:hidden p-3 bg-card border-border mb-4 overflow-hidden">
                  <button type="button" className="block w-full aspect-[4/3] max-w-[300px] mx-auto cursor-zoom-in focus:outline-none" onClick={() => setZoomImage(question.image!)}>
                    <img src={question.image} alt="Question illustration" className="w-full h-full object-contain rounded" />
                  </button>
                </Card>
              )}

              {/* Answer Options */}
              <div className="space-y-3">
                {question.answers.map((answer) => {
                  const state = getAnswerState(answer.id);
                  const isSelected = selectedAnswer === answer.id;
                  
                  return (
                    <button
                      key={answer.id}
                      onClick={() => { if (!isSwiping.current) handleAnswerSelect(answer.id); }}
                      disabled={isRevealed}
                      className={`
                        w-full p-4 md:p-4 rounded-2xl border-2 text-left transition-all duration-200
                        flex items-center gap-4
                        ${state === "correct" 
                          ? "border-[hsl(160_60%_45%)] bg-[hsl(160_60%_45%/0.1)] text-foreground" 
                          : state === "incorrect"
                          ? "border-[hsl(0_72%_55%)] bg-[hsl(0_72%_55%/0.1)] text-foreground"
                          : isSelected
                          ? "border-primary bg-primary/8 text-primary"
                          : "border-border bg-card hover:bg-[hsl(250_70%_56%/0.04)] hover:border-[hsl(250_70%_56%/0.3)] text-foreground"
                        }
                      `}
                    >
                      <div className={`
                        w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold
                        ${state === "correct"
                          ? "bg-[hsl(160_60%_45%)] text-white"
                          : state === "incorrect"
                          ? "bg-[hsl(0_72%_55%)] text-white"
                          : isSelected
                          ? "bg-primary text-white"
                          : "border-2 border-border text-muted-foreground"
                        }
                      `}>
                        {state === "correct" ? (
                          <Check className="w-4 h-4 md:w-5 md:h-5" />
                        ) : state === "incorrect" ? (
                          <X className="w-4 h-4 md:w-5 md:h-5" />
                        ) : (
                          <span>{answer.id}</span>
                        )}
                      </div>
                      <span className="text-base md:text-base font-medium">{answer.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Image (Desktop only - 40%) - bosilsa kattalashadi */}
            {question.image && (
              <div className="hidden md:block md:w-[40%] md:flex-shrink-0">
                <Card className="p-4 bg-card border-border overflow-hidden sticky top-4">
                  <button type="button" className="block w-full aspect-[4/3] max-h-[60vh] cursor-zoom-in focus:outline-none" onClick={() => setZoomImage(question.image!)}>
                    <img src={question.image} alt="Question illustration" className="w-full h-full object-contain rounded" />
                  </button>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Navigation — viewport pastiga doim mahkamlangan, hech qachon siljimaydi */}
      <footer
        ref={footerRef}
        className="bg-card border-t border-border px-3 py-2.5 md:px-4 md:py-3 fixed bottom-0 left-0 right-0 z-30"
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="default"
            className="h-9 px-3 md:h-10 md:px-4 text-sm rounded-xl"
            disabled={currentQuestion === 1}
            onClick={() => {
              if (autoAdvanceTimeoutRef.current) {
                clearTimeout(autoAdvanceTimeoutRef.current);
              }
              setCurrentQuestion(prev => Math.max(1, prev - 1));
            }}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {t("test.previous")}
          </Button>
          
          <div className="text-xs md:text-sm text-muted-foreground text-center">
            <span className="font-semibold text-primary">{Object.keys(selectedAnswers).length}</span>
            <span> / {totalQuestions}</span>
          </div>

          <Button
            size="default"
            className="h-9 px-3 md:h-10 md:px-4 text-sm rounded-xl bg-primary hover:bg-primary-hover text-white"
            disabled={currentQuestion === totalQuestions}
            onClick={() => {
              if (autoAdvanceTimeoutRef.current) {
                clearTimeout(autoAdvanceTimeoutRef.current);
              }
              setCurrentQuestion(prev => Math.min(totalQuestions, prev + 1));
            }}
          >
            {t("test.next")}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </footer>

      {/* Finish Confirmation Dialog */}
      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">{t("test.finishConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {t("test.finishConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11 rounded-xl">{t("test.cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              className="h-11 rounded-xl bg-[hsl(160_60%_45%)] hover:bg-[hsl(160_60%_38%)]"
              onClick={confirmFinishTest}
            >
              {t("test.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ImageLightbox imageUrl={zoomImage} onClose={() => setZoomImage(null)} />
    </div>
  );
};