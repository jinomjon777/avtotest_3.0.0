import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FAQSchema } from "@/components/FAQSchema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Play, ListChecks, ShieldCheck, BarChart3,
  CheckCircle2, ChevronRight, Video, Crown,
} from "lucide-react";

const faqItems = [
  {
    question: "Avto test 2026 qanday ishlaydi?",
    answer:
      "Avto test 2026 — Smartavto.uz platformasidagi yangilangan savollar bazasi asosida tuzilgan onlayn YHQ (yo'l harakati qoidalari) testi. Test tasodifiy yoki rasmiy variant tartibida beriladi, har bir savolga bitta to'g'ri javob tanlanadi, test oxirida natija va xatolar tahlili ko'rsatiladi.",
  },
  {
    question: "Avto test 2026 bepulmi?",
    answer:
      "Ha, asosiy savollar bazasi va standart testlar bepul mavjud. To'liq savollar bazasi, barcha rasmiy variantlar va video darsliklarga kirish uchun Premium obuna talab qilinadi.",
  },
  {
    question: "2026 yilgi savollar qachon yangilangan?",
    answer:
      "Savollar bazasi 2026 yilgi rasmiy YHQ o'zgarishlariga moslab yangilangan va muntazam ravishda yangi savollar qo'shib boriladi.",
  },
  {
    question: "Testda nechta savol beriladi?",
    answer:
      "Haqiqiy imtihon formatiga mos ravishda, standart test 20 ta savoldan iborat va 25 daqiqa vaqt beriladi. Bundan tashqari, kengaytirilgan 50 savolli mashq rejimi ham mavjud.",
  },
];

