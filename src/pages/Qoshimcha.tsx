import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { 
  BookOpen, ListChecks, Target, Lightbulb, Play, FileText, Crown, CheckCircle, Info
} from "lucide-react";

const cards = [
  { icon: FileText, title: "Test tuzilishi", description: "Test savollari mavzular bo'yicha guruhlangan: belgilar, qoidalar, harakatlanish holatlari va birinchi yordamga oid savollar.", gradient: "from-[hsl(250_70%_56%)] to-[hsl(250_70%_45%)]", iconColor: "text-white" },
  { icon: Target, title: "O'rganish strategiyalari", description: "Belgilarni vizual tarzda yodlash, testlarni mashaqqat bilan yechish va noto'g'ri javoblarni alohida qayta ko'rib chiqish.", gradient: "from-[hsl(190_80%_45%)] to-[hsl(190_80%_35%)]", iconColor: "text-white" },
  { icon: ListChecks, title: "Amaliy mashqlar", description: "20 va 50 savollik mashqlar mavjud — boshlanish uchun 20 savol rejimidan boshlash tavsiya etiladi.", gradient: "from-[hsl(217_91%_60%)] to-[hsl(217_91%_50%)]", iconColor: "text-white" },
  { icon: Lightbulb, title: "Resurslar", description: "Grafik materiallar, rasmlar va video qo'llanmalar yordamida murakkab vaziyatlarni osonroq tushunishingiz mumkin.", gradient: "from-[hsl(160_60%_45%)] to-[hsl(160_60%_35%)]", iconColor: "text-white" }
];

const tips = [
  "Kuzatuvchi belgilarni diqqat bilan o'qing.",
  "Har bir savolga 30-45 soniya ajrating.",
  "Amaliy savollarni qayta ko'rib, xatolarni tahlil qiling.",
  "Kuniga kamida 1-2 ta variant yechib boring.",
  "Yo'l belgilarini tasvirlar bilan birga yodlang."
];

export default function Qoshimcha() {
  const { user, profile } = useAuth();
  
  return (
    <MainLayout>
      <SEO 
        title="Qo'shimcha ma'lumotlar - Test tayyorgarlik yo'riqnomasi"
        description="Haydovchilik testiga tayyorlanish bo'yicha batafsil yo'riqnoma."
        path="/qoshimcha"
        keywords="test tayyorgarlik, o'rganish strategiyasi, imtihon maslahatlari"
      />

      {/* Hero */}
      <section className="hero-bg py-14 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-14 h-14 mx-auto mb-5 bg-[hsl(250_70%_56%/0.15)] rounded-2xl flex items-center justify-center border border-[hsl(250_70%_56%/0.2)]">
            <Info className="w-7 h-7 text-[hsl(250_70%_75%)]" />
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4">Qo'shimcha ma'lumotlar</h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto mb-8">Testga tayyorlanish bo'yicha batafsil yo'riqnoma, amaliy maslahatlar va qo'llanmalar.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/darslik">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 gap-2 px-6 py-5 rounded-xl">
                <BookOpen className="w-5 h-5" />Darslik
              </Button>
            </Link>
            <Link to="/variant">
              <Button className="bg-gradient-to-r from-[hsl(190_80%_45%)] to-[hsl(190_80%_38%)] hover:from-[hsl(190_80%_38%)] hover:to-[hsl(190_80%_32%)] text-white gap-2 px-6 py-5 rounded-xl border-0">
                <Play className="w-5 h-5" />Testlarni boshlash
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* PREMIUM */}
      <section className="py-12 hero-bg border-y border-primary/15">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Card className="border border-primary/30 bg-card rounded-2xl overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[hsl(250_70%_56%)] to-[hsl(190_80%_45%)] rounded-xl flex items-center justify-center shadow-md shadow-[hsl(250_70%_56%/0.3)]">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-extrabold text-white">PREMIUM Bo'limi Haqida</h2>
              </div>
              <p className="text-white/60 leading-relaxed text-sm mb-6">
                PREMIUM bo'limi oddiy testdan farq qiladi va savollar to'g'riligi to'g'ridan to'g'ri admin tomonidan tekshiriladi. Imtihonda ushbu testlarning tushish ehtimoli yuqori.
              </p>
              {user && profile?.is_pro ? (
                <div className="flex items-center gap-3 bg-[hsl(250_70%_56%/0.1)] border border-[hsl(250_70%_56%/0.25)] rounded-xl px-5 py-3 w-fit">
                  <Crown className="w-5 h-5 text-[hsl(250_70%_75%)]" />
                  <span className="font-semibold text-white">{profile.full_name || profile.username || 'PREMIUM'}</span>
                  <span className="text-xs bg-gradient-to-r from-[hsl(250_70%_56%)] to-[hsl(190_80%_45%)] text-white px-2 py-0.5 rounded-full font-bold">PREMIUM</span>
                </div>
              ) : (
                <Link to="/pro">
                  <Button className="bg-gradient-to-r from-[hsl(250_70%_56%)] to-[hsl(190_80%_45%)] hover:from-[hsl(250_70%_48%)] hover:to-[hsl(190_80%_38%)] text-white gap-2 px-6 py-5 rounded-xl font-bold border-0">
                    <Crown className="w-5 h-5" />PREMIUM obunaga o'tish
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
              <h2 className="text-2xl font-extrabold text-foreground mb-6 text-center">Tez maslahatlar</h2>
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
