import { Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAccessState } from "@/hooks/useAccessState";
import { useState, useEffect, useRef } from "react";
import {
  Play,
  ArrowRight,
  CheckCircle,
  Crown,
  X,
  BookOpen,
  ShieldCheck,
  Zap,
  Trophy,
  MessageCircle,
  Send,
  Phone,
  Star,
  ChevronRight,
  Users,
  BarChart3,
  Clock,
} from "lucide-react";

function useCounter(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setCount(Math.round(eased * target));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

function StatChip({ target, suffix, label }: { target: number; suffix: string; label: string }) {
  const { count, ref } = useCounter(target);
  return (
    <div ref={ref} style={{ textAlign: "center" }}>
      <div style={{ fontSize: 40, fontWeight: 800, color: "#fff", lineHeight: 1, fontFamily: "'Syne', sans-serif" }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 4, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </div>
    </div>
  );
}

export default function Home() {
  const [showProPopup, setShowProPopup] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { isPremium, loading: accessLoading } = useAccessState();

  const handleProRoute = (route: string) => {
    if (accessLoading && user) { navigate(route); return; }
    if (user && isPremium) { navigate(route); } else { setShowProPopup(true); }
  };

  const tabs = [
    { icon: <BarChart3 size={16} />, label: "Variantlar", desc: "61 ta to'liq variant", route: "/variant" },
    { icon: <BookOpen size={16} />, label: "Mavzuli test", desc: "Mavzu bo'yicha mashq", route: "/mavzuli" },
    { icon: <ShieldCheck size={16} />, label: "Yo'l belgilari", desc: "Barcha belgilar", route: "/belgilar" },
  ];

  const testimonials = [
    { name: "Sardor M.", score: "30/30", text: "Birinchi urinishda o'tdim. Savolar bazasi juda keng!", avatar: "SM" },
    { name: "Nilufar K.", score: "29/30", text: "Video darsliklar tushunarliligi zo'r edi.", avatar: "NK" },
    { name: "Jasur T.", score: "28/30", text: "Premium guruh va admin yordami juda foydali.", avatar: "JT" },
  ];

  const CS = {
    bg: "#0A0B14",
    surface: "#111220",
    card: "#16172a",
    border: "rgba(255,255,255,0.07)",
    accent: "#7C6FFF",
    accentB: "#00C9C4",
    accentC: "#FF5F6D",
    textPrimary: "#FFFFFF",
    textSecondary: "rgba(255,255,255,0.55)",
  };

  return (
    <MainLayout>
      <SEO
        title={t("home.seoTitle")}
        description={t("home.seoDescription")}
        path="/"
        keywords="avtotest, avtotest premium, onlayn test, prava test, prava olish, YHQ testlari, yo'l belgilari"
      />

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      {/* PRO Popup */}
      {showProPopup && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }} onClick={() => setShowProPopup(false)} />
          <div style={{ position: "relative", background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 20, padding: "32px 24px", maxWidth: 360, width: "100%", boxShadow: "0 40px 80px rgba(0,0,0,0.6)" }}>
            <button onClick={() => setShowProPopup(false)} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: CS.textSecondary }}>
              <X size={16} />
            </button>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Crown size={26} color="#fff" />
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: CS.textPrimary }}>PREMIUM talab qilinadi</h3>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: CS.textSecondary, lineHeight: 1.6 }}>{t("home.proSubscribePopup")}</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowProPopup(false)} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: `1px solid ${CS.border}`, background: "transparent", color: CS.textSecondary, cursor: "pointer", fontSize: 14 }}>
                Bekor qilish
              </button>
              <button onClick={() => { setShowProPopup(false); navigate("/pro"); }} style={{ flex: 1.5, padding: "11px 0", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Crown size={14} /> Premium olish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HERO */}
      <section style={{ background: CS.bg, position: "relative", overflow: "hidden", minHeight: "100vh", display: "flex", alignItems: "center" }}>
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `
            linear-gradient(rgba(124,111,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(124,111,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }} />
        <div style={{ position: "absolute", top: "10%", left: "-10%", width: 500, height: 500, background: "radial-gradient(circle, rgba(124,111,255,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "5%", right: "-5%", width: 400, height: 400, background: "radial-gradient(circle, rgba(0,201,196,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px", width: "100%", position: "relative" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>

            {/* Left */}
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(124,111,255,0.12)", border: "1px solid rgba(124,111,255,0.25)", borderRadius: 100, padding: "6px 16px", marginBottom: 28 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: CS.accentB, boxShadow: "0 0 8px rgba(0,201,196,0.8)", display: "inline-block" }} />
                <span style={{ fontSize: 13, color: "rgba(124,111,255,0.9)", fontWeight: 600, letterSpacing: "0.04em" }}>YANGILANGAN 2026 BAZA</span>
              </div>

              <h1 style={{ margin: "0 0 20px", fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 800, color: CS.textPrimary, lineHeight: 1.08, fontFamily: "'Syne', sans-serif", letterSpacing: "-0.02em" }}>
                Prava imtihoniga{" "}
                <span style={{ background: `linear-gradient(90deg, ${CS.accent}, ${CS.accentB})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  haqiqiy
                </span>{" "}
                tayyorgarlik
              </h1>

              <p style={{ margin: "0 0 36px", fontSize: 18, color: CS.textSecondary, lineHeight: 1.7, maxWidth: 440 }}>
                Haydovchilik guvohnomasi imtihoniga tayyorlanish uchun eng keng savol bazasi, video darsliklar va real sinov sharoiti.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 48 }}>
                <button
                  onClick={() => navigate("/test-ishlash")}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 28px", borderRadius: 14, background: `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer", boxShadow: `0 8px 32px rgba(124,111,255,0.35)` }}
                >
                  <Play size={18} fill="#fff" /> Test ishlash
                </button>
                <button
                  onClick={() => handleProRoute("/variant")}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 24px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: `1px solid ${CS.border}`, color: CS.textPrimary, fontWeight: 600, fontSize: 16, cursor: "pointer" }}
                >
                  Variantlar <ArrowRight size={16} />
                </button>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                {tabs.map((tab, i) => (
                  <button
                    key={i}
                    onClick={() => { setActiveTab(i); handleProRoute(tab.route); }}
                    style={{ flex: 1, padding: "10px 12px", borderRadius: 12, background: activeTab === i ? "rgba(124,111,255,0.15)" : "rgba(255,255,255,0.04)", border: activeTab === i ? `1px solid rgba(124,111,255,0.4)` : `1px solid ${CS.border}`, cursor: "pointer", transition: "all 0.2s", textAlign: "left" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: activeTab === i ? CS.accent : CS.textSecondary, marginBottom: 2 }}>
                      {tab.icon}
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{tab.label}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{tab.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right — mock test card */}
            <div style={{ position: "relative" }}>
              <div style={{ background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 24, padding: 28, boxShadow: "0 40px 80px rgba(0,0,0,0.5)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <div>
                    <div style={{ fontSize: 12, color: CS.textSecondary, marginBottom: 2 }}>VARIANT 14</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: CS.textPrimary }}>Savol 7 / 30</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,95,109,0.15)", border: "1px solid rgba(255,95,109,0.2)", borderRadius: 100, padding: "6px 14px" }}>
                    <Clock size={13} color={CS.accentC} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: CS.accentC }}>18:43</span>
                  </div>
                </div>

                <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 4, marginBottom: 24, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: "23%", background: `linear-gradient(90deg, ${CS.accent}, ${CS.accentB})`, borderRadius: 4 }} />
                </div>

                <div style={{ fontSize: 15, color: CS.textPrimary, lineHeight: 1.6, marginBottom: 20, fontWeight: 500 }}>
                  Yo'lovchi avtomobil boshqaruvchi haydovchi uchun ruxsat etilgan maksimal tezlik necchi km/soat?
                </div>

                {[
                  { text: "60 km/soat", correct: false },
                  { text: "90 km/soat", correct: true },
                  { text: "110 km/soat", correct: false },
                  { text: "120 km/soat", correct: false },
                ].map((ans, i) => (
                  <div key={i} style={{ padding: "11px 16px", borderRadius: 12, border: ans.correct ? `1px solid rgba(0,201,196,0.5)` : `1px solid ${CS.border}`, background: ans.correct ? "rgba(0,201,196,0.08)" : "rgba(255,255,255,0.03)", marginBottom: 8, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", border: `1.5px solid ${ans.correct ? CS.accentB : "rgba(255,255,255,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {ans.correct && <CheckCircle size={14} color={CS.accentB} />}
                    </div>
                    <span style={{ fontSize: 14, color: ans.correct ? CS.accentB : CS.textSecondary }}>{ans.text}</span>
                    {ans.correct && <span style={{ marginLeft: "auto", fontSize: 12, color: CS.accentB, fontWeight: 600 }}>TO'G'RI</span>}
                  </div>
                ))}

                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  {[1,0,1,1,0,1,1].map((v, i) => (
                    <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: v ? "rgba(0,201,196,0.7)" : "rgba(255,95,109,0.7)" }} />
                  ))}
                  {Array.from({length: 23}).map((_, i) => (
                    <div key={i+7} style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.1)" }} />
                  ))}
                </div>
              </div>

              <div style={{ position: "absolute", top: -16, right: -16, background: `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`, borderRadius: 14, padding: "10px 16px", display: "flex", alignItems: "center", gap: 6, boxShadow: `0 8px 24px rgba(124,111,255,0.4)` }}>
                <Trophy size={16} color="#fff" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>1200+ savol</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ STATS — TUZATILGAN ═══ */}
      <section style={{
        background: "#0A0B14",
        borderTop: "1px solid rgba(124,111,255,0.2)",
        borderBottom: "1px solid rgba(124,111,255,0.2)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 24px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32 }}>
          <StatChip target={1200} suffix="+" label="Savollar bazasi" />
          <StatChip target={61} suffix="" label="Test variantlar" />
          <StatChip target={5000} suffix="+" label="Foydalanuvchilar" />
          <StatChip target={95} suffix="%" label="Muvaffaqiyat darajasi" />
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ background: CS.bg, padding: "96px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: CS.accent, textTransform: "uppercase" }}>Imkoniyatlar</span>
            <h2 style={{ margin: "12px 0 0", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: CS.textPrimary, fontFamily: "'Syne', sans-serif" }}>Nima uchun Avtotest?</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              { icon: <Zap size={24} color={CS.accent} />, title: "Real imtihon sharoiti", desc: "Haqiqiy DYO imtihon formatida 30 savol, 20 daqiqa vaqt. To'liq simulyatsiya.", color: CS.accent },
              { icon: <BookOpen size={24} color={CS.accentB} />, title: "Mavzuli mashqlar", desc: "Zaif mavzularingizni aniqlang va ularga qaratilgan mashqlar biling.", color: CS.accentB },
              { icon: <ShieldCheck size={24} color={CS.accentC} />, title: "Yangilangan 2026 baza", desc: "O'zbekiston YHQ qoidalariga mos 1200+ savol, muntazam yangilanib turadi.", color: CS.accentC },
              { icon: <Play size={24} color={CS.accent} />, title: "Video darsliklar", desc: "Tajribali instruktor tomonidan tushuntirilgan yo'l harakati qoidalari.", color: CS.accent },
              { icon: <Users size={24} color={CS.accentB} />, title: "Premium guruh", desc: "Admin bilan to'g'ridan-to'g'ri aloqa va premium foydalanuvchilar guruhi.", color: CS.accentB },
              { icon: <Trophy size={24} color={CS.accentC} />, title: "Natijalar tahlili", desc: "Har bir testdan so'ng batafsil tahlil: xatolar, vaqt, savol bo'yicha hisobot.", color: CS.accentC },
            ].map((f, i) => (
              <div key={i} style={{ background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 20, padding: "28px 24px", transition: "border-color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = `${f.color}44`)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = CS.border)}
              >
                <div style={{ width: 48, height: 48, borderRadius: 14, background: `${f.color}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  {f.icon}
                </div>
                <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: CS.textPrimary }}>{f.title}</h3>
                <p style={{ margin: 0, fontSize: 14, color: CS.textSecondary, lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ background: CS.surface, borderTop: `1px solid ${CS.border}`, padding: "96px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: CS.accentB, textTransform: "uppercase" }}>Muvaffaqiyat hikoyalari</span>
            <h2 style={{ margin: "12px 0 0", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: CS.textPrimary, fontFamily: "'Syne', sans-serif" }}>Ular o'tdi — siz ham o'tasiz</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {testimonials.map((t, i) => (
              <div key={i} style={{ background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 20, padding: 24 }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                  {Array.from({length: 5}).map((_, s) => <Star key={s} size={14} fill={CS.accentB} color={CS.accentB} />)}
                </div>
                <p style={{ margin: "0 0 20px", fontSize: 15, color: CS.textSecondary, lineHeight: 1.65, fontStyle: "italic" }}>
                  "{t.text}"
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: CS.textPrimary }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: CS.textSecondary }}>Natija: <span style={{ color: CS.accentB, fontWeight: 700 }}>{t.score}</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section style={{ background: CS.bg, padding: "96px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <div style={{ background: `linear-gradient(135deg, rgba(124,111,255,0.12), rgba(0,201,196,0.08))`, border: `1px solid rgba(124,111,255,0.2)`, borderRadius: 28, padding: "56px 40px" }}>
            <Crown size={40} color={CS.accent} style={{ marginBottom: 20 }} />
            <h2 style={{ margin: "0 0 16px", fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, color: CS.textPrimary, fontFamily: "'Syne', sans-serif" }}>
              Premium bilan o'ting!
            </h2>
            <p style={{ margin: "0 0 36px", fontSize: 16, color: CS.textSecondary, lineHeight: 1.7 }}>
              1200+ yopiq savollar bazasi, video darsliklar, admin ko'magi va cheksiz urinishlar.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => navigate("/pro")} style={{ padding: "14px 32px", borderRadius: 14, background: `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: `0 8px 32px rgba(124,111,255,0.35)` }}>
                <Crown size={18} /> Premium ko'rish <ArrowRight size={16} />
              </button>
              <button onClick={() => navigate("/test-ishlash")} style={{ padding: "14px 24px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: `1px solid ${CS.border}`, color: CS.textPrimary, fontWeight: 600, fontSize: 16, cursor: "pointer" }}>
                Bepul sinab ko'rish
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIALS */}
      <section style={{ background: CS.surface, borderTop: `1px solid ${CS.border}`, padding: "64px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <p style={{ margin: "0 0 24px", fontSize: 14, color: CS.textSecondary, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>Bizning ijtimoiy tarmoqlar</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { icon: <MessageCircle size={18} />, name: "Telegram Kanal", handle: "@avtotestu_ad", link: "https://t.me/avtotestu_ad" },
              { icon: <Send size={18} />, name: "Telegram Bot", handle: "@Avtotesturganchbot", link: "https://t.me/Avtotesturganchbot" },
              { icon: <Phone size={18} />, name: "Maktab Bot", handle: "@maktabavtobot", link: "https://t.me/maktabavtobot" },
            ].map((s, i) => (
              <a key={i} href={s.link} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", borderRadius: 14, background: CS.card, border: `1px solid ${CS.border}`, color: CS.textSecondary, textDecoration: "none", transition: "all 0.2s" }}
                onMouseEnter={e => { (e.currentTarget.style.borderColor = `rgba(124,111,255,0.4)`); (e.currentTarget.style.color = CS.textPrimary); }}
                onMouseLeave={e => { (e.currentTarget.style.borderColor = CS.border); (e.currentTarget.style.color = CS.textSecondary); }}
              >
                {s.icon}
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: 11, opacity: 0.6 }}>{s.handle}</div>
                </div>
                <ChevronRight size={14} style={{ marginLeft: 4 }} />
              </a>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}