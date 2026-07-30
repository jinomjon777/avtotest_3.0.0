import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FAQSchema } from "@/components/FAQSchema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Clock, HelpCircle, CheckCircle2, Shuffle, ChevronRight } from "lucide-react";

const faqItems = [
  {
    question: "20 savollik avto test nimaga tengligini bildiradi?",
    answer:
      "20 ta savol — O'zbekistondagi haqiqiy haydovchilik guvohnomasi imtihonining standart formatiga mos keladi. Bu format qisqa vaqt ichida bilimingizni real imtihon sharoitiga yaqin tarzda sinab ko'rish imkonini beradi.",
  },
  {
    question: "20 savolli testga qancha vaqt beriladi?",
    answer: "Standart 20 savolli avto test uchun 25 daqiqa vaqt beriladi — bu real imtihon vaqt me'yoriga mos.",
  },
  {
    question: "Savollar har safar bir xilmi?",
    answer:
      "Yo'q. 20 savolli test rejimida savollar bazadan tasodifiy tanlanadi, shuning uchun har safar boshqacha savollar to'plami bilan mashq qilasiz.",
  },
  {
    question: "Nechta xato bilan test \"o'tgan\" hisoblanadi?",
    answer:
      "Bu ko'rsatkich rasmiy imtihon talablariga bog'liq bo'lib, odatda ozgina xato bilan ham testdan o'tish mumkin. Platformada har bir urinishdan so'ng aniq necha to'g'ri va noto'g'ri javob berganingiz ko'rsatiladi.",
  },
];

export default function AvtoTest20Savol() {
  return (
    <MainLayout>
      <SEO
        title="Avto Test 20 Savol — Onlayn 20 Savollik Test"
        description="Avto test 20 savol: real imtihon formatida, 25 daqiqada onlayn test ishlang. 20 savollik avtotest bilan haydovchilik guvohnomasi imtihoniga tayyorlaning — bepul boshlang!"
        path="/avto-test-20-savol"
        keywords="avto test 20 savol, 20 ta avto test, 20 savollik avtotest, online avto test 20 savol"
      />
      <Breadcrumbs items={[{ name: "Avto Test 20 Savol", path: "/avto-test-20-savol" }]} />
      <FAQSchema items={faqItems} />

      {/* Hero */}
      <section className="bg-[hsl(var(--sidebar-background))] py-14 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-[hsl(var(--sidebar-accent-foreground))] mb-5 leading-tight">
            Avto Test 20 Savol — Onlayn Test
          </h1>
          <p className="text-lg text-[hsl(var(--sidebar-foreground))] max-w-xl mx-auto mb-8">
            Real imtihon formatiga mos, 20 ta savoldan iborat onlayn avto test. 25 daqiqa vaqt ichida bilimingizni sinab ko'ring va natijangizni darhol bilib oling.
          </p>

          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-8">
            <div className="bg-card border border-border rounded-xl py-4">
              <HelpCircle className="w-5 h-5 text-primary mx-auto mb-1.5" />
              <div className="text-xl font-black text-foreground">20</div>
              <div className="text-xs text-muted-foreground">savol</div>
            </div>
            <div className="bg-card border border-border rounded-xl py-4">
              <Clock className="w-5 h-5 text-primary mx-auto mb-1.5" />
              <div className="text-xl font-black text-foreground">25</div>
              <div className="text-xs text-muted-foreground">daqiqa</div>
            </div>
            <div className="bg-card border border-border rounded-xl py-4">
              <Shuffle className="w-5 h-5 text-primary mx-auto mb-1.5" />
              <div className="text-xl font-black text-foreground">∞</div>
              <div className="text-xs text-muted-foreground">urinish</div>
            </div>
          </div>

          <Link to="/test-ishlash">
            <Button className="bg-gradient-to-r from-[hsl(250_70%_56%)] to-[hsl(190_80%_45%)] hover:opacity-90 text-white gap-2 px-8 py-6 rounded-xl border-0 text-base font-bold">
              <Play className="w-5 h-5" /> 20 savollik testni boshlash
            </Button>
          </Link>
        </div>
      </section>

      {/* Nima uchun 20 savol */}
      <section className="py-14 md:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Nega aynan 20 ta savol?</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            20 savollik format O'zbekistondagi haydovchilik guvohnomasi olish uchun topshiriladigan haqiqiy YHQ imtihonining standart tuzilishiga mos keladi. Shu sababli bu rejim orqali mashq qilish sizga nafaqat qoidalarni bilishni, balki chegaralangan vaqt sharoitida tez va aniq qaror qabul qilishni ham o'rgatadi — bu esa haqiqiy imtihonda ishonch bilan harakat qilishga yordam beradi.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Savollar har safar tasodifiy tartibda va bazadagi turli mavzulardan tanlanadi, shuning uchun test har safar boshqacha ko'rinishda o'tadi — bu esa faqat javoblarni yodlab olishning oldini oladi.
          </p>
        </div>
      </section>

      {/* Qadamlar */}
      <section className="py-14 md:py-16 bg-muted/40 border-y border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">Qanday boshlash mumkin?</h2>
          <div className="space-y-5">
            {[
              ["1", "Yuqoridagi tugmani bosing", "\"20 savollik testni boshlash\" tugmasi sizni test sahifasiga olib boradi, u yerda standart rejim allaqachon 20 savol / 25 daqiqaga sozlangan."],
              ["2", "Testni yakunlang", "Barcha savollarga javob bering yoki vaqt tugaguncha kutib turing — test avtomatik yakunlanadi."],
              ["3", "Natijani tahlil qiling", "Nechta to'g'ri, nechta noto'g'ri javob berganingizni va qaysi mavzuda ko'proq xato qilganingizni ko'ring."],
            ].map(([num, title, desc]) => (
              <div key={num} className="flex gap-4">
                <div className="w-9 h-9 flex-shrink-0 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm">{num}</div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 md:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">Ko'p beriladigan savollar</h2>
          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <Card key={i} className="border border-border rounded-2xl">
                <CardContent className="p-5">
                  <h3 className="font-bold text-foreground mb-2 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" /> {item.question}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed pl-6">{item.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Ichki havolalar */}
      <section className="py-14 md:py-16 bg-muted/40 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-foreground mb-6">Boshqa test rejimlari</h2>
          <div className="flex flex-wrap gap-3">
            <Link to="/avto-test-2026"><Button variant="outline" size="sm" className="rounded-full gap-1">Avto Test 2026 <ChevronRight className="w-3.5 h-3.5" /></Button></Link>
            <Link to="/variant"><Button variant="outline" size="sm" className="rounded-full">Rasmiy variantlar</Button></Link>
            <Link to="/mavzuli"><Button variant="outline" size="sm" className="rounded-full">Mavzuli testlar</Button></Link>
            <Link to="/belgilar"><Button variant="outline" size="sm" className="rounded-full">Yo'l belgilari</Button></Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}