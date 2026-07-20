import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAccessState } from "@/hooks/useAccessState";
import { useState } from "react";
import {
  Crown, Check, X, Zap, ShieldCheck, Clock, BookOpen,
  PlayCircle, Database, Send, Star, Users, ArrowRight,
  MessageCircle, Sparkles, Lock,
} from "lucide-react";

interface Plan {
  id: string; name: string; price: string; period: string;
  badge?: string; savings?: string; highlight: boolean;
}

function PlanCard({ plan, onSelect }: { plan: Plan; onSelect: (p: Plan) => void }) {
  const [hovered, setHovered] = useState(false);
  const { CS } = useTheme();
  const { t } = useLanguage();
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(plan)}
      style={{
        position:     "relative",
        background:   plan.highlight
          ? `linear-gradient(160deg, rgba(124,111,255,0.18), rgba(0,201,196,0.10))`
          : hovered ? CS.cardHover : CS.card,
        border:       plan.highlight
          ? `2px solid rgba(124,111,255,0.55)`
          : hovered ? `1px solid ${CS.borderHover}` : `1px solid ${CS.border}`,
        borderRadius: 24,
        padding:      plan.highlight ? "36px 24px" : "32px 24px",
        cursor:       "pointer",
        transition:   "all 0.25s ease",
        boxShadow:    plan.highlight
          ? "0 24px 60px rgba(124,111,255,0.25)"
          : hovered ? "0 12px 32px rgba(0,0,0,0.15)" : "none",
      }}
    >
      {plan.badge && (
        <div style={{
          position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
          background: `linear-gradient(90deg, ${CS.accent}, ${CS.accentB})`,
          borderRadius: 100, padding: "5px 18px",
          fontSize: 11, fontWeight: 800, color: "#fff",
          letterSpacing: "0.08em", whiteSpace: "nowrap",
        }}>
          ⚡ {plan.badge}
        </div>
      )}
      {plan.savings && (
        <div style={{
          position: "absolute", top: 16, right: 16,
          background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.3)",
          borderRadius: 100, padding: "4px 12px",
          fontSize: 11, fontWeight: 700, color: CS.gold,
        }}>
          {plan.savings}
        </div>
      )}
      <div style={{ fontSize: 13, fontWeight: 700, color: CS.textSecondary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
        {plan.name}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
        <span style={{ fontSize: 36, fontWeight: 800, color: CS.textPrimary, fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>
          {plan.price}
        </span>
        <span style={{ fontSize: 14, color: CS.textSecondary }}>{t("common.som")}</span>
      </div>
      <div style={{ fontSize: 13, color: CS.textHint, marginBottom: 24 }}>{plan.period} {t("pro.planPeriod")}</div>

      <button
        style={{
          width: "100%",
          padding: "13px 0",
          borderRadius: 14,
          border: plan.highlight ? "none" : `1px solid ${CS.border}`,
          background: plan.highlight
            ? `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`
            : CS.surface,
          color: plan.highlight ? "#fff" : CS.textPrimary,
          fontWeight: 700,
          fontSize: 15,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          boxShadow: plan.highlight ? `0 8px 24px rgba(124,111,255,0.35)` : "none",
        }}
      >
        <Crown size={16} /> {plan.name} {t("pro.planGetBtn")} <ArrowRight size={14} />
      </button>

      <div style={{ marginTop: 16, fontSize: 12, color: CS.textHint, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <Send size={11} /> {t("pro.planContact")}
      </div>
    </div>
  );
}

export default function Pro() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();
  const { CS } = useTheme();
  const { isPremium, expiresAt } = useAccessState();

  const FEATURES = [
    { icon: Database,    label: t("pro.feat1"),    pro: true, free: false },
    { icon: PlayCircle,  label: t("pro.feat2"),    pro: true, free: false },
    { icon: BookOpen,    label: t("pro.feat3"),    pro: true, free: true  },
    { icon: Zap,         label: t("pro.feat4"),    pro: true, free: false },
    { icon: Users,       label: t("pro.feat5"),    pro: true, free: false },
    { icon: Clock,       label: t("pro.feat6"),    pro: true, free: false },
    { icon: ShieldCheck, label: t("pro.feat7"),    pro: true, free: true  },
    { icon: Star,        label: t("pro.feat8"),    pro: true, free: false },
  ];

  const PLANS: Plan[] = [
    { id: "weekly",    name: t("pro.planWeeklyName"),    price: "15 000", period: t("pro.planWeeklyPeriod"),    highlight: false },
    { id: "monthly",   name: t("pro.planMonthlyName"),   price: "33 000", period: t("pro.planMonthlyPeriod"),   badge: t("pro.planBadge"), highlight: true },
    { id: "quarterly", name: t("pro.planQuarterlyName"), price: "83 000", period: t("pro.planQuarterlyPeriod"), savings: t("pro.planSavings"), highlight: false },
  ];

  const PLAN_DAYS: Record<string, number> = { weekly: 7, monthly: 30, quarterly: 90 };

  const handleSelect = (plan: Plan) => {
    const days = PLAN_DAYS[plan.id];
    const startParam = days ? `plan_${days}` : "";
    window.open(`https://t.me/avtotestsPremium_bot${startParam ? `?start=${startParam}` : ""}`, "_blank");
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 40, height: 40, border: `3px solid rgba(124,111,255,0.2)`, borderTopColor: CS.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <SEO
        title={t("pro.seoTitle")}
        description={t("pro.seoDescription")}
        path="/pro"
        keywords={t("pro.seoKeywords")}
      />

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      <style>{`
        .pro-plans-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
        .pro-steps-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        .pro-compare-table  { display: none; }
        .pro-compare-mobile { display: flex; flex-direction: column; gap: 10px; }
        .pro-hero-trust  { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .pro-cta-btns    { display: flex; flex-direction: column; align-items: center; gap: 10px; }
        @media (min-width: 640px) {
          .pro-plans-grid  { grid-template-columns: 1fr 1fr; }
          .pro-hero-trust  { flex-direction: row; justify-content: center; gap: 28px; }
          .pro-cta-btns    { flex-direction: row; justify-content: center; }
        }
        @media (min-width: 900px) {
          .pro-plans-grid     { grid-template-columns: repeat(3, 1fr); align-items: center; }
          .pro-steps-grid     { grid-template-columns: repeat(3, 1fr); gap: 24px; }
          .pro-compare-table  { display: block; }
          .pro-compare-mobile { display: none; }
        }
      `}</style>

      {/* Active PRO banner */}
      {user && isPremium && (
        <div style={{
          background: `linear-gradient(90deg, rgba(124,111,255,0.12), rgba(0,201,196,0.08))`,
          borderBottom: `1px solid rgba(124,111,255,0.2)`,
          padding: "12px 20px",
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 10, flexWrap: "wrap",
        }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Crown size={16} color="#fff" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: CS.textPrimary }}>{t("pro.premiumActive")}</span>
          {expiresAt && (
            <span style={{ fontSize: 13, color: CS.textSecondary }}>· {expiresAt.toLocaleDateString("uz-UZ")} {t("pro.premiumActiveUntil")}</span>
          )}
          <button
            onClick={() => navigate("/dashboard")}
            style={{ padding: "7px 16px", borderRadius: 10, background: CS.surface, border: `1px solid ${CS.border}`, color: CS.textPrimary, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
          >
            {t("pro.dashboardBtn")}
          </button>
        </div>
      )}

      {/* ═══ HERO ═══ */}
      <section style={{ background: CS.bg, position: "relative", overflow: "hidden", padding: "72px 20px 56px" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: `linear-gradient(rgba(124,111,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,111,255,0.04) 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
        <div style={{ position: "absolute", top: 0, left: "30%", width: "min(600px, 100vw)", height: 400, background: "radial-gradient(ellipse, rgba(124,111,255,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(124,111,255,0.12)", border: "1px solid rgba(124,111,255,0.25)", borderRadius: 100, padding: "8px 20px", marginBottom: 24 }}>
            <Sparkles size={14} color={CS.accent} />
            <span style={{ fontSize: 13, fontWeight: 700, color: CS.accent, letterSpacing: "0.04em" }}>PREMIUM OBUNA</span>
          </div>

          <h1 style={{ margin: "0 0 18px", fontSize: "clamp(30px, 5vw, 58px)", fontWeight: 800, color: CS.textPrimary, lineHeight: 1.1, fontFamily: "'Syne', sans-serif", letterSpacing: "-0.02em" }}>
            {t("pro.heroTitle1")}{" "}
            <span style={{
              display: "inline-block",
              backgroundImage: `linear-gradient(90deg, ${CS.accent}, ${CS.accentB})`,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
              WebkitTextFillColor: "transparent",
            }}>
              {t("pro.heroTitle2")}
            </span>{" "}
            {t("pro.heroTitle3")}
          </h1>

          <p style={{ margin: "0 0 36px", fontSize: "clamp(14px, 2.5vw, 17px)", color: CS.textSecondary, lineHeight: 1.7 }}>
            {t("pro.heroSubtitle")}
          </p>

          <div className="pro-hero-trust">
            {[
              { icon: <Users size={14} />, text: t("pro.trust1") },
              { icon: <Star size={14} />, text: t("pro.trust2") },
              { icon: <ShieldCheck size={14} />, text: t("pro.trust3") },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, color: CS.textSecondary, fontSize: 13 }}>
                <span style={{ color: CS.accentB }}>{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ COMPARISON ═══ */}
      <section style={{ background: CS.surface, borderTop: `1px solid ${CS.border}`, borderBottom: `1px solid ${CS.border}`, padding: "64px 20px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", margin: "0 0 40px", fontSize: "clamp(22px, 3vw, 36px)", fontWeight: 800, color: CS.textPrimary, fontFamily: "'Syne', sans-serif" }}>
            {t("pro.compareTitle")}
          </h2>

          {/* Desktop table */}
          <div className="pro-compare-table">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 140px", background: CS.card, borderRadius: "20px 20px 0 0", border: `1px solid ${CS.border}`, borderBottom: "none", padding: "16px 24px" }}>
              <div style={{ fontSize: 13, color: CS.textHint, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("pro.compareFeature")}</div>
              <div style={{ textAlign: "center", fontSize: 14, fontWeight: 700, color: CS.textSecondary }}>{t("pro.compareBasic")}</div>
              <div style={{ textAlign: "center", fontSize: 14, fontWeight: 700, color: CS.accent, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Crown size={14} /> {t("pro.comparePro")}
              </div>
            </div>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "1fr 140px 140px",
                background: i % 2 === 0 ? CS.card : `${CS.card}cc`,
                border: `1px solid ${CS.border}`, borderTop: "none",
                borderRadius: i === FEATURES.length - 1 ? "0 0 20px 20px" : 0,
                padding: "14px 24px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <f.icon size={15} color={CS.accent} />
                  <span style={{ fontSize: 14, color: CS.textPrimary }}>{f.label}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {f.free ? <Check size={18} color={CS.accentB} /> : <X size={16} color="rgba(255,95,109,0.6)" />}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Check size={18} color={CS.accentB} />
                </div>
              </div>
            ))}
          </div>

          {/* Mobile cards */}
          <div className="pro-compare-mobile">
            {FEATURES.map((f, i) => (
              <div key={i} style={{ background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                  <f.icon size={15} color={CS.accent} />
                  <span style={{ fontSize: 13, color: CS.textPrimary }}>{f.label}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: CS.textHint, marginBottom: 3 }}>{t("pro.compareBasic")}</div>
                    {f.free ? <Check size={16} color={CS.accentB} /> : <X size={14} color="rgba(255,95,109,0.6)" />}
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: CS.accent, marginBottom: 3, fontWeight: 700 }}>PRO</div>
                    <Check size={16} color={CS.accentB} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING PLANS ═══ */}
      <section style={{ background: CS.bg, padding: "72px 20px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: CS.accentB, textTransform: "uppercase" }}>{t("pro.pricingLabel")}</span>
            <h2 style={{ margin: "12px 0 12px", fontSize: "clamp(24px, 4vw, 42px)", fontWeight: 800, color: CS.textPrimary, fontFamily: "'Syne', sans-serif" }}>
              {t("pro.pricingSubtitle")}
            </h2>
            <p style={{ margin: 0, fontSize: 15, color: CS.textSecondary }}>
              {t("pro.pricingNote")}
            </p>
          </div>

          <div className="pro-plans-grid">
            {PLANS.map(plan => (
              <PlanCard key={plan.id} plan={plan} onSelect={handleSelect} />
            ))}
          </div>

          <div style={{ marginTop: 32, textAlign: "center", padding: "18px 20px", background: CS.surface, border: `1px solid ${CS.border}`, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
            <Lock size={14} color={CS.textHint} />
            <span style={{ fontSize: 13, color: CS.textHint }}>
              {t("pro.paymentNote")}{" "}
              <a href="https://t.me/avtotestsPremium_bot" target="_blank" rel="noopener noreferrer" style={{ color: CS.accent, fontWeight: 600 }}>
                {t("pro.paymentContact")}
              </a>
              {" "}{t("pro.paymentNote2")}
            </span>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section style={{ background: CS.surface, borderTop: `1px solid ${CS.border}`, padding: "72px 20px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", margin: "0 0 40px", fontSize: "clamp(22px, 3vw, 36px)", fontWeight: 800, color: CS.textPrimary, fontFamily: "'Syne', sans-serif" }}>
            {t("pro.howTitle")}
          </h2>
          <div className="pro-steps-grid">
            {[
              { step: "01", icon: <Crown size={22} color={CS.accent} />,         title: t("pro.step1Title"), desc: t("pro.step1Desc") },
              { step: "02", icon: <MessageCircle size={22} color={CS.accentB} />, title: t("pro.step2Title"), desc: t("pro.step2Desc") },
              { step: "03", icon: <Zap size={22} color={CS.accentC} />,           title: t("pro.step3Title"), desc: t("pro.step3Desc") },
            ].map((s, i) => (
              <div key={i} style={{ position: "relative", background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 20, padding: "24px 20px" }}>
                <div style={{ position: "absolute", top: 16, right: 16, fontSize: 28, fontWeight: 800, color: CS.textHint, opacity: 0.15, fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>
                  {s.step}
                </div>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: CS.surface, border: `1px solid ${CS.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  {s.icon}
                </div>
                <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: CS.textPrimary }}>{s.title}</h3>
                <p style={{ margin: 0, fontSize: 14, color: CS.textSecondary, lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section style={{ background: CS.bg, padding: "72px 20px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <div style={{ background: `linear-gradient(135deg, rgba(124,111,255,0.15), rgba(0,201,196,0.08))`, border: `1px solid rgba(124,111,255,0.2)`, borderRadius: 24, padding: "40px 24px" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🚗</div>
            <h2 style={{ margin: "0 0 12px", fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 800, color: CS.textPrimary, fontFamily: "'Syne', sans-serif" }}>
              {t("pro.ctaTitle")}
            </h2>
            <p style={{ margin: "0 0 28px", fontSize: 15, color: CS.textSecondary, lineHeight: 1.7 }}>
              {t("pro.ctaSubtitle")}
            </p>
            <div className="pro-cta-btns">
              <a
                href="https://t.me/avtotestsPremium_bot"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "14px 28px", borderRadius: 14,
                  background: `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`,
                  color: "#fff", fontWeight: 700, fontSize: 15,
                  textDecoration: "none",
                  boxShadow: `0 8px 28px rgba(124,111,255,0.35)`,
                  width: "100%", maxWidth: 280, justifyContent: "center",
                }}
              >
                <MessageCircle size={17} /> {t("pro.ctaTelegram")}
              </a>
              <button
                onClick={() => navigate("/test-ishlash")}
                style={{
                  padding: "14px 24px", borderRadius: 14,
                  background: CS.card,
                  border: `1px solid ${CS.border}`,
                  color: CS.textPrimary, fontWeight: 600, fontSize: 15,
                  cursor: "pointer", width: "100%", maxWidth: 280,
                }}
              >
                {t("pro.ctaFree")}
              </button>
            </div>
          </div>
        </div>
      </section>

    </MainLayout>
  );
}