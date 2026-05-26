import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, Trophy, RotateCcw, Home } from "lucide-react";

interface TestResultsProps {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  timeTaken: number;
  variant: number;
  onBackToHome: () => void;
  onTryAgain: () => void;
}

export const TestResults = ({
  totalQuestions,
  correctAnswers,
  incorrectAnswers,
  timeTaken,
  variant,
  onBackToHome,
  onTryAgain,
}: TestResultsProps) => {
  const { t } = useLanguage();
  
  const score = Math.round((correctAnswers / totalQuestions) * 100);
  const passed = score >= 90;
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(230_25%_10%)] via-[hsl(250_40%_16%)] to-[hsl(230_25%_10%)] flex items-center justify-center p-4 md:p-8">
      <Card className="w-full max-w-lg md:max-w-2xl p-6 md:p-10 bg-[hsl(230_25%_12%)]/80 border-[hsl(250_70%_56%/0.2)] backdrop-blur-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`w-20 h-20 md:w-24 md:h-24 mx-auto rounded-full flex items-center justify-center mb-4 ${
            passed ? 'bg-[hsl(160_60%_45%/0.2)] shadow-lg shadow-[hsl(160_60%_45%/0.1)]' : 'bg-[hsl(0_72%_55%/0.2)] shadow-lg shadow-[hsl(0_72%_55%/0.1)]'
          }`}>
            <Trophy className={`w-10 h-10 md:w-12 md:h-12 ${passed ? 'text-[hsl(160_60%_55%)]' : 'text-[hsl(0_72%_60%)]'}`} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {t("results.title")}
          </h1>
          <p className="text-white/50">
            {t("test.variant")} {variant}
          </p>
        </div>

        {/* Score */}
        <div className={`text-center py-6 md:py-8 rounded-2xl mb-6 ${
          passed ? 'bg-[hsl(160_60%_45%/0.1)] border border-[hsl(160_60%_45%/0.2)]' : 'bg-[hsl(0_72%_55%/0.1)] border border-[hsl(0_72%_55%/0.2)]'
        }`}>
          <div className={`text-5xl md:text-6xl font-bold mb-2 ${
            passed ? 'text-[hsl(160_60%_55%)]' : 'text-[hsl(0_72%_60%)]'
          }`}>
            {score}%
          </div>
          <p className={`text-lg md:text-xl font-medium ${
            passed ? 'text-[hsl(160_60%_55%)]' : 'text-[hsl(0_72%_60%)]'
          }`}>
            {passed ? t("results.passed") : t("results.failed")}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/10">
            <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-[hsl(160_60%_55%)] mx-auto mb-2" />
            <div className="text-xl md:text-2xl font-bold text-white">{correctAnswers}</div>
            <p className="text-xs md:text-sm text-white/50">{t("results.correct")}</p>
          </div>
          <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/10">
            <XCircle className="w-6 h-6 md:w-8 md:h-8 text-[hsl(0_72%_60%)] mx-auto mb-2" />
            <div className="text-xl md:text-2xl font-bold text-white">{incorrectAnswers}</div>
            <p className="text-xs md:text-sm text-white/50">{t("results.incorrect")}</p>
          </div>
          <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/10">
            <Clock className="w-6 h-6 md:w-8 md:h-8 text-[hsl(190_80%_55%)] mx-auto mb-2" />
            <div className="text-xl md:text-2xl font-bold text-white">{formatTime(timeTaken)}</div>
            <p className="text-xs md:text-sm text-white/50">{t("results.timeTaken")}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12 md:h-14 text-base md:text-lg border-white/20 text-white hover:bg-white/10"
            onClick={onBackToHome}
          >
            <Home className="w-5 h-5 mr-2" />
            Bosh sahifaga qaytish
          </Button>
          <Button
            className="flex-1 h-12 md:h-14 text-base md:text-lg bg-gradient-to-r from-[hsl(250_70%_56%)] to-[hsl(190_80%_45%)] hover:from-[hsl(250_70%_48%)] hover:to-[hsl(190_80%_38%)] text-white font-bold border-0"
            onClick={onTryAgain}
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            {t("results.tryAgain")}
          </Button>
        </div>
      </Card>
    </div>
  );
};
