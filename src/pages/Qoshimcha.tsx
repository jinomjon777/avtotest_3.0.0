import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  BookOpen, ListChecks, Target, Lightbulb, Play, FileText, Crown, CheckCircle, Info
} from "lucide-react";

export default function Qoshimcha() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();

  const cards = [
    { icon: FileText, title: t("qoshimcha.card1Title"), description: t("qoshimcha.card1Desc"), gradient: "from-[hsl(250_70%_56%)] to-[hsl(250_70%_45%)]", iconColor: "text-white" },
    { icon: Target, title: t("qoshimcha.card2Title"), description: t("qoshimcha.card2Desc"), gradient: "from-[hsl(190_80%_45%)] to-[hsl(190_80%_35%)]", iconColor: "text-white" },
    { icon: ListChecks, title: t("qoshimcha.card3Title"), description: t("qoshimcha.card3Desc"), gradient: "from-[hsl(217_91%_60%)] to-[hsl(217_91%_50%)]", iconColor: "text-white" },
    { icon: Lightbulb, title: t("qoshimcha.card4Title"), description: t("qoshimcha.card4Desc"), gradient: "from-[hsl(160_60%_45%)] to-[hsl(160_60%_35%)]", iconColor: "text-white" }
  ];

  const tips = [
    t("qoshimcha.tip1"),
    t("qoshimcha.tip2"),
    t("qoshimcha.tip3"),
    t("qoshimcha.tip4"),
    t("qoshimcha.tip5"),
  ];

  return (
    <MainLayout>
      <SEO 
        title={t("qoshimcha.seoTitle")}
        description={t("qoshimcha.seoDesc")}
        path="/qoshimcha"
        keywords="test tayyorgarlik, o'rganish strategiyasi, imtihon maslahatlari"
      />

      {/* Hero */}
      <section className="bg-[hsl(var(--sidebar-background))] py-14 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-14 h-14 mx-auto mb-5 bg-primary/15 rounded-2xl flex items-center justify-center border border-primary/25">
            <Info className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-[hsl(var(--sidebar-accent-foreground))] mb-4">{t("qoshimcha.title")}</h1>
          <p className="text-lg text-[hsl(var(--sidebar-foreground))] max-w-2xl mx-auto mb-8">{t("qoshimcha.subtitle")}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/darslik">
              <Button variant="outline" className="bg-[hsl(var(--sidebar-accent))] border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-accent-foreground))] hover:bg-[hsl(var(--sidebar-border))] gap-2 px-6 py-5 rounded-xl">
                <BookOpen className="w-5 h-5" />{t("qoshimcha.btnDarslik")}
              </Button>
            </Link>
            <Link to="/variant">
              <Button className="bg-gradient-to-r from-[hsl(190_80%_45%)] to-[hsl(190_80%_38%)] hover:from-[hsl(190_80%_38%)] hover:to-[hsl(190_80%_32%)] text-white gap-2 px-6 py-5 rounded-xl border-0">
                <Play className="w-5 h-5" />{t("qoshimcha.btnStart")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* PREMIUM */}
      <section className="py-12 bg-muted/40 border-y border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Card className="border border-primary/20 bg-card rounded-2xl overflow-hidden shadow-sm">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[hsl(250_70%_56%)] to-[hsl(190_80%_45%)] rounded-xl flex items-center justify-center shadow-md shadow-[hsl(250_70%_56%/0.3)]">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-extrabold text-foreground">{t("qoshimcha.premiumTitle")}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed text-sm mb-6">
                {t("qoshimcha.premiumDesc")}
              </p>
              {user && profile?.is_pro ? (
                <div className="flex items-center gap-3 bg-primary/10 border border-primary/25 rounded-xl px-5 py-3 w-fit">
                  <Crown className="w-5 h-5 text-[hsl(250_70%_75%)]" />
                  <span className="font-semibold text-foreground">{profile.full_name || profile.username || 'PREMIUM'}</span>
                  <span className="text-xs bg-gradient-to-r from-[hsl(250_70%_56%)] to-[hsl(190_80%_45%)] text-white px-2 py-0.5 rounded-full font-bold">PREMIUM</span>
                </div>
              ) : (
                <Link to="/pro">
                  <Button className="bg-gradient-to-r from-[hsl(250_70%_56%)] to-[hsl(190_80%_45%)] hover:from-[hsl(250_70%_48%)] hover:to-[hsl(190_80%_38%)] text-white gap-2 px-6 py-5 rounded-xl font-bold border-0">
                    <Crown className="w-5 h-5" />{t("qoshimcha.premiumBtn")}
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Cards */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card, index) => {
              const Icon = card.icon;
              return (
                <Card key={index} className="border border-border/60 rounded-2xl hover:shadow-lg transition-all hover:-translate-y-1 group">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-md`}>
                      <Icon className={`w-6 h-6 ${card.iconColor}`} />
                    </div>
                    <h3 className="font-bold text-lg text-foreground mb-2">{card.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{card.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Card className="border border-border/60 rounded-2xl shadow-sm">
            <CardContent className="p-8">
              <h2 className="text-2xl font-extrabold text-foreground mb-6 text-center">{t("qoshimcha.tipsTitle")}</h2>
              <ul className="space-y-4">
                {tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-gradient-to-br from-[hsl(190_80%_45%)] to-[hsl(190_80%_35%)] rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-foreground text-sm pt-1">{tip}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}