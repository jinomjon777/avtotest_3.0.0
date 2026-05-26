import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTestResults } from "@/hooks/useTestResults";
import { Button } from "@/components/ui/button";
import { Home, BookOpen, Car, FileText, Clock, CheckCircle, HelpCircle, User, LogIn, Globe, Play, AlertTriangle } from "lucide-react";

interface TestStartPageProps {
  onStartTest: (variant: number) => void;
  startError?: string | null;
}

const languages = [
  { id: "uz-lat" as const, label: "O'zbekcha", flag: "🇺🇿" },
  { id: "uz" as const, label: "Ўзбекча", flag: "🇺🇿" },
  { id: "ru" as const, label: "Русский", flag: "🇷🇺" },
];

const TOTAL_VARIANTS = 61;
const variants = Array.from({ length: TOTAL_VARIANTS }, (_, i) => i + 1);

export const TestStartPage = ({ onStartTest, startError }: TestStartPageProps) => {
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [showAllVariants, setShowAllVariants] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { user, profile } = useAuth();
  const { getVariantStatus, loading: resultsLoading } = useTestResults();
  const navigate = useNavigate();

  const handleStartTest = () => {
    if (selectedVariant !== null) {
      onStartTest(selectedVariant);
    }
  };

  const handleMobileVariantTap = (v: number) => {
    if (selectedVariant === v) {
      onStartTest(v);
    } else {
      setSelectedVariant(v);
    }
  };

  const getVariantButtonClass = (v: number) => {
    const status = getVariantStatus(v);
    const isSelected = selectedVariant === v;
    
    if (status === 'success') {
      return isSelected
        ? 'bg-green-500/20 text-green-400 border-green-500/50'
        : 'bg-green-500/10 text-green-400/80 border-green-500/20 hover:bg-green-500/15';
    }
    if (status === 'failed') {
      return isSelected
        ? 'bg-red-500/20 text-red-400 border-red-500/50'
        : 'bg-red-500/10 text-red-400/80 border-red-500/20 hover:bg-red-500/15';
    }
    return isSelected
      ? 'bg-primary/15 text-primary border-primary/50'
      : 'bg-muted/30 text-foreground border-border hover:border-primary/40';
  };

  const visibleVariants = showAllVariants ? variants : variants;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Layout */}
      <div className="lg:hidden flex flex-col min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 border-b border-amber-500/20 p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-3">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2 text-white/80 hover:text-white hover:bg-white/10">
                <Home className="w-4 h-4" />
                Bosh sahifa
              </Button>
            </Link>
            {user ? (
              <Button variant="ghost" size="sm" onClick={() => navigate('/profile')} className="gap-2 text-white/80 hover:text-white hover:bg-white/10">
                <User className="w-4 h-4" />
                <span className="text-xs">{profile?.full_name || profile?.username || 'Profil'}</span>
              </Button>
            ) : (
              <Button size="sm" onClick={() => navigate('/auth')} className="gap-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold">
                <LogIn className="w-4 h-4" />
                <span className="text-xs">Kirish</span>
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {languages.map((lang) => (
              <Button
                key={lang.id}
                variant="ghost"
                size="sm"
                className={`flex-1 text-xs ${
                  language === lang.id 
                    ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold" 
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
                onClick={() => setLanguage(lang.id)}
              >
                {lang.flag} {lang.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Selected Variant & Start */}
        <div className="bg-card border-b border-border p-4">
          {selectedVariant ? (
            <div className="mb-3 p-4 bg-primary/10 rounded-xl border border-primary/30 text-center">
              <div className="text-5xl font-bold text-primary mb-1">{selectedVariant}</div>
              <div className="text-xs text-muted-foreground">{t("test.variant")} {selectedVariant}</div>
            </div>
          ) : (
            <div className="mb-3 p-4 bg-muted/20 rounded-xl border border-border text-center">
              <div className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Выберите вариант ниже' : language === 'uz' ? 'Қуйидан вариант танланг' : 'Quyidan variant tanlang'}
              </div>
            </div>
          )}
          {startError && (
            <div className="mb-2 flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
              <p className="text-xs text-destructive">{startError}</p>
            </div>
          )}
          <Button
            size="lg"
            className="w-full gap-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-black font-bold"
            onClick={handleStartTest}
            disabled={selectedVariant === null}
          >
            <Play className="w-5 h-5" />
            {selectedVariant ? t("test.startTest") : t("test.selectVariantFirst")}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 p-4 bg-muted/10">
          <div className="text-center p-2 bg-card rounded-lg border border-border">
            <div className="text-xl font-bold text-foreground">20</div>
            <div className="text-[10px] text-muted-foreground">{t("test.questions")}</div>
          </div>
          <div className="text-center p-2 bg-card rounded-lg border border-border">
            <div className="text-xl font-bold text-foreground">30</div>
            <div className="text-[10px] text-muted-foreground">{t("test.minutes")}</div>
          </div>
          <div className="text-center p-2 bg-card rounded-lg border border-border">
            <div className="text-xl font-bold text-foreground">90%</div>
            <div className="text-[10px] text-muted-foreground">{t("test.passingScore")}</div>
          </div>
        </div>

        {/* Variant Selection */}
        <div className="flex-1 p-4 overflow-y-auto">
          <h2 className="text-lg font-bold text-foreground mb-3">{t("test.selectVariant")}</h2>
          <div className="grid grid-cols-5 gap-2 mb-4">
            {visibleVariants.map((v) => (
              <Button
                key={v}
                variant="outline"
                className={`h-12 text-base font-semibold transition-all ${getVariantButtonClass(v)}`}
                onClick={() => handleMobileVariantTap(v)}
              >
                {v}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-green-500/20 border border-green-500/30 rounded" />
              <span>≥90%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-red-500/20 border border-red-500/30 rounded" />
              <span>&lt;90%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex h-screen overflow-hidden">
        {/* Left Side */}
        <div className="w-[30%] bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 border-r border-amber-500/20 p-6 flex flex-col">
          <div className="flex-1 flex flex-col">
            <div className="mb-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2 text-white/80 hover:text-white hover:bg-white/10">
                  <Home className="w-4 h-4" />
                  Bosh sahifa
                </Button>
              </Link>
            </div>

            {/* Profile */}
            <div className="mb-4">
              {user ? (
                <Button
                  variant="ghost"
                  onClick={() => navigate('/profile')}
                  className="w-full flex items-center gap-2 h-auto py-2.5 px-3 justify-start text-white/80 hover:text-white hover:bg-white/10"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-semibold text-xs truncate text-white">{profile?.full_name || profile?.username || 'Profil'}</div>
                    {profile?.username && profile?.full_name && (
                      <div className="text-[10px] text-white/50 truncate">@{profile.username}</div>
                    )}
                  </div>
                </Button>
              ) : (
                <Button onClick={() => navigate('/auth')} className="w-full gap-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold" size="sm">
                  <LogIn className="w-4 h-4" />
                  Kirish
                </Button>
              )}
            </div>

            {/* Language */}
            <div className="mb-4">
              <h3 className="text-[10px] font-medium text-white/40 mb-1.5">{t("test.selectLanguage")}</h3>
              <div className="flex gap-1.5">
                {languages.map((lang) => (
                  <Button
                    key={lang.id}
                    variant="ghost"
                    size="sm"
                    className={`flex-1 text-[11px] h-8 ${
                      language === lang.id 
                        ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold" 
                        : "text-white/50 hover:text-white hover:bg-white/10"
                    }`}
                    onClick={() => setLanguage(lang.id)}
                  >
                    {lang.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Selected Variant */}
            {selectedVariant ? (
              <div className="mb-4 p-6 bg-primary/10 rounded-xl border-2 border-primary/30 shadow-sm shadow-primary/10">
                <div className="text-center">
                  <div className="text-6xl font-bold text-primary mb-1">{selectedVariant}</div>
                  <div className="text-[11px] font-medium text-white/50">{t("test.variant")} {selectedVariant}</div>
                </div>
              </div>
            ) : (
              <div className="mb-4 p-6 bg-white/5 rounded-xl border-2 border-dashed border-white/20">
                <div className="text-center text-white/40 text-xs">
                  {language === 'ru' ? 'Выберите вариант справа' : language === 'uz' ? 'Ўнг томондан вариант танланг' : 'O\'ng tomondan variant tanlang'}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="text-xl font-bold text-blue-400">20</div>
                <div className="text-[9px] text-blue-400/70 mt-0.5">{t("test.questions")}</div>
              </div>
              <div className="text-center p-2.5 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <div className="text-xl font-bold text-purple-400">30</div>
                <div className="text-[9px] text-purple-400/70 mt-0.5">{t("test.minutes")}</div>
              </div>
              <div className="text-center p-2.5 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="text-xl font-bold text-green-400">90%</div>
                <div className="text-[9px] text-green-400/70 mt-0.5">{t("test.passingScore")}</div>
              </div>
            </div>

            {/* Start Button */}
            {startError && (
              <div className="mb-2 flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-400">{startError}</p>
              </div>
            )}
            <Button
              size="lg"
              className="w-full mb-3 gap-2 h-12 text-sm font-bold shadow-lg shadow-amber-500/20 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-black"
              onClick={handleStartTest}
              disabled={selectedVariant === null}
            >
              <Play className="w-4 h-4" />
              {selectedVariant ? t("test.startTest") : t("test.selectVariantFirst")}
            </Button>

            {/* Instructions */}
            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
              <h3 className="text-[10px] font-semibold text-white/80 mb-1.5 flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-amber-400" />
                {t("test.instructions")}
              </h3>
              <div className="text-[10px] text-white/40 space-y-1">
                <div className="flex items-start gap-1.5">
                  <span className="text-amber-400 mt-0.5">•</span>
                  <span>{t("test.instruction1")}</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-amber-400 mt-0.5">•</span>
                  <span>{t("test.instruction2")}</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-amber-400 mt-0.5">•</span>
                  <span>{t("test.instruction3")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Variants */}
        <div className="w-[70%] bg-background p-8 overflow-y-auto">
          <div className="max-w-5xl">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground mb-1">{t("test.selectVariant")}</h1>
              <p className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Выберите вариант теста для начала' : language === 'uz' ? 'Тест вариантини танланг' : 'Test variantini tanlang'}
              </p>
            </div>

            <div className="grid grid-cols-10 gap-2 mb-4">
              {visibleVariants.map((v) => (
                <Button
                  key={v}
                  variant="outline"
                  className={`h-12 text-base font-semibold transition-all ${getVariantButtonClass(v)}`}
                  onClick={() => setSelectedVariant(v)}
                >
                  {v}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500/20 border border-green-500/30 rounded" />
                <span>≥90%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500/20 border border-red-500/30 rounded" />
                <span>&lt;90%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
