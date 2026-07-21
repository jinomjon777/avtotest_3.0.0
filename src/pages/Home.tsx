import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAccessState } from "@/hooks/useAccessState";
import { useTheme } from "@/contexts/ThemeContext";
import { useState, useEffect, useRef } from "react";
import {
  Play, ArrowRight, Crown, X, BookOpen,
  ShieldCheck, Zap, Trophy, MessageCircle, Send,
  Star, ChevronRight, Users,
} from "lucide-react";

function useCounter(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          setCount(Math.round((1 - Math.pow(1 - p, 3)) * target));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);
  return { count, ref };
}

function StatChip({ target, suffix, label }: { target: number; suffix: string; label: string }) {
  const { count, ref } = useCounter(target);
  const { CS } = useTheme();
  return (
    <div ref={ref} style={{ textAlign: "center", padding: "8px 0" }}>
      <div style={{ fontSize: "clamp(26px, 5vw, 36px)", fontWeight: 700, color: CS.textPrimary, lineHeight: 1 }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div style={{ fontSize: "clamp(10px, 2.5vw, 12px)", color: CS.textSecondary, marginTop: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </div>
    </div>
  );
}

export default function Home() {
  const [showProPopup, setShowProPopup] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { isPremium, loading: accessLoading } = useAccessState();
  const { CS } = useTheme();

  const handleProRoute = (route: string) => {
    if (accessLoading && user) { navigate(route); return; }
    if (user && isPremium) { navigate(route); } else { setShowProPopup(true); }
  };

  const testimonials = [
    { name: t("home.test1Name"), score: t("home.test1Score"), text: t("home.test1Text"), avatar: "SM" },
    { name: t("home.test2Name"), score: t("home.test2Score"), text: t("home.test2Text"), avatar: "NK" },
    { name: t("home.test3Name"), score: t("home.test3Score"), text: t("home.test3Text"), avatar: "JT" },
  ];

  const features = [
    { icon: <Zap size={22} />, title: t("home.feat1Title"), desc: t("home.feat1Desc"), color: "#7C6FFF" },
    { icon: <BookOpen size={22} />, title: t("home.feat2Title"), desc: t("home.feat2Desc"), color: "#00C9C4" },
    { icon: <ShieldCheck size={22} />, title: t("home.feat3Title"), desc: t("home.feat3Desc"), color: "#FF5F6D" },
    { icon: <Play size={22} />, title: t("home.feat4Title"), desc: t("home.feat4Desc"), color: "#7C6FFF" },
    { icon: <Users size={22} />, title: t("home.feat5Title"), desc: t("home.feat5Desc"), color: "#00C9C4" },
    { icon: <Trophy size={22} />, title: t("home.feat6Title"), desc: t("home.feat6Desc"), color: "#FF5F6D" },
  ];

  return (
    <MainLayout>
      <SEO
        title={t("home.seoTitle")}
        description={t("home.seoDescription")}
        path="/"
        keywords="avtotest, avtotest premium, onlayn test, prava test, prava olish, YHQ testlari, yo'l belgilari"
      />

      {/* PRO Popup */}
      {showProPopup && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }} onClick={() => setShowProPopup(false)} />
          <div style={{ position: "relative", background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 20, padding: "32px 24px", maxWidth: 360, width: "100%", boxShadow: "0 40px 80px rgba(0,0,0,0.6)" }}>
            <button onClick={() => setShowProPopup(false)} aria-label={t("common.close")} style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: CS.textSecondary }}>
              <X size={16} />
            </button>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <Crown size={24} color="#fff" />
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: CS.textPrimary }}>{t("home.proPopupTitle")}</h3>
            <p style={{ margin: "0 0 20px", fontSize: 14, color: CS.textSecondary, lineHeight: 1.6 }}>{t("home.proSubscribePopup")}</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowProPopup(false)} style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: `1px solid ${CS.border}`, background: "transparent", color: CS.textSecondary, cursor: "pointer", fontSize: 14 }}>
                {t("home.proPopupCancel")}
              </button>
              <button onClick={() => { setShowProPopup(false); navigate("/pro"); }} style={{ flex: 1.5, padding: "10px 0", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Crown size={14} /> {t("home.proPopupBtn")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HERO */}
      <section style={{ background: CS.bg, position: "relative", overflow: "hidden", display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: `linear-gradient(rgba(124,111,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,111,255,0.04) 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
        <div style={{ position: "absolute", top: "10%", left: "-10%", width: "min(500px, 80vw)", height: "min(500px, 80vw)", background: "radial-gradient(circle, rgba(124,111,255,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "5%", right: "-5%", width: "min(400px, 60vw)", height: "min(400px, 60vw)", background: "radial-gradient(circle, rgba(0,201,196,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 20px 44px", width: "100%", position: "relative" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(124,111,255,0.12)", border: "1px solid rgba(124,111,255,0.25)", borderRadius: 100, padding: "5px 14px", marginBottom: 18 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: CS.accentB, boxShadow: "0 0 8px rgba(0,201,196,0.8)", display: "inline-block" }} />
              <span style={{ fontSize: 12, color: "rgba(124,111,255,0.9)", fontWeight: 600, letterSpacing: "0.04em" }}>{t("home.badgeText")}</span>
            </div>

            <h1 style={{ margin: "0 0 14px", fontSize: "clamp(24px, 4.5vw, 44px)", fontWeight: 700, color: CS.textPrimary, lineHeight: 1.2, letterSpacing: "-0.01em" }}>
              {t("home.heroTitle")}
            </h1>

            <p style={{ margin: "0 auto 32px", fontSize: "clamp(14px, 2vw, 16px)", color: CS.textSecondary, lineHeight: 1.7, maxWidth: 480 }}>
              {t("home.heroSubtitle")}
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              <button onClick={() => navigate("/test-ishlash")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "13px 26px", borderRadius: 12, background: `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: `0 6px 24px rgba(124,111,255,0.3)` }}>
                <Play size={16} fill="#fff" /> {t("home.btnTest")}
              </button>
              <button onClick={() => handleProRoute("/variant")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "13px 22px", borderRadius: 12, background: "rgba(255,255,255,0.06)", border: `1px solid ${CS.border}`, color: CS.textPrimary, fontWeight: 600, fontSize: 15, cursor: "pointer" }}>
                {t("home.variantlarBtn")} <ArrowRight size={16} />
              </button>
              <button onClick={() => handleProRoute("/mavzuli")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "13px 22px", borderRadius: 12, background: "rgba(255,255,255,0.06)", border: `1px solid ${CS.border}`, color: CS.textPrimary, fontWeight: 600, fontSize: 15, cursor: "pointer" }}>
                <BookOpen size={16} /> {t("home.btnMavzuli")}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ background: CS.bg, borderTop: `1px solid ${CS.border}`, borderBottom: `1px solid ${CS.border}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 20px", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px 16px" }} className="stats-grid">
          <StatChip target={1200} suffix="+" label={t("home.statQuestions")} />
          <StatChip target={61} suffix="" label={t("home.statVariants")} />
          <StatChip target={5000} suffix="+" label={t("home.statUsers")} />
          <StatChip target={95} suffix="%" label={t("home.statSuccess")} />
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ background: CS.bg, padding: "56px 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: CS.accent, textTransform: "uppercase" }}>{t("home.featuresLabel")}</span>
            <h2 style={{ margin: "10px 0 0", fontSize: "clamp(20px, 4vw, 36px)", fontWeight: 700, color: CS.textPrimary }}>{t("home.featuresTitle")}</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
            {features.map((f, i) => (
              <div key={i} style={{ background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 16, padding: "20px 18px", transition: "border-color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = `${f.color}44`)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = CS.border)}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${f.color}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, color: f.color }}>{f.icon}</div>
                <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 600, color: CS.textPrimary }}>{f.title}</h3>
                <p style={{ margin: 0, fontSize: 13, color: CS.textSecondary, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ background: CS.surface, borderTop: `1px solid ${CS.border}`, padding: "56px 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: CS.accentB, textTransform: "uppercase" }}>{t("home.testimonialsLabel")}</span>
            <h2 style={{ margin: "10px 0 0", fontSize: "clamp(20px, 4vw, 36px)", fontWeight: 700, color: CS.textPrimary }}>{t("home.testimonialsTitle")}</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
            {testimonials.map((tm, i) => (
              <div key={i} style={{ background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 16, padding: 20 }}>
                <div style={{ display: "flex", gap: 3, marginBottom: 12 }}>
                  {Array.from({ length: 5 }).map((_, s) => <Star key={s} size={12} fill={CS.accentB} color={CS.accentB} />)}
                </div>
                <p style={{ margin: "0 0 14px", fontSize: 13, color: CS.textSecondary, lineHeight: 1.6, fontStyle: "italic" }}>"{tm.text}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{tm.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: CS.textPrimary }}>{tm.name}</div>
                    <div style={{ fontSize: 11, color: CS.textSecondary }}>{t("home.resultLabel")}: <span style={{ color: CS.accentB, fontWeight: 700 }}>{tm.score}</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: CS.bg, padding: "56px 20px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <div style={{ background: `linear-gradient(135deg, rgba(124,111,255,0.12), rgba(0,201,196,0.08))`, border: `1px solid rgba(124,111,255,0.2)`, borderRadius: 20, padding: "36px 24px" }}>
            <Crown size={32} color={CS.accent} style={{ marginBottom: 14 }} />
            <h2 style={{ margin: "0 0 12px", fontSize: "clamp(18px, 4vw, 32px)", fontWeight: 700, color: CS.textPrimary }}>{t("home.ctaTitle")}</h2>
            <p style={{ margin: "0 0 24px", fontSize: "clamp(13px, 2vw, 15px)", color: CS.textSecondary, lineHeight: 1.7 }}>{t("home.ctaDesc")}</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => navigate("/pro")} style={{ padding: "11px 22px", borderRadius: 12, background: `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`, border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, boxShadow: `0 6px 24px rgba(124,111,255,0.3)` }}>
                <Crown size={15} /> {t("home.ctaBtnPremium")} <ArrowRight size={14} />
              </button>
              <button onClick={() => navigate("/test-ishlash")} style={{ padding: "11px 18px", borderRadius: 12, background: "rgba(255,255,255,0.06)", border: `1px solid ${CS.border}`, color: CS.textPrimary, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                {t("home.ctaBtnFree")}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIALS */}
      <section style={{ background: CS.surface, borderTop: `1px solid ${CS.border}`, padding: "44px 20px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <p style={{ margin: "0 0 18px", fontSize: 11, color: CS.textSecondary, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>{t("home.socialsTitle")}</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { icon: <MessageCircle size={16} />, name: t("home.social1Name"), handle: "@jumanazarov_0501", link: "https://t.me/+C1uA2w8irLozNWFi" },
              { icon: <Send size={16} />, name: t("home.social2Name"), handle: "@avtotestsPremium_bot", link: "https://t.me/avtotestsPremium_bot" },
            ].map((s, i) => (
              <a key={i} href={s.link} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 12, background: CS.card, border: `1px solid ${CS.border}`, color: CS.textSecondary, textDecoration: "none", transition: "all 0.2s" }}
                onMouseEnter={e => { (e.currentTarget.style.borderColor = `rgba(124,111,255,0.4)`); (e.currentTarget.style.color = CS.textPrimary); }}
                onMouseLeave={e => { (e.currentTarget.style.borderColor = CS.border); (e.currentTarget.style.color = CS.textSecondary); }}>
                {s.icon}
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: 10, opacity: 0.6 }}>{s.handle}</div>
                </div>
                <ChevronRight size={12} style={{ marginLeft: 4 }} />
              </a>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        @media (min-width: 900px) {
          .stats-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
      `}</style>
    </MainLayout>
  );
}