import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { QuestionNavigation } from "./QuestionNavigation";
import { TestResults } from "./TestResults";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTestResults } from "@/hooks/useTestResults";
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
import { fetchQuestionSource } from "@/lib/fetchQuestionSource";

// Format 1: Original format with nested question/answers objects
interface QuestionDataFormat1 {
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

// Format 2: Simple format with choises array (700baza.json / 700baza2.json)
interface QuestionDataFormat2 {
  id: number;
  question: string;
  choises: Array<{
    text: string;
    answer: boolean;
  }>;
  image?: string;
}

// Format 3: New format (barcha.json)
interface QuestionDataFormat3 {
  task_info?: { global_id?: string; ticket_num?: number; order?: number };
  media_url?: string;
  content: {
    uz_lat?: { text: string; options: { id: number; text: string; is_correct: boolean }[] };
    uz_cyr?: { text: string; options: { id: number; text: string; is_correct: boolean }[] };
    ru?: { text: string; options: { id: number; text: string; is_correct: boolean }[] };
  };
}

interface Question {
  id: number;
  text: string;
  image?: string;
  correctAnswer: number;
  answers: { id: number; text: string }[];
}

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

// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
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
  const { t, questionLang } = useLanguage();
  const { user } = useAuth();
  const { saveTestResult } = useTestResults();
  const navigate = useNavigate();
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
        
        const response = await fetchQuestionSource(dataSource);
        
        if (!response.ok) {
          throw new Error(t("test.errorLoadingData"));
        }
        
        const jsonData = await response.json();
        
        // Handle different JSON structures
        let rawArray: any[] = [];
        if (jsonData.data && Array.isArray(jsonData.data)) {
          rawArray = jsonData.data;
        } else if (Array.isArray(jsonData)) {
          rawArray = jsonData;
        } else if (jsonData.questions && Array.isArray(jsonData.questions)) {
          rawArray = jsonData.questions;
        }
        
        if (rawArray.length === 0) {
          throw new Error(t("test.noQuestionsFound"));
        }

        // Randomize if needed and take only required count
        let selectedQuestions = randomize 
          ? shuffleArray(rawArray).slice(0, questionCount)
          : rawArray.slice(0, questionCount);

        // Transform JSON data to our Question format
        const transformedQuestions: Question[] = selectedQuestions.map((q, idx) => {
          // Format 3: New format (barcha.json) - check for content.uz_lat/uz_cyr/ru
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
          
          // Format 2: Simple format with choises array (700baza.json / 700baza2.json)
          if (q.choises && Array.isArray(q.choises)) {
            const correctIndex = q.choises.findIndex((c: { answer: boolean }) => c.answer === true);
            // Handle media field: { exist: true, name: "1" } -> "/images/1.png"
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
              correctAnswer: correctIndex + 1, // 1-indexed
              answers: q.choises.map((choice: { text: string }, ansIdx: number) => ({
                id: ansIdx + 1,
                text: choice.text,
              })),
            };
          }
          
          // Format 1: Original format with nested question/answers objects
          const typedQ = q as QuestionDataFormat1;
          const answerLang = questionLang as 'oz' | 'uz' | 'ru';
          const questionObj = typedQ.question;
          const answers = typedQ.answers?.answer?.[answerLang] || typedQ.answers?.answer?.uz || typedQ.answers?.answer?.oz || [];
          const questionText = typeof questionObj === 'string' ? questionObj : (questionObj?.[answerLang] || questionObj?.uz || questionObj?.oz || '');
          const photoField = typedQ.photo || typedQ.image;
          
          return {
            id: idx + 1,
            text: questionText,
            image: photoField ? `${imagePrefix}${photoField}` : undefined,
            correctAnswer: typedQ.answers?.status || 1,
            answers: answers.map((answerText, ansIdx) => ({
              id: ansIdx + 1,
              text: answerText,
            })),
          };
        });

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
      } catch (err: any) {
        console.error('Error fetching test data:', err);
        setError(err.message || t("test.errorLoadingData"));
      } finally {
        setLoading(false);
      }
    };

    fetchTestData();
  }, [dataSource, questionLang, t, questionCount, randomize, imagePrefix]);

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

  const getTestStats = () => {
    let correct = 0;
    let incorrect = 0;
    
    Object.entries(correctAnswers).forEach(([_, isCorrect]) => {
      if (isCorrect) correct++;
      else incorrect++;
    });
    
    return { correct, incorrect };
  };

  // Save result when showing results — uses backend RPC which re-validates access
  useEffect(() => {
    if (showResults && user && !resultSaved && variant > 0) {
      const stats = getTestStats();
      const timeTaken = Math.floor((Date.now() - testStartTime) / 1000);
      // Pass sessionId + isPremiumSession so backend enforces access at submit time
      saveTestResult(variant, stats.correct, totalQuestions, timeTaken, sessionId, isPremiumSession);
      setResultSaved(true);
    }
  }, [showResults, user, resultSaved, variant]);

  // Show results screen
  if (showResults) {
    const stats = getTestStats();
    const timeTaken = Math.floor((Date.now() - testStartTime) / 1000);
    
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
          fetchQuestionSource(dataSource)
            .then(res => res.json())
            .then(jsonData => {
              let rawArray: any[] = [];
              if (jsonData.data && Array.isArray(jsonData.data)) {
                rawArray = jsonData.data;
              } else if (Array.isArray(jsonData)) {
                rawArray = jsonData;
              } else if (jsonData.questions && Array.isArray(jsonData.questions)) {
                rawArray = jsonData.questions;
              }
              
              let selectedQuestions = randomize 
                ? shuffleArray(rawArray).slice(0, questionCount)
                : rawArray.slice(0, questionCount);

              const transformedQuestions: Question[] = selectedQuestions.map((q, idx) => {
                // Format 3: barcha.json
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
                
                const typedQ = q as QuestionDataFormat1;
                const answerLang = questionLang as 'oz' | 'uz' | 'ru';
                const questionObj = typedQ.question;
                const answers = typedQ.answers?.answer?.[answerLang] || typedQ.answers?.answer?.uz || typedQ.answers?.answer?.oz || [];
                const questionText = typeof questionObj === 'string' ? questionObj : (questionObj?.[answerLang] || questionObj?.uz || questionObj?.oz || '');
                const photoField = typedQ.photo || typedQ.image;
                
                return {
                  id: idx + 1,
                  text: questionText,
                  image: photoField ? `${imagePrefix}${photoField}` : undefined,
                  correctAnswer: typedQ.answers?.status || 1,
                  answers: answers.map((answerText, ansIdx) => ({
                    id: ansIdx + 1,
                    text: answerText,
                  })),
                };
              });
              setQuestions(transformedQuestions);
              setLoading(false);
            })
            .catch(() => setLoading(false));
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

      {/* Main Content */}
      <main 
        className="flex-1 px-4 py-4 md:px-8 md:py-5 w-full overflow-y-auto"
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