import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { MainLayout } from "@/components/layout/MainLayout";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Trophy, CheckCircle, XCircle, Play, BookOpen,
  Crown, ArrowRight, BarChart3, Target, TrendingUp, FileText, Layers
} from "lucide-react";

interface TestResult {
  id: string;
  variant: number;
  correct_answers: number;
  total_questions: number;
  time_taken_seconds: number | null;
  completed_at: string;
}

// Color palette
const PURPLE = "hsl(250 70% 56%)";
const BLUE = "hsl(220 80% 55%)";
const CYAN = "hsl(190 80% 50%)";
const BEIGE = "hsl(40 30% 95%)";

export default function Dashboard() {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState<TestResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from("test_results")
          .select("*")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false });
        setResults(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingResults(false);
      }
    };
    fetchResults();
  }, [user]);

  if (isLoading || !user) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[hsl(250_70%_56%/0.2)] border-t-[hsl(250_70%_56%)] rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  const totalTests = results.length;
  const totalCorrect = results.reduce((s, r) => s + r.correct_answers, 0);
  const totalQuestions = results.reduce((s, r) => s + r.total_questions, 0);
  const totalWrong = totalQuestions - totalCorrect;
  const avgScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const uniqueVariants = new Set(results.map(r => r.variant)).size;
  const recentResults = results.slice(0, 5);

  const formatTime = (s: number | null) => {
    if (!s) return "--:--";
    return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  };

  const displayName = profile?.full_name || profile?.username || "Foydalanuvchi";

  const stats = [
    { icon: Trophy, label: "Jami testlar", value: totalTests, color: PURPLE, bg: "hsl(250 70% 56% / 0.1)" },
    { icon: CheckCircle, label: "To'g'ri javoblar", value: totalCorrect, color: CYAN, bg: "hsl(190 80% 50% / 0.1)" },
    { icon: XCircle, label: "Noto'g'ri javoblar", value: totalWrong, color: "hsl(0 70% 60%)", bg: "hsl(0 70% 60% / 0.1)" },
    { icon: TrendingUp, label: "O'rtacha ball", value: `${avgScore}%`, color: BLUE, bg: "hsl(220 80% 55% / 0.1)" },
  ];

  const quickActions = [
    { icon: Play, label: "Test boshlash", path: "/test-ishlash", primary: true },
    { icon: FileText, label: "Variantlar", path: "/variant" },
    { icon: Layers, label: "Mavzuli test", path: "/mavzuli" },
    { icon: BookOpen, label: "Darslik", path: "/darslik" },
  ];

  return (
    <MainLayout>
      <SEO title="Dashboard" description="Avtotest Premium - Shaxsiy boshqaruv paneli" path="/dashboard" noIndex />
      
      <div className="min-h-screen" style={{ background: `linear-gradient(180deg, ${BEIGE} 0%, hsl(0 0% 100%) 100%)` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
          {/* Greeting Hero */}
          <div className="relative mb-8 rounded-3xl overflow-hidden p-6 md:p-8" style={{
            background: `linear-gradient(135deg, ${PURPLE} 0%, ${BLUE} 50%, ${CYAN} 100%)`
          }}>
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20" style={{ background: "white", filter: "blur(60px)" }} />
            <div className="absolute -bottom-20 -left-10 w-48 h-48 rounded-full opacity-10" style={{ background: "white", filter: "blur(40px)" }} />
            <div className="relative z-10">
              <p className="text-white/80 text-sm font-medium mb-1">Xush kelibsiz</p>
              <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 font-montserrat">
                {displayName} 👋
              </h1>
              <p className="text-white/70 text-sm md:text-base">Bugungi tayyorgarlik holatiga ko'z tashlang</p>
              {profile?.is_pro && (
                <div className="inline-flex items-center gap-1.5 mt-4 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/30">
                  <Crown className="w-3.5 h-3.5 text-white" />
                  <span className="text-xs font-bold text-white">PREMIUM faol</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => navigate(action.path)}
                className="group relative h-auto py-5 px-4 flex flex-col items-center gap-2.5 rounded-2xl font-semibold text-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                style={action.primary ? {
                  background: `linear-gradient(135deg, ${PURPLE} 0%, ${BLUE} 100%)`,
                  color: "white",
                  boxShadow: "0 4px 20px hsl(250 70% 56% / 0.3)"
                } : {
                  background: "white",
                  color: "hsl(230 25% 20%)",
                  border: "1px solid hsl(230 20% 90%)"
                }}
              >
                <action.icon className="w-5 h-5" style={!action.primary ? { color: PURPLE } : undefined} />
                <span>{action.label}</span>
              </button>
            ))}
          </div>

          {/* Stats */}
          {loadingResults ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-5 border-0 rounded-2xl bg-white shadow-sm">
                  <Skeleton className="w-10 h-10 rounded-xl mb-3" />
                  <Skeleton className="w-16 h-7 mb-1" />
                  <Skeleton className="w-20 h-4" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {stats.map((stat, i) => (
                <Card key={i} className="p-5 border-0 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: stat.bg }}>
                    <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                  <div className="text-2xl font-bold text-[hsl(230_25%_15%)] mb-0.5">{stat.value}</div>
                  <div className="text-xs text-[hsl(230_15%_50%)]">{stat.label}</div>
                </Card>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Results */}
            <div className="lg:col-span-2">
              <Card className="border-0 rounded-2xl bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-[hsl(230_20%_94%)]">
                  <h2 className="font-bold text-[hsl(230_25%_15%)] flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(250 70% 56% / 0.1)" }}>
                      <BarChart3 className="w-4 h-4" style={{ color: PURPLE }} />
                    </div>
                    So'nggi natijalar
                  </h2>
                  {results.length > 5 && (
                    <Button variant="ghost" size="sm" onClick={() => navigate("/profile")} className="gap-1 text-[hsl(250_70%_56%)] hover:bg-[hsl(250_70%_56%/0.08)]">
                      Barchasi <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="p-5">
                  {loadingResults ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-xl">
                          <Skeleton className="w-10 h-10 rounded-xl" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="w-24 h-4" />
                            <Skeleton className="w-16 h-3" />
                          </div>
                          <Skeleton className="w-12 h-6 rounded-full" />
                        </div>
                      ))}
                    </div>
                  ) : recentResults.length === 0 ? (
                    <EmptyState
                      icon={Trophy}
                      title="Hali test ishlanmagan"
                      description="Birinchi testingizni boshlang va natijalaringizni bu yerda kuzating"
                      actionLabel="Test boshlash"
                      onAction={() => navigate("/test-ishlash")}
                    />
                  ) : (
                    <div className="space-y-2">
                      {recentResults.map((result) => {
                        const score = Math.round((result.correct_answers / result.total_questions) * 100);
                        const passed = score >= 80;
                        return (
                          <div key={result.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[hsl(40_30%_97%)] transition-colors">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white" style={{
                              background: passed ? `linear-gradient(135deg, ${CYAN}, ${BLUE})` : "linear-gradient(135deg, hsl(0 70% 65%), hsl(0 70% 55%))"
                            }}>
                              {result.variant}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-[hsl(230_25%_15%)] text-sm">Variant {result.variant}</p>
                              <div className="flex items-center gap-3 text-xs text-[hsl(230_15%_50%)]">
                                <span>{result.correct_answers}/{result.total_questions} to'g'ri</span>
                                <span>⏱ {formatTime(result.time_taken_seconds)}</span>
                              </div>
                            </div>
                            <div className="px-2.5 py-1 rounded-full text-xs font-bold" style={{
                              background: passed ? "hsl(190 80% 50% / 0.12)" : "hsl(0 70% 60% / 0.12)",
                              color: passed ? CYAN : "hsl(0 70% 50%)"
                            }}>
                              {score}%
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Side panel */}
            <div className="space-y-6">
              {/* Progress */}
              <Card className="p-5 border-0 rounded-2xl bg-white shadow-sm">
                <h3 className="font-bold text-[hsl(230_25%_15%)] mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(190 80% 50% / 0.1)" }}>
                    <Target className="w-4 h-4" style={{ color: CYAN }} />
                  </div>
                  Tayyorgarlik
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[hsl(230_15%_50%)]">Variantlar</span>
                      <span className="font-semibold text-[hsl(230_25%_15%)]">{uniqueVariants}/61</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden bg-[hsl(40_30%_94%)]">
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${(uniqueVariants / 61) * 100}%`,
                        background: `linear-gradient(90deg, ${PURPLE}, ${BLUE})`
                      }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[hsl(230_15%_50%)]">O'rtacha ball</span>
                      <span className="font-semibold text-[hsl(230_25%_15%)]">{avgScore}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden bg-[hsl(40_30%_94%)]">
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${avgScore}%`,
                        background: `linear-gradient(90deg, ${BLUE}, ${CYAN})`
                      }} />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Premium CTA */}
              {!(profile?.is_pro) ? (
                <Card className="p-5 border-0 rounded-2xl overflow-hidden relative" style={{
                  background: `linear-gradient(135deg, ${PURPLE} 0%, ${BLUE} 100%)`
                }}>
                  <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20" style={{ background: "white", filter: "blur(30px)" }} />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Crown className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">PREMIUM</h3>
                        <p className="text-xs text-white/70">To'liq imkoniyatlar</p>
                      </div>
                    </div>
                    <p className="text-xs text-white/80 mb-4">Barcha variantlar va mavzuli testlarga to'liq kirish</p>
                    <Button
                      onClick={() => navigate("/pro")}
                      className="w-full bg-white hover:bg-white/90 text-[hsl(250_70%_45%)] font-bold rounded-xl"
                    >
                      Batafsil ko'rish
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card className="p-5 border-0 rounded-2xl" style={{
                  background: `linear-gradient(135deg, hsl(190 80% 50% / 0.1), hsl(220 80% 55% / 0.1))`,
                  border: `1px solid hsl(190 80% 50% / 0.2)`
                }}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{
                      background: `linear-gradient(135deg, ${CYAN}, ${BLUE})`
                    }}>
                      <Crown className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[hsl(230_25%_15%)] text-sm">PREMIUM faol</h3>
                      <p className="text-xs text-[hsl(230_15%_50%)]">Barcha imkoniyatlar ochiq</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