export default function AvtoTest2026() {
  return (
    <MainLayout>
      <SEO
        title="Avto Test 2026 — Onlayn YHQ Test Savollari"
        description="Avto test 2026: yangilangan YHQ savollari, real imtihon formatida bepul onlayn test. Haydovchilik guvohnomasi (prava) imtihoniga tayyorgarlik ko'ring — hoziroq boshlang!"
        path="/avto-test-2026"
        keywords="avto test 2026, avtotest 2026, avto test 2026 savollari, avto test ishlash 2026, onlayn avto test 2026, avtotest online 2026"
      />
      <Breadcrumbs items={[{ name: "Avto Test 2026", path: "/avto-test-2026" }]} />
      <FAQSchema items={faqItems} />

      {/* Hero */}
      <section className="bg-[hsl(var(--sidebar-background))] py-14 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/25 rounded-full px-4 py-1.5 mb-6 text-xs font-semibold text-primary uppercase tracking-wide">
            Yangilangan 2026 baza
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-[hsl(var(--sidebar-accent-foreground))] mb-5 leading-tight">
            Avto Test 2026 — Onlayn YHQ Test Savollari
          </h1>
          <p className="text-lg text-[hsl(var(--sidebar-foreground))] max-w-2xl mx-auto mb-8">
            Haydovchilik guvohnomasi (prava) imtihoniga tayyorgarlik ko'rish uchun 2026 yilgi yangilangan yo'l harakati qoidalari savollari. Real imtihon formatida onlayn avto test ishlang, natijangizni ko'ring va xatolaringizni tahlil qiling.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/test-ishlash">
              <Button className="bg-gradient-to-r from-[hsl(250_70%_56%)] to-[hsl(190_80%_45%)] hover:opacity-90 text-white gap-2 px-7 py-6 rounded-xl border-0 text-base font-bold">
                <Play className="w-5 h-5" /> Avto testni boshlash
              </Button>
            </Link>
            <Link to="/variant">
              <Button variant="outline" className="gap-2 px-7 py-6 rounded-xl text-base">
                Rasmiy variantlar <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Avto Test 2026 haqida */}
      <section className="py-14 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Avto Test 2026 haqida</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Avto test 2026 — O'zbekistonda haydovchilik guvohnomasi olish uchun topshiriladigan yo'l harakati qoidalari (YHQ) imtihoniga tayyorgarlik ko'rishga mo'ljallangan onlayn platforma. Har yili qoidalarga kiritilgan o'zgarishlar hisobga olinib, savollar bazasi yangilanib boriladi — shu sababli "2026-yilgi" savollar bilan mashq qilish, eskirgan yoki bekor qilingan qoidalar asosidagi savollarni chalkashtirib yubormaslikka yordam beradi.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Platformada savollar mavzular bo'yicha (yo'l belgilari, imtiyozli o'tish, jarima va javobgarlik, texnik xizmat ko'rsatish va boshqalar) hamda rasmiy variant tartibida guruhlangan. Bu esa nafaqat yodlash, balki qoidalarni haqiqatan ham tushunib olishga yordam beradi.
          </p>
        </div>
      </section>

      {/* Prava imtihoniga tayyorgarlik */}
      <section className="py-14 md:py-16 bg-muted/40 border-y border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">Prava imtihoniga tayyorgarlik</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { icon: ListChecks, title: "Mavzuli mashq", desc: "Har bir mavzuni (yo'l belgilari, imtiyozlar, jarimalar) alohida mashq qiling — bo'shliqlaringizni aniqlang." },
              { icon: ShieldCheck, title: "Rasmiy variantlar", desc: "Haqiqiy imtihonda uchraydigan tartibga mos rasmiy test variantlari bilan mashq qiling." },
              { icon: Video, title: "Video darsliklar", desc: "Murakkab qoidalarni video ko'rinishida, tushunarli tilda o'rganing." },
              { icon: BarChart3, title: "Natijalar tahlili", desc: "Har bir test yakunida qaysi mavzularda ko'proq xato qilganingizni ko'ring." },
            ].map((f, i) => (
              <Card key={i} className="border border-border rounded-2xl">
                <CardContent className="p-5 flex gap-4">
                  <div className="w-11 h-11 flex-shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Qanday ishlash kerak */}
      <section className="py-14 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">Avto testni qanday ishlash kerak?</h2>
          <div className="space-y-5">
            {[
              ["1", "\"Test ishlash\" tugmasini bosing", "Bosh sahifada yoki shu sahifadagi tugma orqali testni boshlang. Standart rejim 20 ta savol, 25 daqiqa vaqt bilan ishlaydi — bu real imtihon formatiga mos."],
              ["2", "Savollarga javob bering", "Har bir savolda bitta to'g'ri javobni tanlang. Vaqt hisoblagichi ekranning yuqori qismida ko'rinib turadi."],
              ["3", "Natijangizni ko'ring", "Test tugagach, nechta to'g'ri va noto'g'ri javob berganingiz, shuningdek qaysi savollarda xato qilganingiz batafsil ko'rsatiladi."],
              ["4", "Xatolaringiz ustida ishlang", "Xato qilingan mavzular bo'yicha mavzuli testlar orqali qo'shimcha mashq qiling."],
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

      {/* Test natijalari */}
      <section className="py-14 md:py-16 bg-muted/40 border-y border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Test natijalari</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Har bir avto test yakunlangach, tizim sizga to'g'ri va noto'g'ri javoblar sonini, sarflangan vaqtni hamda qaysi mavzularda ko'proq xato qilganingizni ko'rsatadi. Ro'yxatdan o'tgan foydalanuvchilar uchun barcha natijalar profilda saqlanadi — bu vaqt o'tishi bilan o'z rivojlanishingizni kuzatib borish imkonini beradi.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
            25 daqiqalik real imtihon vaqt sharoiti simulyatsiya qilinadi
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">Ko'p beriladigan savollar</h2>
          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <Card key={i} className="border border-border rounded-2xl">
                <CardContent className="p-5">
                  <h3 className="font-bold text-foreground mb-2">{item.question}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Ichki havolalar */}
      <section className="py-14 md:py-16 bg-muted/40 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-foreground mb-6">Boshqa foydali bo'limlar</h2>
          <div className="flex flex-wrap gap-3">
            <Link to="/variant"><Button variant="outline" size="sm" className="rounded-full">Rasmiy variantlar</Button></Link>
            <Link to="/mavzuli"><Button variant="outline" size="sm" className="rounded-full">Mavzuli testlar</Button></Link>
            <Link to="/belgilar"><Button variant="outline" size="sm" className="rounded-full">Yo'l belgilari</Button></Link>
            <Link to="/darslik"><Button variant="outline" size="sm" className="rounded-full">Video darsliklar</Button></Link>
            <Link to="/avto-test-20-savol"><Button variant="outline" size="sm" className="rounded-full">20 ta savolli test</Button></Link>
            <Link to="/pro"><Button variant="outline" size="sm" className="rounded-full gap-1"><Crown className="w-3.5 h-3.5" />Premium obuna</Button></Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}