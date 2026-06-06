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
  totalQuestions, correctAnswers, incorrectAnswers, timeTaken, variant, onBackToHome, onTryAgain,
}: TestResultsProps) => {
  const { t } = useLanguage();
  const score = Math.round((correctAnswers / totalQuestions) * 100);
  const passed = score >= 90;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8">
      <Card className="w-full max-w-lg md:max-w-2xl p-6 md:p-10 bg-card border-border backdrop-blur-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`w-20 h-20 md:w-24 md:h-24 mx-auto rounded-full flex items-center justify-center mb-4 ${
            passed ? "bg-success/10 shadow-lg shadow-success/10" : "bg-destructive/10 shadow-lg shadow-destructive/10"
          }`}>
            <Trophy className={`w-10 h-10 md:w-12 md:h-12 ${passed ? "text-success" : "text-destructive"}`} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {t("results.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("test.variant")} {variant}
          </p>
        </div>

        {/* Score */}
        <div className={`text-center py-6 md:py-8 rounded-2xl mb-6 ${
          passed
            ? "bg-success/10 border border-success/20"
            : "bg-destructive/10 border border-destructive/20"
        }`}>
          <div className={`text-5xl md:text-6xl font-bold mb-2 ${
            passed ? "text-success" : "text-destructive"
          }`}>
            {score}%
          </div>
          <p className={`text-lg md:text-xl font-medium ${
            passed ? "text-success" : "text-destructive"
          }`}>
            {passed ? t("results.passed") : t("results.failed")}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4 bg-muted rounded-2xl border border-border">
            <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-success mx-auto mb-2" />
            <div className="text-xl md:text-2xl font-bold text-foreground">{correctAnswers}</div>
            <p className="text-xs md:text-sm text-muted-foreground">{t("results.correct")}</p>
          </div>
          <div className="text-center p-4 bg-muted rounded-2xl border border-border">
            <XCircle className="w-6 h-6 md:w-8 md:h-8 text-destructive mx-auto mb-2" />
            <div className="text-xl md:text-2xl font-bold text-foreground">{incorrectAnswers}</div>
            <p className="text-xs md:text-sm text-muted-foreground">{t("results.incorrect")}</p>
          </div>
          <div className="text-center p-4 bg-muted rounded-2xl border border-border">
            <Clock className="w-6 h-6 md:w-8 md:h-8 text-accent mx-auto mb-2" />
            <div className="text-xl md:text-2xl font-bold text-foreground">{formatTime(timeTaken)}</div>
            <p className="text-xs md:text-sm text-muted-foreground">{t("results.timeTaken")}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            className="flex-1 h-12 md:h-14 text-base md:text-lg bg-muted hover:bg-secondary text-foreground border border-border"
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
