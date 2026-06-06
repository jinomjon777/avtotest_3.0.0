import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAccessState } from "@/hooks/useAccessState";
import { useTestSession } from "@/hooks/useTestSession";
import { useLanguage } from "@/contexts/LanguageContext";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import {
  Home,
  Play,
  Clock,
  HelpCircle,
  CheckCircle,
  Crown,
  Loader2,
  AlertTriangle,
  ServerCrash
} from "lucide-react";
import { TestInterfaceBase } from "@/components/TestInterfaceBase";
import { TestInterfaceCombined } from "@/components/TestInterfaceCombined";

const languages = [
  { id: "uz-lat" as const, label: "Lotin", file: "700baza2.json", proFile: "barcha.json" },
  { id: "uz" as const, label: "Кирилл", file: "700baza.json", proFile: "barcha.json" },
  { id: "ru" as const, label: "Русский", file: "700baza.json", proFile: "barcha.json" },
];

const FREE_VARIANT = 99;

export default function TestIshlash() {
  const testIshlashStorageKey = 'testIshlash_activeTest';

  const getInitialState = () => {
    try {
      const saved = localStorage.getItem(testIshlashStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.testStarted && parsed.activeSession) {
          const testStateKey: string | undefined = parsed.activeSession.testStateKey;
          if (testStateKey && !localStorage.getItem(testStateKey)) {
            localStorage.removeItem(testIshlashStorageKey);
            return { testStarted: false, activeSession: null, questionCount: 20 as 20 | 50 };
          }
          return {
            testStarted: true,
            activeSession: parsed.activeSession,
            questionCount: (parsed.questionCount || 20) as 20 | 50,
          };
        }
      }
    } catch (e) { /* ignore */ }
    return { testStarted: false, activeSession: null, questionCount: 20 as 20 | 50 };
  };

  const initial = getInitialState();
  const [testStarted, setTestStarted] = useState(initial.testStarted);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<{ sessionId: string | null; isPremium: boolean; testStateKey?: string; dataFile?: string } | null>(initial.activeSession);
  const [questionCount, setQuestionCount] = useState<20 | 50>(initial.questionCount as 20 | 50);

  useEffect(() => {
    try {
      if (testStarted && activeSession) {
        localStorage.setItem(testIshlashStorageKey, JSON.stringify({ testStarted, activeSession, questionCount }));
      } else {
        localStorage.removeItem(testIshlashStorageKey);
      }
    } catch (e) { /* ignore */ }
  }, [testStarted, activeSession, questionCount]);

  const { language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const { state: accessState, isPremium, loading: accessLoading, backendConfirmed } = useAccessState();
  const { starting, startSession } = useTestSession();

  const langConfig = languages.find(l => l.id === language);
  const dataFile = isPremium
    ? (langConfig?.proFile || "barcha.json")
    : (langConfig?.file || "700baza2.json");

  const showProBanner = !isPremium &&
    accessState !== 'active_pro' && accessState !== 'active_trial';

  const handleStart = async () => {
    setSessionError(null);
    const testStateKey = questionCount === 50
      ? `testState_combined_${questionCount}`
      : `testState_base_/${dataFile}_${questionCount}`;

    if (isPremium) {
      if (!backendConfirmed) {
        setSessionError('Serverga ulanib bo\'lmadi. Iltimos, sahifani yangilang.');
        return;
      }
      const result = await startSession({
        variant: user ? FREE_VARIANT : 0,
        questionSource: dataFile,
        isPremium: true,
      });
      if (!result.ok) {
        if (result.error === 'no_premium_access') {
          setSessionError('Bu test uchun PREMIUM obuna kerak.');
        } else if (result.error === 'not_authenticated') {
          setSessionError('Iltimos, avval tizimga kiring.');
        } else {
          setSessionError('Serverga ulanishda xatolik. Qayta urinib ko\'ring.');
        }
        return;
      }
      setActiveSession({ sessionId: result.session?.sessionId ?? null, isPremium: true, testStateKey, dataFile });
    } else {
      if (user && backendConfirmed) {
        const result = await startSession({
          variant: FREE_VARIANT,
          questionSource: dataFile,
          isPremium: false,
        });
        setActiveSession({
          sessionId: result.ok ? (result.session?.sessionId ?? null) : null,
          isPremium: false,
          testStateKey,
          dataFile,
        });
      } else {
        setActiveSession({ sessionId: null, isPremium: false, testStateKey, dataFile });
      }
    }
    setTestStarted(true);
  };

  const effectiveDataFile = (testStarted && activeSession) ? (activeSession.dataFile ?? dataFile) : dataFile;
  const dataSources = useMemo(() => [`/${effectiveDataFile}`], [effectiveDataFile]);

  if (testStarted && activeSession !== null) {
    if (questionCount === 50) {
      return (
        <TestInterfaceCombined
          onExit={() => { setTestStarted(false); setActiveSession(null); }}
          dataSources={dataSources}
          testName="Test (50 ta)"
          questionCount={50}
          timeLimit={50 * 60}
          randomize={true}
        />
      );
    }
    return (
      <TestInterfaceBase
        onExit={() => { setTestStarted(false); setActiveSession(null); }}
        dataSource={`/${effectiveDataFile}`}
        testName="Test (20 ta)"
        questionCount={20}
        timeLimit={25 * 60}
        randomize={true}
        variant={user ? FREE_VARIANT : 0}
        sessionId={activeSession.sessionId}
        isPremiumSession={activeSession.isPremium}
      />
    );
  }

  return (
    <>
      <SEO title="Test ishlash" description="YHQ imtihon testlari" path="/test-ishlash" />

      <div className="min-h-screen bg-gradient-to-br from-[hsl(230_25%_97%)] to-[hsl(250_30%_95%)] flex flex-col font-sans">
        {/* Header */}
        <header className="w-full hero-bg border-b border-[hsl(250_70%_56%/0.2)] px-6 py-3 sticky top-0 z-20">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2 font-bold text-white/80 hover:text-white hover:bg-white/10">
                <Home className="w-4 h-4" /> Bosh sahifa
              </Button>
            </Link>
            <div className="flex bg-white/10 rounded-lg p-1">
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setLanguage(lang.id as any)}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                    language === lang.id
                      ? "bg-gradient-to-r from-[hsl(250_70%_56%)] to-[hsl(190_80%_45%)] text-white shadow-sm"
                      : "text-white/50 hover:text-white/80"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
          {/* Premium Banner */}
          {showProBanner && !accessLoading && (
            <Link to="/pro" className="group flex items-center gap-4 bg-gradient-to-r from-[hsl(250_70%_56%/0.08)] to-[hsl(190_80%_45%/0.05)] border-2 border-[hsl(250_70%_56%/0.25)] rounded-2xl px-5 py-4 hover:border-[hsl(250_70%_56%/0.5)] transition-all active:scale-[0.99]">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[hsl(250_70%_56%)] to-[hsl(190_80%_45%)] flex items-center justify-center flex-shrink-0 shadow-sm shadow-[hsl(250_70%_56%/0.3)]">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-primary font-bold text-base leading-tight">PREMIUM VERSIYA <span className="text-[hsl(190_80%_45%)]">✦</span></p>
                <p className="text-muted-foreground text-sm mt-0.5"><span className="font-bold text-foreground">1200+</span> savol bilan imtihonga tayyor bo'ling</p>
              </div>
            </Link>
          )}

          {/* Backend warning */}
          {!accessLoading && !backendConfirmed && isPremium === false && user && (
            <div className="flex items-center gap-3 bg-[hsl(250_70%_56%/0.08)] border border-[hsl(250_70%_56%/0.2)] rounded-xl px-4 py-3">
              <ServerCrash className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-sm text-foreground">
                Server bilan aloqa yo'q. Bepul rejimda test ishlash mumkin.
              </p>
            </div>
          )}

          {/* Session error */}
          {sessionError && (
            <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{sessionError}</p>
            </div>
          )}

          {/* Main card */}
          <div className="bg-card rounded-3xl border border-border shadow-2xl shadow-[hsl(250_70%_56%/0.08)] overflow-hidden">
            <div className="px-8 py-6 border-b border-border flex items-center gap-4 hero-bg">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[hsl(250_70%_56%)] to-[hsl(190_80%_45%)] flex items-center justify-center shadow-md shadow-[hsl(250_70%_56%/0.3)]">
                <Play className="w-5 h-5 text-white fill-current" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white">Test ishlash</h1>
                <p className="text-white/50 text-sm font-semibold">
                  {questionCount} ta tasodifiy savol • {questionCount === 20 ? "25" : "50"} daqiqa
                </p>
              </div>
            </div>

            <div className="p-6 flex flex-col md:flex-row gap-6">
              {/* Question count */}
              <div className="flex-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 text-center">
                  Savollar sonini tanlang
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {([20, 50] as const).map((num) => (
                    <button
                      key={num}
                      onClick={() => setQuestionCount(num)}
                      className={`relative py-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-0.5 ${
                        questionCount === num
                          ? "border-primary bg-primary/8 shadow-sm shadow-primary/15"
                          : "border-border bg-muted/30 hover:border-primary/40"
                      }`}
                    >
                      {questionCount === num && (
                        <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <span className={`text-4xl font-black leading-none ${questionCount === num ? "text-primary" : "text-muted-foreground"}`}>
                        {num}
                      </span>
                      <span className="text-sm font-semibold text-muted-foreground mt-1">savollar</span>
                      <span className="text-sm text-muted-foreground/70">{num === 20 ? "25 daqiqa" : "50 daqiqa"}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stats + button */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: HelpCircle, value: questionCount, label: "Savollar", color: "text-primary" },
                    { icon: Clock, value: questionCount === 20 ? 25 : 50, label: "Daqiqa", color: "text-[hsl(217_91%_60%)]" },
                    { icon: CheckCircle, value: "90%", label: "O'tish", color: "text-[hsl(160_60%_45%)]" },
                  ].map(({ icon: Icon, value, label, color }) => (
                    <div key={label} className="flex flex-col items-center gap-2 bg-muted/30 rounded-2xl py-4 border border-border/50">
                      <div className="w-8 h-8 rounded-xl bg-card shadow-sm flex items-center justify-center border border-border/50">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className={`text-xl font-black leading-none ${color}`}>
                        {value}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleStart}
                  disabled={starting || accessLoading}
                  className="w-full h-14 rounded-xl bg-gradient-to-r from-[hsl(250_70%_56%)] to-[hsl(190_80%_45%)] hover:from-[hsl(250_70%_48%)] hover:to-[hsl(190_80%_38%)] text-white text-base font-black shadow-lg shadow-[hsl(250_70%_56%/0.25)] hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-auto disabled:opacity-60 border-0"
                >
                  {(starting || accessLoading)
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <Play className="w-4 h-4 fill-current" />
                  }
                  {starting ? "Yuklanmoqda..." : "Testni boshlash"}
                </Button>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Testni boshlash uchun ro'yxatdan o'tish shart emas
          </p>
        </main>
      </div>
    </>
  );
}
