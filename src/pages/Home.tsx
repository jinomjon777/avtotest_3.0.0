import { Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAccessState } from "@/hooks/useAccessState";
import { useState, useEffect, useRef } from "react";
import {
  Play, ArrowRight, CheckCircle, Crown, X, BookOpen,
  ShieldCheck, Zap, Trophy, MessageCircle, Send, Phone,
  Star, ChevronRight, Users, BarChart3, Clock,
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
    <div ref={ref} style={{ textAlign: "center", padding: "8px 0" }}>
      <div style={{ fontSize: "clamp(28px, 6vw, 40px)", fontWeight: 800, color: "#fff", lineHeight: 1, fontFamily: "'Syne', sans-serif" }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div style={{ fontSize: "clamp(10px, 2.5vw, 13px)", color: "rgba(255,255,255,0.55)", marginTop: 4, letterSpacing: "0.04em", textTransform: "uppercase" }}>
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
    { icon: <BarChart3 size={16} />, label: t("home.btnVariantlar"), route: "/variant" },
    { icon: <BookOpen size={16} />, label: t("home.btnMavzuli"), route: "/mavzuli" },
    { icon: <ShieldCheck size={16} />, label: t("home.btnBelgilar"), route: "/belgilar" },
  ];

  const testimonials = [
    { name: t("home.test1Name"), score: t("home.test1Score"), text: t("home.test1Text"), avatar: "SM" },
    { name: t("home.test2Name"), score: t("home.test2Score"), text: t("home.test2Text"), avatar: "NK" },
    { name: t("home.test3Name"), score: t("home.test3Score"), text: t("home.test3Text"), avatar: "JT" },
  ];

  const features = [
    { icon: <Zap size={24} />, title: t("home.feat1Title"), desc: t("home.feat1Desc"), color: "#7C6FFF" },
    { icon: <BookOpen size={24} />, title: t("home.feat2Title"), desc: t("home.feat2Desc"), color: "#00C9C4" },
    { icon: <ShieldCheck size={24} />, title: t("home.feat3Title"), desc: t("home.feat3Desc"), color: "#FF5F6D" },
    { icon: <Play size={24} />, title: t("home.feat4Title"), desc: t("home.feat4Desc"), color: "#7C6FFF" },
    { icon: <Users size={24} />, title: t("home.feat5Title"), desc: t("home.feat5Desc"), color: "#00C9C4" },
    { icon: <Trophy size={24} />, title: t("home.feat6Title"), desc: t("home.feat6Desc"), color: "#FF5F6D" },
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
            <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: CS.textPrimary }}>{t("home.proPopupTitle")}</h3>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: CS.textSecondary, lineHeight: 1.6 }}>{t("home.proSubscribePopup")}</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowProPopup(false)} style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: `1px solid ${CS.border}`, background: "transparent", color: CS.textSecondary, cursor: "pointer", fontSize: 14 }}>
                {t("home.proPopupCancel")}
              </button>
              <button onClick={() => { setShowProPopup(false); navigate("/pro"); }} style={{ flex: 1.5, padding: "11px 0", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Crown size={14} /> {t("home.proPopupBtn")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HERO */}
      <section style={{ background: CS.bg, position: "relative", overflow: "hidden", minHeight: "100vh", display: "flex", alignItems: "center" }}>
        {/* Background grid */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `linear-gradient(rgba(124,111,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,111,255,0.04) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }} />
        <div style={{ position: "absolute", top: "10%", left: "-10%", width: "min(500px, 80vw)", height: "min(500px, 80vw)", background: "radial-gradient(circle, rgba(124,111,255,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "5%", right: "-5%", width: "min(400px, 60vw)", height: "min(400px, 60vw)", background: "radial-gradient(circle, rgba(0,201,196,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 20px 60px", width: "100%", position: "relative" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 48 }} className="hero-grid">

            {/* Left — Text */}
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(124,111,255,0.12)", border: "1px solid rgba(124,111,255,0.25)", borderRadius: 100, padding: "6px 16px", marginBottom: 24 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: CS.accentB, boxShadow: "0 0 8px rgba(0,201,196,0.8)", display: "inline-block" }} />
                <span style={{ fontSize: 13, color: "rgba(124,111,255,0.9)", fontWeight: 600, letterSpacing: "0.04em" }}>{t("home.badgeText")}</span>
              </div>

              <h1 style={{ margin: "0 0 16px", fontSize: "clamp(32px, 6vw, 60px)", fontWeight: 800, color: CS.textPrimary, lineHeight: 1.1, fontFamily: "'Syne', sans-serif", letterSpacing: "-0.02em" }}>
                {t("home.heroTitle")}
              </h1>

              <p style={{ margin: "0 0 32px", fontSize: "clamp(15px, 2.5vw, 18px)", color: CS.textSecondary, lineHeight: 1.7, maxWidth: 440 }}>
                {t("home.heroSubtitle")}
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 32 }}>
                <button
                  onClick={() => navigate("/test-ishlash")}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 24px", borderRadius: 14, background: `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: `0 8px 32px rgba(124,111,255,0.35)` }}
                >
                  <Play size={17} fill="#fff" /> {t("home.btnTest")}
                </button>
                <button
                  onClick={() => handleProRoute("/variant")}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "13px 20px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: `1px solid ${CS.border}`, color: CS.textPrimary, fontWeight: 600, fontSize: 15, cursor: "pointer" }}
                >
                  {t("home.variantlarBtn")} <ArrowRight size={16} />
                </button>
              </div>

              {/* 3 tabs */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {tabs.map((tab, i) => (
                  <button
                    key={i}
                    onClick={() => { setActiveTab(i); handleProRoute(tab.route); }}
                    style={{ flex: "1 1 100px", minWidth: 90, padding: "10px 12px", borderRadius: 12, background: activeTab === i ? "rgba(124,111,255,0.15)" : "rgba(255,255,255,0.04)", border: activeTab === i ? `1px solid rgba(124,111,255,0.4)` : `1px solid ${CS.border}`, cursor: "pointer", transition: "all 0.2s", textAlign: "left" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: activeTab === i ? CS.accent : CS.textSecondary }}>
                      {tab.icon}
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{tab.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right — mock test card (hidden on very small screens) */}
            <div style={{ position: "relative" }} className="hero-card-wrap">
              <div style={{ background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 24, padding: "24px 20px", boxShadow: "0 40px 80px rgba(0,0,0,0.5)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 11, color: CS.textSecondary, marginBottom: 2 }}>VARIANT 14</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: CS.textPrimary }}>Savol 7 / 30</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,95,109,0.15)", border: "1px solid rgba(255,95,109,0.2)", borderRadius: 100, padding: "5px 12px" }}>
                    <Clock size={12} color={CS.accentC} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: CS.accentC }}>18:43</span>
                  </div>
                </div>

                <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 4, marginBottom: 20, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: "23%", background: `linear-gradient(90deg, ${CS.accent}, ${CS.accentB})`, borderRadius: 4 }} />
                </div>

                <div style={{ fontSize: 14, color: CS.textPrimary, lineHeight: 1.6, marginBottom: 16, fontWeight: 500 }}>
                  {t("test.questionExample") || "Yo'lovchi avtomobil haydovchi uchun ruxsat etilgan maksimal tezlik?"}
                </div>

                {[
                  { text: "60 km/soat", correct: false },
                  { text: "90 km/soat", correct: true },
                  { text: "110 km/soat", correct: false },
                  { text: "120 km/soat", correct: false },
                ].map((ans, i) => (
                  <div key={i} style={{ padding: "10px 14px", borderRadius: 10, border: ans.correct ? `1px solid rgba(0,201,196,0.5)` : `1px solid ${CS.border}`, background: ans.correct ? "rgba(0,201,196,0.08)" : "rgba(255,255,255,0.03)", marginBottom: 7, display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", border: `1.5px solid ${ans.correct ? CS.accentB : "rgba(255,255,255,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {ans.correct && <CheckCircle size={12} color={CS.accentB} />}
                    </div>
                    <span style={{ fontSize: 13, color: ans.correct ? CS.accentB : CS.textSecondary }}>{ans.text}</span>
                    {ans.correct && <span style={{ marginLeft: "auto", fontSize: 11, color: CS.accentB, fontWeight: 600 }}>TO'G'RI</span>}
                  </div>
                ))}
              </div>

              <div style={{ position: "absolute", top: -14, right: -14, background: `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`, borderRadius: 12, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6, boxShadow: `0 8px 24px rgba(124,111,255,0.4)` }}>
                <Trophy size={14} color="#fff" />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>1200+ savol</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ background: "#0A0B14", borderTop: "1px solid rgba(124,111,255,0.2)", borderBottom: "1px solid rgba(124,111,255,0.2)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 20px", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px 16px" }} className="stats-grid">
          <StatChip target={1200} suffix="+" label={t("home.statQuestions")} />
          <StatChip target={61} suffix="" label={t("home.statVariants")} />
          <StatChip target={5000} suffix="+" label={t("home.statUsers")} />
          <StatChip target={95} suffix="%" label={t("home.statSuccess")} />
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ background: CS.bg, padding: "72px 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: CS.accent, textTransform: "uppercase" }}>{t("home.featuresLabel")}</span>
            <h2 style={{ margin: "12px 0 0", fontSize: "clamp(24px, 5vw, 44px)", fontWeight: 800, color: CS.textPrimary, fontFamily: "'Syne', sans-serif" }}>{t("home.featuresTitle")}</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {features.map((f, i) => (
              <div key={i} style={{ background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 20, padding: "24px 20px", transition: "border-color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = `${f.color}44`)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = CS.border)}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${f.color}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, color: f.color }}>
                  {f.icon}
                </div>
                <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: CS.textPrimary }}>{f.title}</h3>
                <p style={{ margin: 0, fontSize: 13, color: CS.textSecondary, lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ background: CS.surface, borderTop: `1px solid ${CS.border}`, padding: "72px 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: CS.accentB, textTransform: "uppercase" }}>{t("home.testimonialsLabel")}</span>
            <h2 style={{ margin: "12px 0 0", fontSize: "clamp(24px, 5vw, 44px)", fontWeight: 800, color: CS.textPrimary, fontFamily: "'Syne', sans-serif" }}>{t("home.testimonialsTitle")}</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {testimonials.map((tm, i) => (
              <div key={i} style={{ background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 20, padding: 22 }}>
                <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>
                  {Array.from({ length: 5 }).map((_, s) => <Star key={s} size={13} fill={CS.accentB} color={CS.accentB} />)}
                </div>
                <p style={{ margin: "0 0 18px", fontSize: 14, color: CS.textSecondary, lineHeight: 1.65, fontStyle: "italic" }}>
                  "{tm.text}"
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {tm.avatar}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: CS.textPrimary }}>{tm.name}</div>
                    <div style={{ fontSize: 11, color: CS.textSecondary }}>Natija: <span style={{ color: CS.accentB, fontWeight: 700 }}>{tm.score}</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section style={{ background: CS.bg, padding: "72px 20px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <div style={{ background: `linear-gradient(135deg, rgba(124,111,255,0.12), rgba(0,201,196,0.08))`, border: `1px solid rgba(124,111,255,0.2)`, borderRadius: 24, padding: "44px 28px" }}>
            <Crown size={36} color={CS.accent} style={{ marginBottom: 16 }} />
            <h2 style={{ margin: "0 0 14px", fontSize: "clamp(22px, 5vw, 40px)", fontWeight: 800, color: CS.textPrimary, fontFamily: "'Syne', sans-serif" }}>
              {t("home.ctaTitle")}
            </h2>
            <p style={{ margin: "0 0 32px", fontSize: "clamp(14px, 2.5vw, 16px)", color: CS.textSecondary, lineHeight: 1.7 }}>
              {t("home.ctaDesc")}
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => navigate("/pro")} style={{ padding: "13px 28px", borderRadius: 14, background: `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: `0 8px 32px rgba(124,111,255,0.35)` }}>
                <Crown size={17} /> {t("home.ctaBtnPremium")} <ArrowRight size={15} />
              </button>
              <button onClick={() => navigate("/test-ishlash")} style={{ padding: "13px 20px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: `1px solid ${CS.border}`, color: CS.textPrimary, fontWeight: 600, fontSize: 15, cursor: "pointer" }}>
                {t("home.ctaBtnFree")}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIALS */}
      <section style={{ background: CS.surface, borderTop: `1px solid ${CS.border}`, padding: "56px 20px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <p style={{ margin: "0 0 22px", fontSize: 12, color: CS.textSecondary, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>{t("home.socialsTitle")}</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { icon: <MessageCircle size={17} />, name: t("home.social1Name"), handle: "@jumanazarov_0501", link: "https://t.me/jumanazarov_0501" },
              { icon: <Send size={17} />, name: t("home.social2Name"), handle: "@jumanazarov_0501", link: "https://t.me/jumanazarov_0501" },
              { icon: <Phone size={17} />, name: t("home.social3Name"), handle: "@jumanazarov_0501", link: "https://t.me/jumanazarov_0501" },
            ].map((s, i) => (
              <a key={i} href={s.link} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 18px", borderRadius: 14, background: CS.card, border: `1px solid ${CS.border}`, color: CS.textSecondary, textDecoration: "none", transition: "all 0.2s" }}
                onMouseEnter={e => { (e.currentTarget.style.borderColor = `rgba(124,111,255,0.4)`); (e.currentTarget.style.color = CS.textPrimary); }}
                onMouseLeave={e => { (e.currentTarget.style.borderColor = CS.border); (e.currentTarget.style.color = CS.textSecondary); }}
              >
                {s.icon}
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: 11, opacity: 0.6 }}>{s.handle}</div>
                </div>
                <ChevronRight size={13} style={{ marginLeft: 4 }} />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile responsive styles */}
      <style>{`
        @media (min-width: 900px) {
          .hero-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 64px !important;
          }
          .stats-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
        @media (max-width: 480px) {
          .hero-card-wrap {
            display: none;
          }
        }
      `}</style>
    </MainLayout>
  );
}
