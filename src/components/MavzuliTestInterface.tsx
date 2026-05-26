import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { QuestionNavigation } from "./QuestionNavigation";
import { TestResults } from "./TestResults";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTestResults } from "@/hooks/useTestResults";
import {
  getInitialTimeRemaining,
  getInitialStartedAt,
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
import { Clock, ChevronLeft, ChevronRight, X, Check, Maximize, Minimize, SkipForward } from "lucide-react";
import { ImageLightbox } from "./ImageLightbox";

interface QuestionData {
  id?: number;
  bilet_id?: number;
  question_id?: number;
  name?: string | null;
  question: {
    oz?: string;
    uz?: string;
    ru?: string;
  };
  photo?: string | null;
  image?: string | null;
  answers: {
    status: number;
    answer_id?: number;
    answer: {
      oz?: string[];
      uz?: string[];
      ru?: string[];
    };
  };
}

interface Question {
  id: number;
  text: string;
  image?: string;
  correctAnswer: number;
  answers: { id: number; text: string }[];
}

interface MavzuliTestInterfaceProps {
  onExit: () => void;
  topicId: string;
  topicName: string;
  sessionId?: string | null;
  isPremiumSession?: boolean;
}

export const MavzuliTestInterface = ({ onExit, topicId, topicName, sessionId = null, isPremiumSession = false }: MavzuliTestInterfaceProps) => {
  const { t, questionLang } = useLanguage();
  const { user } = useAuth();
  const { saveTestResult } = useTestResults();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // storageKey must be defined first – used in lazy state initialisers below
  const storageKey = `testState_mavzuli_${topicId}`;
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [correctAnswers, setCorrectAnswers] = useState<Record<number, boolean>>({});
  const [revealedQuestions, setRevealedQuestions] = useState<Record<number, boolean>>({});
  // Init from endsAt so refresh doesn't reset the timer
  const [timeRemaining, setTimeRemaining] = useState(() =>
    getInitialTimeRemaining(storageKey, 60 * 60)
  );
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [showResults, setShowResults] = useState(false);
  // Restored from localStorage so timeTaken stays accurate after refresh
  const [testStartTime] = useState(() => getInitialStartedAt(storageKey));
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const autoAdvanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Persist autoAdvance like language setting – survives page refresh
  const [autoAdvance, setAutoAdvance] = useState(() => {
    try { return localStorage.getItem('autoAdvance') === 'true'; } catch { return false; }
  });
  // Increment to restart the timer interval (used by onTryAgain)
  const [timerKey, setTimerKey] = useState(0);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);

  // Fullscreen handlers
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Fetch test data from JSON file
  useEffect(() => {
    const fetchTestData = async () => {
      let parsedQuestions: Question[] = [];
      try {
        setLoading(true);
        setError(null);
        
        // Map topic id to filename - handle special cases
        let filename = `${topicId}.json`;
        if (topicId === '34') {
          filename = '34tengaxamiyatli.json';
        }
        
        const response = await fetch(`/mavzuli2/${filename}`);
        
        if (!response.ok) {
          throw new Error(t("test.errorLoadingData"));
        }
        
        const jsonData = await response.json();
        
        // New format: array of tasks with content.uz_lat/uz_cyr/ru structure
        if (Array.isArray(jsonData) && jsonData.length > 0 && jsonData[0].content) {
          const contentKey = questionLang === 'oz' ? 'uz_lat' : questionLang === 'uz' ? 'uz_cyr' : 'ru';
          const tQuestions: Question[] = jsonData.map((task: any, idx: number) => {
            const langContent = task.content[contentKey] || task.content.uz_lat || task.content.uz_cyr || task.content.ru;
            if (!langContent || !langContent.options?.length) {
              return {
                id: idx + 1,
                text: "",
                answers: [],
                correctAnswer: 1,
              };
            }
            const correctOption = langContent.options.find((o: any) => o.is_correct);
            const correctAnswer = correctOption ? correctOption.id : langContent.options[0].id;
            let image: string | undefined;
            if (task.media_url?.trim()) {
              const path = task.media_url.replace(/^\//, "");
              image = "/images/" + path;
            }
            return {
              id: idx + 1,
              text: langContent.text || "",
              image,
              correctAnswer,
              answers: langContent.options.map((o: any) => ({ id: o.id, text: o.text })),
            };
          });
          parsedQuestions = tQuestions;
        } else {
          // Old format fallback
          let questionsArray: QuestionData[] = [];
          if (jsonData.data && Array.isArray(jsonData.data)) {
            questionsArray = jsonData.data;
          } else if (Array.isArray(jsonData)) {
            questionsArray = jsonData;
          } else if (jsonData.questions && Array.isArray(jsonData.questions)) {
            questionsArray = jsonData.questions;
          }
          
          if (questionsArray.length === 0) {
            throw new Error(t("test.noQuestionsFound"));
          }

          const tQuestions: Question[] = questionsArray.map((q, idx) => {
            const answerLang = questionLang as 'oz' | 'uz' | 'ru';
            const answers = q.answers.answer[answerLang] || q.answers.answer.uz || q.answers.answer.oz || [];
            const questionText = q.question[answerLang] || q.question.uz || q.question.oz || '';
            const photoField = q.photo || q.image;
            
            return {
              id: idx + 1,
              text: questionText,
              image: photoField ? `/images/${photoField}` : undefined,
              correctAnswer: q.answers.status,
              answers: answers.map((answerText, ansIdx) => ({
                id: ansIdx + 1,
                text: answerText,
              })),
            };
          });
          parsedQuestions = tQuestions;
        }

        setQuestions(parsedQuestions);

        // Restore in-progress test state from localStorage
        try {
          const savedRaw = localStorage.getItem(storageKey);
          if (savedRaw) {
            const parsed = JSON.parse(savedRaw);
            if (parsed && parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length === parsedQuestions.length) {
              setCurrentQuestion(parsed.currentQuestion || 1);
              setSelectedAnswers(parsed.selectedAnswers || {});
              setCorrectAnswers(parsed.correctAnswers || {});
              setRevealedQuestions(parsed.revealedQuestions || {});
              // timeRemaining already initialised from endsAt via useState lazy init
              // Do NOT restore showResults here – finished tests are cleared from storage
            }
          }
        } catch (e) {
          console.warn('Error restoring test state:', e);
        }
      } catch (err: any) {
        console.error('Error fetching test data:', err);
        setError(err.message || t("test.errorLoadingData"));
      } finally {
        setLoading(false);
      }
    };

    fetchTestData();
  }, [topicId, questionLang, t]);

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
      exitFullscreen();
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

  // Persist test state – skip when finished so cleared state isn't restored on refresh
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
    } catch {
      // ignore quota errors
    }
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
    exitFullscreen();

    // Save result before showing results screen
    let correct = 0;
    Object.values(correctAnswers).forEach(isCorrect => { if (isCorrect) correct++; });
    const timeTaken = Math.floor((Date.now() - testStartTime) / 1000);
    saveTestResult(
      parseInt(topicId, 10) || 0,
      correct,
      questions.length,
      timeTaken,
      sessionId,
      isPremiumSession,
    );

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

  // Show results screen
  if (showResults) {
    const stats = getTestStats();
    const timeTaken = Math.floor((Date.now() - testStartTime) / 1000);
    exitFullscreen();
    
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
          setTimeRemaining(60 * 60);
          setShowResults(false);
          setTimerKey(k => k + 1); // restart timer interval
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">{topicName} {t("test.loading")}</p>
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
            <span className="text-xs md:text-sm font-medium text-muted-foreground line-clamp-1">{topicName}</span>
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
              className="h-7 px-2 md:h-8 md:px-3 text-xs"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
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

      <main 
        className="flex-1 px-4 py-4 md:px-8 md:py-5 w-full overflow-y-auto"
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; isSwiping.current = false; }}
        onTouchMove={(e) => { if (Math.abs(e.touches[0].clientX - touchStartX.current) > 30) isSwiping.current = true; }}
        onTouchEnd={(e) => { touchEndX.current = e.changedTouches[0].clientX; if (isSwiping.current) { e.preventDefault(); handleSwipe(); } }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-sm md:text-base text-muted-foreground mb-3 font-medium">
            {t("test.question")} {currentQuestion} / {totalQuestions}
          </div>

          {/* Desktop: 60/40 split layout */}
          <div className="md:flex md:gap-8 md:items-start">
            {/* Left Column: Question + Answers (60%) */}
            <div className="md:w-[60%] md:flex-shrink-0">
              {/* Question Text */}
              <Card className="p-4 md:p-5 bg-card border-border mb-4">
                <p className="text-base md:text-lg font-medium text-foreground leading-relaxed">
                  {question.text}
                </p>
              </Card>

              {/* Mobile Only: Question Image - bosilsa kattalashadi */}
              {question.image && (
                <Card className="md:hidden p-3 bg-card border-border mb-4 overflow-hidden">
                  <button type="button" className="block w-full cursor-zoom-in focus:outline-none" onClick={() => setZoomImage(question.image!)}>
                    <img src={question.image} alt="Question illustration" className="w-full max-w-[300px] h-auto mx-auto object-contain rounded" />
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
                        w-full p-4 md:p-4 rounded-lg border text-left transition-all duration-200
                        flex items-center gap-4
                        ${state === "correct" 
                          ? "border-transparent bg-green-500 text-white" 
                          : state === "incorrect"
                          ? "border-transparent bg-red-400 text-white"
                          : isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card hover:bg-muted/50 text-foreground"
                        }
                      `}
                    >
                      <div className={`
                        w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0
                        ${state === "correct"
                          ? "bg-white/20"
                          : state === "incorrect"
                          ? "bg-white/20"
                          : "border-2 border-muted-foreground/50"
                        }
                      `}>
                        {state === "correct" ? (
                          <Check className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        ) : state === "incorrect" ? (
                          <X className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        ) : null}
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
                  <button type="button" className="block w-full cursor-zoom-in focus:outline-none" onClick={() => setZoomImage(question.image!)}>
                    <img src={question.image} alt="Question illustration" className="w-full h-auto object-contain rounded max-h-[60vh]" />
                  </button>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <footer className="bg-card border-t border-border px-3 py-2.5 md:px-4 md:py-3 shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="default"
            className="h-9 px-3 md:h-10 md:px-4 text-sm"
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
            <span className="font-medium text-primary">{Object.keys(selectedAnswers).length}</span>
            <span> / {totalQuestions}</span>
          </div>

          <Button
            size="default"
            className="h-9 px-3 md:h-10 md:px-4 text-sm"
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
            <AlertDialogCancel className="h-11">{t("test.cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              className="h-11 bg-green-500 hover:bg-green-600"
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
