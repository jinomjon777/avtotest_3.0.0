import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProAccess } from "@/hooks/useProAccess";
import { useTestSession } from "@/hooks/useTestSession";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { MavzuliTestInterface } from "@/components/MavzuliTestInterface";
import { Button } from "@/components/ui/button";
import { User, LogIn, Home, Play, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const topics = [
  { id: '31', name: { uz_lat: 'Barcha savollar', uz_cyr: 'Барча саволлар', ru: 'Все вопросы' } },
  { id: '35a', name: { uz_lat: "Yangi savollar1", uz_cyr: "Янги саволлар1", ru: "Новые вопросы1" } },
  { id: '35b', name: { uz_lat: "Yangi savollar2", uz_cyr: "Янги саволлар2", ru: "Новые вопросы2" } },
  { id: '1', name: { uz_lat: "Umumiy qoidalar", uz_cyr: "Умумий қоидалар", ru: "Общие правила" } },
  { id: '3', name: { uz_lat: "Ogohlantiruvchi belgilar", uz_cyr: "Огоҳлантирувчи белгилар", ru: "Предупреждающие знаки" } },
  { id: '4', name: { uz_lat: "Imtiyoz belgilar", uz_cyr: "Имтиёз белгилар", ru: "Знаки приоритета" } },
  { id: '5', name: { uz_lat: "Taqiqlovchi belgilar", uz_cyr: "Тақиқловчи белгилар", ru: "Запрещающие знаки" } },
  { id: '6', name: { uz_lat: "Buyuruvchi belgilar", uz_cyr: "Буюрувчи белгилар", ru: "Предписывающие знаки" } },
  { id: '7', name: { uz_lat: "Axborot ishora belgilari", uz_cyr: "Ахборот ишора белгилари", ru: "Информационные знаки" } },
  { id: '8', name: { uz_lat: "Qo'shimcha axborot belgilari", uz_cyr: "Қўшимча ахборот белгилари", ru: "Дополнительные информационные знаки" } },
  { id: '20', name: { uz_lat: "Chorrahalarda harakatlanish", uz_cyr: "Чорраҳаларда ҳаракатланиш", ru: "Движение на перекрестках" } },
  { id: '34', name: { uz_lat: "Teng ahamiyatli chorrahalar", uz_cyr: "Тенг аҳамиятли чорраҳалар", ru: "Равнозначные перекрестки" } },
  { id: '9', name: { uz_lat: "Yotiq chiziqlar 1", uz_cyr: "Ётиқ чизиқлар 1", ru: "Горизонтальная разметка 1" } },
  { id: '10', name: { uz_lat: "Yotiq va tik chiziqlar 2", uz_cyr: "Ётиқ ва тик чизиқлар 2", ru: "Горизонтальная и вертикальная разметка 2" } },
  { id: '11', name: { uz_lat: "Svetafor ishoralari", uz_cyr: "Светафор ишоралари", ru: "Сигналы светофора" } },
  { id: '12', name: { uz_lat: "Tartibga soluvchining ishoralari", uz_cyr: "Тартибга солувчининг ишоралари", ru: "Сигналы регулировщика" } },
  { id: '13', name: { uz_lat: "Ogohlantiruvchi va avariya ishoralari", uz_cyr: "Огоҳлантирувчи ва авария ишоралари", ru: "Предупредительные и аварийные сигналы" } },
  { id: '14', name: { uz_lat: "Yo'llarda harakatlanish", uz_cyr: "", ru: "Начало движения (Маневр)" } },
  { id: '15', name: { uz_lat: "Transport vositalarining joylashuvi", uz_cyr: "Йўлнинг қатнов қисмида транспорт воситаларининг жойлашуви", ru: "Расположение транспортных средств на проезжей части" } },
  { id: '16', name: { uz_lat: "Harakatlanish tezligi", uz_cyr: "Ҳаракатланиш тезлиги", ru: "Скорость движения" } },
  { id: '17', name: { uz_lat: "Quvib o'tish", uz_cyr: "Қувиб ўтиш", ru: "Обгон" } },
  { id: '18', name: { uz_lat: "To'xtash va to'xtab turish qoidalari 1", uz_cyr: "Тўхташ ва тўхтаб туриш қоидалари 1", ru: "Правила остановки и стоянки 1" } },
  { id: '19', name: { uz_lat: "To'xtash va to'xtab turish qoidalari 2", uz_cyr: "Тўхташ ва тўхтаб туриш қоидалари 2", ru: "Правила остановки и стоянки 2" } },
  { id: '33', name: { uz_lat: "Tartibga solinmagan chorrahada asosiy yo'l", uz_cyr: "Тартибга солинмаган чорраҳада асосий йўл", ru: "Главная дорога на нерегулируемом перекрестке" } },
  { id: '2', name: { uz_lat: "Haydovchining umumiy vazifalari", uz_cyr: "Ҳайдовчининг умумий вазифалари ва пиёдалар", ru: "Общие обязанности водителя и пешеходы" } },
  { id: '21', name: { uz_lat: "Piyodalar o'tish joylari va turar joylar", uz_cyr: "Пиёдалар ўтиш жойлари ва турар жой даҳаларида ҳаракатланиш", ru: "Пешеходные переходы и движение в жилых зонах" } },
  { id: '22', name: { uz_lat: "Temir yo'l kesishmalari va Avtomagistrallar", uz_cyr: "Темир йўл кесишмалари ва Автомагистраллар", ru: "Железнодорожные переезды и движение по автомагистралям" } },
  { id: '23', name: { uz_lat: "Yo'nalishli transport vositalarining imtiyozlari", uz_cyr: "Йўналишли транспорт воситаларининг имтиёзлари ва ташқи ёритиш", ru: "Преимущества маршрутных транспортных средств" } },
  { id: '24', name: { uz_lat: "Shatakka olish", uz_cyr: "Транспорт воситаларини шатакка олиш", ru: "Буксировка транспортных средств" } },
  { id: '25', name: { uz_lat: "Yo'l harakati xavfsizligini ta'minlash", uz_cyr: "Йўл ҳаракати хавфсизлигини таъминлаш", ru: "Обучение вождению" } },
  { id: '26', name: { uz_lat: "Odam va yuk tashish", uz_cyr: "Одам ва юк ташиш", ru: "Перевозка людей и грузов" } },
  { id: '27', name: { uz_lat: "Harakatlanish taqiqlanadigan vaziyatlar", uz_cyr: "Транспорт воситаларида ҳаракатланиш тақиқланадиган вазиятлар", ru: "Ситуации, когда запрещено движение транспортных средств" } },
  { id: '28', name: { uz_lat: "Harakat xavfsizligini ta'minlash 1", uz_cyr: "Ҳаракат хавфсизлигини таъминлаш 1", ru: "Обеспечение безопасности движения 1" } },
  { id: '29', name: { uz_lat: "Harakat xavfsizligini ta'minlash 2", uz_cyr: "Ҳаракат хавфсизлигини таъминлаш 2", ru: "Обеспечение безопасности движения 2" } },
  { id: '30', name: { uz_lat: "Birinchi tibbiy yordam", uz_cyr: "Биринчи тиббий ёрдам", ru: "Первая медицинская помощь" } },
];

const languages = [
  { id: "uz-lat" as const, label: "O'zbekcha", flag: "🇺🇿" },
  { id: "uz" as const, label: "Ўзбекча", flag: "🇺🇿" },
  { id: "ru" as const, label: "Русский", flag: "🇷🇺" },
];

export default function MavzuliTestlar() {
  const mavzuliStorageKey = 'mavzuli_activeTest';

  const getInitialState = () => {
    try {
      const saved = localStorage.getItem(mavzuliStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.testStarted && parsed.selectedTopic) {
          const testKey = `testState_mavzuli_${parsed.selectedTopic}`;
          if (!localStorage.getItem(testKey)) {
            localStorage.removeItem(mavzuliStorageKey);
            return { selectedTopic: null as string | null, testStarted: false, sessionId: null as string | null };
          }
          return {
            selectedTopic: parsed.selectedTopic as string,
            testStarted: true,
            sessionId: (parsed.sessionId ?? null) as string | null,
          };
        }
      }
    } catch (e) { /* ignore */ }
    return { selectedTopic: null as string | null, testStarted: false, sessionId: null as string | null };
  };

  const initial = getInitialState();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(initial.selectedTopic);
  const [testStarted, setTestStarted] = useState(initial.testStarted);
  const [sessionId, setSessionId] = useState<string | null>(initial.sessionId);
  const [startError, setStartError] = useState<string | null>(null);
  const { user, profile, isLoading } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const { hasAccess, loading: accessLoading } = useProAccess('/pro', true);
  const { starting, startSession } = useTestSession();

  useEffect(() => {
    try {
      if (testStarted && selectedTopic) {
        localStorage.setItem(mavzuliStorageKey, JSON.stringify({ testStarted, selectedTopic, sessionId }));
      } else {
        localStorage.removeItem(mavzuliStorageKey);
      }
    } catch (e) { /* ignore */ }
  }, [testStarted, selectedTopic, sessionId]);

  useEffect(() => {
    if (accessLoading) return;
    if (!hasAccess) return;
  }, [accessLoading, hasAccess]);

  const getTopicName = (topic: typeof topics[0]) => {
    const langKey = language === 'uz-lat' ? 'uz_lat' : language === 'uz' ? 'uz_cyr' : 'ru';
    return topic.name[langKey];
  };

  const handleStartTest = async () => {
    if (selectedTopic === null) return;
    setStartError(null);
    const result = await startSession({
      variant: parseInt(selectedTopic, 10) || 0,
      questionSource: `t${selectedTopic}.json`,
      isPremium: true,
    });
    if (!result.ok) {
      setStartError(
        result.error === 'no_premium_access'
          ? 'Bu mavzuni boshlash uchun PREMIUM obuna kerak.'
          : 'Serverga ulanishda xatolik. Qayta urinib ko\'ring.'
      );
      return;
    }
    setSessionId(result.session?.sessionId ?? null);
    setTestStarted(true);
  };

  const handleMobileTopicTap = async (topicId: string) => {
    if (selectedTopic === topicId) {
      await handleStartTest();
    } else {
      setSelectedTopic(topicId);
    }
  };

  const getTopicButtonClass = (topicId: string) => {
    const isSelected = selectedTopic === topicId;
    return isSelected
      ? 'bg-primary/15 text-primary border-primary/50'
      : 'bg-muted/30 text-foreground border-border hover:border-primary/40';
  };

  if (isLoading || accessLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-medium">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (testStarted && selectedTopic) {
    const topic = topics.find(t => t.id === selectedTopic)!;
    return (
      <MavzuliTestInterface
        onExit={() => {
          setTestStarted(false);
          setSelectedTopic(null);
          setSessionId(null);
          setStartError(null);
        }}
        topicId={selectedTopic}
        topicName={getTopicName(topic)}
        sessionId={sessionId}
        isPremiumSession={true}
      />
    );
  }

  return (
    <MainLayout>
      <SEO 
        title="Mavzuli testlar - YHQ bo'yicha mavzular"
        description="Yo'l harakati qoidalari bo'yicha mavzuli testlar."
        path="/mavzuli"
        keywords="mavzuli test, YHQ mavzulari, yo'l qoidalari"
      />
      <div className="min-h-screen bg-background">
        {/* Mobile Layout */}
        <div className="lg:hidden flex flex-col min-h-screen">
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
                  className={`flex-1 text-xs ${language === lang.id ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold" : "text-white/60 hover:text-white hover:bg-white/10"}`}
                  onClick={() => setLanguage(lang.id)}
                >
                  {lang.flag} {lang.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="bg-card border-b border-border p-4">
            {selectedTopic ? (
              <div className="mb-3 p-4 bg-primary/10 rounded-xl border border-primary/30 text-center">
                <div className="text-sm font-semibold text-primary">
                  {getTopicName(topics.find(t => t.id === selectedTopic)!)}
                </div>
              </div>
            ) : (
              <div className="mb-3 p-4 bg-muted/20 rounded-xl border border-border text-center">
                <div className="text-sm text-muted-foreground">
                  {language === 'ru' ? 'Выберите тему ниже' : language === 'uz' ? 'Қуйидан мавзу танланг' : 'Quyidan mavzu tanlang'}
                </div>
              </div>
            )}
            {startError && (
              <div className="mb-2 flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                <p className="text-xs text-destructive">{startError}</p>
              </div>
            )}
            <Button size="lg" className="w-full gap-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-black font-bold" onClick={handleStartTest} disabled={selectedTopic === null || starting}>
              {starting ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Play className="w-5 h-5" />}
              {selectedTopic ? "Testni boshlash" : "Mavzunu tanlang"}
            </Button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <h2 className="text-lg font-bold text-foreground mb-3">{language === 'ru' ? 'Темы' : language === 'uz' ? 'Мавзулар' : 'Mavzular'}</h2>
            <div className="space-y-2">
              {topics.map((topic) => (
                <Button
                  key={topic.id}
                  variant="outline"
                  className={`w-full justify-start text-left h-auto py-3 px-4 ${getTopicButtonClass(topic.id)}`}
                  onClick={() => handleMobileTopicTap(topic.id)}
                >
                  <span className="text-sm font-medium">{getTopicName(topic)}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex h-screen overflow-hidden">
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
              <div className="mb-4">
                <h3 className="text-[10px] font-medium text-white/40 mb-1.5">Til tanlash</h3>
                <div className="flex gap-1.5">
                  {languages.map((lang) => (
                    <Button
                      key={lang.id}
                      variant="ghost"
                      size="sm"
                      className={`flex-1 text-[11px] h-8 ${language === lang.id ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-bold" : "text-white/50 hover:text-white hover:bg-white/10"}`}
                      onClick={() => setLanguage(lang.id)}
                    >
                      {lang.label}
                    </Button>
                  ))}
                </div>
              </div>
              {selectedTopic ? (
                <div className="mb-4 p-4 bg-primary/10 rounded-xl border-2 border-primary/30 shadow-sm shadow-primary/10">
                  <div className="text-center">
                    <div className="text-sm font-bold text-primary leading-tight">
                      {getTopicName(topics.find(t => t.id === selectedTopic)!)}
                    </div>
                    <div className="text-[10px] text-white/40 mt-1">{language === 'ru' ? 'Выбранная тема' : language === 'uz' ? 'Танланган мавзу' : 'Tanlangan mavzu'}</div>
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-4 bg-white/5 rounded-xl border-2 border-dashed border-white/20">
                  <div className="text-center text-white/40 text-xs">
                    {language === 'ru' ? 'Выберите тему справа' : language === 'uz' ? 'Ўнг томондан мавзу танланг' : 'O\'ng tomondan mavzu tanlang'}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="text-xl font-bold text-blue-400">∞</div>
                  <div className="text-[9px] text-blue-400/70 mt-0.5">Savollar</div>
                </div>
                <div className="text-center p-2.5 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <div className="text-xl font-bold text-purple-400">60</div>
                  <div className="text-[9px] text-purple-400/70 mt-0.5">daqiqa</div>
                </div>
                <div className="text-center p-2.5 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="text-xl font-bold text-green-400">80%</div>
                  <div className="text-[9px] text-green-400/70 mt-0.5">O'tish balli</div>
                </div>
              </div>
              {startError && (
                <div className="mb-2 flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-xs text-red-400">{startError}</p>
                </div>
              )}
              <Button size="lg" className="w-full mb-3 gap-2 h-12 text-sm font-bold shadow-lg shadow-amber-500/20 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-black" onClick={handleStartTest} disabled={selectedTopic === null || starting}>
                {starting ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Play className="w-4 h-4" />}
                {selectedTopic ? "Testni boshlash" : "Mavzunu tanlang"}
              </Button>
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <h3 className="text-[10px] font-semibold text-white/80 mb-1.5 flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-amber-400" />
                  Ko'rsatmalar
                </h3>
                <div className="text-[10px] text-white/40 space-y-1">
                  <div className="flex items-start gap-1.5">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span>Mavzu bo'yicha barcha savollar beriladi</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span>Har bir savol uchun javob tanlang</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span>Test tugagach natijani ko'ring</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-[70%] bg-background p-8 overflow-y-auto">
            <div className="max-w-5xl">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground mb-1">{language === 'ru' ? 'Тематические тесты' : language === 'uz' ? 'Мавзули тестлар' : 'Mavzuli testlar'}</h1>
                <p className="text-sm text-muted-foreground">
                  {language === 'ru' ? 'Проверьте свои знания по темам' : language === 'uz' ? 'Мавзу бўйича билимингизни синанг' : 'Mavzu bo\'yicha bilimingizni sinang'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {topics.map((topic) => (
                  <Button
                    key={topic.id}
                    variant="outline"
                    className={`h-auto py-4 px-4 text-left justify-start transition-all ${getTopicButtonClass(topic.id)}`}
                    onClick={() => setSelectedTopic(topic.id)}
                  >
                    <span className="text-sm font-medium leading-snug">{getTopicName(topic)}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
