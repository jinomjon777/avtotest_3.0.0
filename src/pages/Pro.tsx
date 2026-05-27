import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAccessState } from "@/hooks/useAccessState";
import { useState } from "react";
import {
  Crown,
  Check,
  X,
  Zap,
  ShieldCheck,
  Clock,
  BookOpen,
  PlayCircle,
  Database,
  Send,
  Star,
  Users,
  ArrowRight,
  MessageCircle,
  Sparkles,
  Lock,
} from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────────────────────
const CS = {
  bg:          "#0A0B14",
  surface:     "#111220",
  card:        "#16172a",
  cardHover:   "#1c1d35",
  border:      "rgba(255,255,255,0.07)",
  borderHover: "rgba(124,111,255,0.35)",
  accent:      "#7C6FFF",
  accentB:     "#00C9C4",
  accentC:     "#FF5F6D",
  gold:        "#F5A623",
  textPrimary:   "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.55)",
  textHint:      "rgba(255,255,255,0.30)",
};

// ─── Feature list ─────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Database,    label: "1200+ ta yopiq savollar bazasi",         pro: true,  free: false },
  { icon: PlayCircle,  label: "To'liq maxsus video darsliklar",          pro: true,  free: false },
  { icon: BookOpen,    label: "61 ta to'liq test variant",               pro: true,  free: true  },
  { icon: Zap,         label: "Imtihonbop yopiq testlar",                pro: true,  free: false },
  { icon: Users,       label: "Admin ko'magi va Premium guruh",          pro: true,  free: false },
  { icon: Clock,       label: "Cheksiz vaqt va urinishlar",              pro: true,  free: false },
  { icon: ShieldCheck, label: "Mavzuli testlar (barcha bo'limlar)",      pro: true,  free: true  },
  { icon: Star,        label: "Natijalar tahlili va statistika",         pro: true,  free: false },
];

// ─── Plan card ────────────────────────────────────────────────────────────────
interface Plan {
  id:        string;
  name:      string;
  price:     string;
  period:    string;
  badge?:    string;
  savings?:  string;
  highlight: boolean;
}

const PLANS: Plan[] = [
  {
    id:        "weekly",
    name:      "Haftalik",
    price:     "15 000",
    period:    "7 kun",
    highlight: false,
  },
  {
    id:        "monthly",
    name:      "Oylik",
    price:     "33 000",
    period:    "30 kun",
    badge:     "ENG MASHHUR",
    highlight: true,
  },
  {
    id:        "quarterly",
    name:      "3 Oylik",
    price:     "83 000",
    period:    "90 kun",
    savings:   "21% tejaysiz",
    highlight: false,
  },
];

function PlanCard({ plan, onSelect }: { plan: Plan; onSelect: (p: Plan) => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(plan)}
      style={{
        position:    "relative",
        background:  plan.highlight
          ? `linear-gradient(160deg, rgba(124,111,255,0.18), rgba(0,201,196,0.10))`
          : hovered ? CS.cardHover : CS.card,
        border:      plan.highlight
          ? `2px solid rgba(124,111,255,0.55)`
          : hovered
            ? `1px solid ${CS.borderHover}`
            : `1px solid ${CS.border}`,
        borderRadius: 24,
        padding:      plan.highlight ? "36px 28px" : "32px 28px",
        cursor:       "pointer",
        transition:   "all 0.25s ease",
        transform:    plan.highlight ? "scale(1.04)" : hovered ? "scale(1.01)" : "scale(1)",
        boxShadow:    plan.highlight
          ? "0 24px 60px rgba(124,111,255,0.25)"
          : hovered
            ? "0 12px 32px rgba(0,0,0,0.4)"
            : "none",
        zIndex:       plan.highlight ? 2 : 1,
      }}
    >
      {/* badge */}
      {plan.badge && (
        <div style={{
          position:    "absolute",
          top:         -14,
          left:        "50%",
          transform:   "translateX(-50%)",
          background:  `linear-gradient(90deg, ${CS.accent}, ${CS.accentB})`,
          borderRadius: 100,
          padding:     "5px 18px",
          fontSize:    11,
          fontWeight:  800,
          color:       "#fff",
          letterSpacing: "0.08em",
          whiteSpace:  "nowrap",
        }}>
          ⚡ {plan.badge}
        </div>
      )}

      {plan.savings && (
        <div style={{
          position:    "absolute",
          top:         16,
          right:       16,
          background:  "rgba(245,166,35,0.15)",
          border:      "1px solid rgba(245,166,35,0.3)",
          borderRadius: 100,
          padding:     "4px 12px",
          fontSize:    11,
          fontWeight:  700,
          color:       CS.gold,
        }}>
          {plan.savings}
        </div>
      )}

      <div style={{ fontSize: 13, fontWeight: 700, color: CS.textSecondary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
        {plan.name}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
        <span style={{ fontSize: 38, fontWeight: 800, color: CS.textPrimary, fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>
          {plan.price}
        </span>
        <span style={{ fontSize: 14, color: CS.textSecondary }}>so'm</span>
      </div>

      <div style={{ fontSize: 13, color: CS.textHint, marginBottom: 28 }}>{plan.period} davomida</div>

      <button
        style={{
          width:        "100%",
          padding:      "13px 0",
          borderRadius: 14,
          border:       "none",
          background:   plan.highlight
            ? `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`
            : "rgba(255,255,255,0.08)",
          color:        "#fff",
          fontWeight:   700,
          fontSize:     15,
          cursor:       "pointer",
          display:      "flex",
          alignItems:   "center",
          justifyContent: "center",
          gap:          8,
          boxShadow:    plan.highlight ? `0 8px 24px rgba(124,111,255,0.35)` : "none",
          transition:   "opacity 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
      >
        <Crown size={16} />
        {plan.name} olish
        <ArrowRight size={14} />
      </button>

      <div style={{ marginTop: 20, fontSize: 12, color: CS.textHint, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <Send size={11} />
        Obuna uchun: @jumanazarov_0501
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Pro() {
  const navigate  = useNavigate();
  const { user, profile, isLoading } = useAuth();
  const { t }     = useLanguage();
  const { state, isPremium, expiresAt } = useAccessState();
  const [selected, setSelected] = useState<Plan | null>(null);

  const handleSelect = (plan: Plan) => {
    setSelected(plan);
    window.open("https://t.me/jumanazarov_0501", "_blank");
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

      {/* ── Active PRO banner ─────────────────────────────────────────── */}
      {user && isPremium && (
        <div style={{
          background: `linear-gradient(90deg, rgba(124,111,255,0.12), rgba(0,201,196,0.08))`,
          borderBottom: `1px solid rgba(124,111,255,0.2)`,
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Crown size={16} color="#fff" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: CS.textPrimary }}>
            PREMIUM faol
          </span>
          {expiresAt && (
            <span style={{ fontSize: 13, color: CS.textSecondary }}>
              · {expiresAt.toLocaleDateString("uz-UZ")} gacha
            </span>
          )}
          <button
            onClick={() => navigate("/dashboard")}
            style={{ marginLeft: 12, padding: "7px 16px", borderRadius: 10, background: "rgba(255,255,255,0.08)", border: `1px solid ${CS.border}`, color: CS.textPrimary, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
          >
            Dashboard →
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════ */}
      <section style={{ background: CS.bg, position: "relative", overflow: "hidden", padding: "96px 24px 72px" }}>
        {/* grid overlay */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `
            linear-gradient(rgba(124,111,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(124,111,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }} />
        <div style={{ position: "absolute", top: 0, left: "30%", width: 600, height: 400, background: "radial-gradient(ellipse, rgba(124,111,255,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center", position: "relative" }}>
          {/* pill badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(124,111,255,0.12)", border: "1px solid rgba(124,111,255,0.25)", borderRadius: 100, padding: "8px 20px", marginBottom: 28 }}>
            <Sparkles size={14} color={CS.accent} />
            <span style={{ fontSize: 13, fontWeight: 700, color: CS.accent, letterSpacing: "0.04em" }}>PREMIUM OBUNA</span>
          </div>

          <h1 style={{
            margin: "0 0 20px",
            fontSize: "clamp(36px, 5vw, 58px)",
            fontWeight: 800,
            color: CS.textPrimary,
            lineHeight: 1.08,
            fontFamily: "'Syne', sans-serif",
            letterSpacing: "-0.02em",
          }}>
            Imtihondan{" "}
            <span style={{ background: `linear-gradient(90deg, ${CS.accent}, ${CS.accentB})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              birinchi urinishda
            </span>{" "}
            o'ting
          </h1>

          <p style={{ margin: "0 0 48px", fontSize: 18, color: CS.textSecondary, lineHeight: 1.7, maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>
            Oddiy testlardan charchadingizmi? Haqiqiy imtihonda tushish ehtimoli eng yuqori bo'lgan yopiq bazaga va maxsus video darsliklarga faqat PREMIUM orqali kirish huquqiga ega bo'lasiz.
          </p>

          {/* trust strip */}
          <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
            {[
              { icon: <Users size={14} />, text: "5000+ foydalanuvchi" },
              { icon: <Star size={14} />, text: "4.9 / 5 reyting" },
              { icon: <ShieldCheck size={14} />, text: "Xavfsiz to'lov" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, color: CS.textSecondary, fontSize: 13 }}>
                <span style={{ color: CS.accentB }}>{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          COMPARISON TABLE
      ═══════════════════════════════════════════════════════ */}
      <section style={{ background: CS.surface, borderTop: `1px solid ${CS.border}`, borderBottom: `1px solid ${CS.border}`, padding: "72px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", margin: "0 0 48px", fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: CS.textPrimary, fontFamily: "'Syne', sans-serif" }}>
            Oddiy vs Premium
          </h2>

          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 160px", gap: 0, background: CS.card, borderRadius: "20px 20px 0 0", border: `1px solid ${CS.border}`, borderBottom: "none", padding: "16px 24px" }}>
            <div style={{ fontSize: 13, color: CS.textHint, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Xususiyat</div>
            <div style={{ textAlign: "center", fontSize: 14, fontWeight: 700, color: CS.textSecondary }}>Oddiy</div>
            <div style={{ textAlign: "center", fontSize: 14, fontWeight: 700, color: CS.accent, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Crown size={14} /> PREMIUM
            </div>
          </div>

          {/* Rows */}
          {FEATURES.map((f, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 160px 160px",
                gap: 0,
                background: i % 2 === 0 ? CS.card : `${CS.card}cc`,
                border: `1px solid ${CS.border}`,
                borderTop: "none",
                borderRadius: i === FEATURES.length - 1 ? "0 0 20px 20px" : 0,
                padding: "14px 24px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <f.icon size={15} color={CS.accent} />
                <span style={{ fontSize: 14, color: CS.textPrimary }}>{f.label}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                {f.free
                  ? <Check size={18} color={CS.accentB} />
                  : <X size={16} color="rgba(255,95,109,0.6)" />}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={18} color={CS.accentB} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          PRICING PLANS
      ═══════════════════════════════════════════════════════ */}
      <section style={{ background: CS.bg, padding: "96px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: CS.accentB, textTransform: "uppercase" }}>Narxlar</span>
            <h2 style={{ margin: "12px 0 12px", fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 800, color: CS.textPrimary, fontFamily: "'Syne', sans-serif" }}>
              O'zingizga mos tarifni tanlang
            </h2>
            <p style={{ margin: 0, fontSize: 16, color: CS.textSecondary }}>
              Barcha tariflarda to'liq PREMIUM imkoniyatlar kiradi
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, alignItems: "center" }}>
            {PLANS.map(plan => (
              <PlanCard key={plan.id} plan={plan} onSelect={handleSelect} />
            ))}
          </div>

          {/* info note */}
          <div style={{ marginTop: 40, textAlign: "center", padding: "20px 24px", background: "rgba(255,255,255,0.03)", border: `1px solid ${CS.border}`, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <Lock size={14} color={CS.textHint} />
            <span style={{ fontSize: 13, color: CS.textHint }}>
              To'lov Telegram orqali qabul qilinadi. Savollar uchun{" "}
              <a href="https://t.me/jumanazarov_0501" target="_blank" rel="noopener noreferrer" style={{ color: CS.accent, fontWeight: 600 }}>
                @jumanazarov_0501
              </a>
              {" "}ga murojaat qiling.
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════════════ */}
      <section style={{ background: CS.surface, borderTop: `1px solid ${CS.border}`, padding: "80px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", margin: "0 0 48px", fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: CS.textPrimary, fontFamily: "'Syne', sans-serif" }}>
            Qanday olish mumkin?
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {[
              { step: "01", icon: <Crown size={22} color={CS.accent} />, title: "Tarifni tanlang", desc: "Yuqoridan o'zingizga qulay haftalik, oylik yoki 3 oylik obuna variantini tanlang." },
              { step: "02", icon: <MessageCircle size={22} color={CS.accentB} />, title: "Telegram'ga yozing", desc: "@jumanazarov_0501 kanaliga murojaat qiling. Admin siz bilan bog'lanadi." },
              { step: "03", icon: <Zap size={22} color={CS.accentC} />, title: "Kirishni oling", desc: "To'lovdan so'ng 5 daqiqa ichida akkauntingiz aktivatsiya qilinadi." },
            ].map((s, i) => (
              <div key={i} style={{ position: "relative", background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 20, padding: "28px 24px" }}>
                <div style={{ position: "absolute", top: 20, right: 20, fontSize: 32, fontWeight: 800, color: "rgba(255,255,255,0.05)", fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>
                  {s.step}
                </div>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  {s.icon}
                </div>
                <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: CS.textPrimary }}>{s.title}</h3>
                <p style={{ margin: 0, fontSize: 14, color: CS.textSecondary, lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════════════════════ */}
      <section style={{ background: CS.bg, padding: "80px 24px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <div style={{
            background: `linear-gradient(135deg, rgba(124,111,255,0.15), rgba(0,201,196,0.08))`,
            border: `1px solid rgba(124,111,255,0.2)`,
            borderRadius: 28,
            padding: "48px 36px",
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🚗</div>
            <h2 style={{ margin: "0 0 14px", fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 800, color: CS.textPrimary, fontFamily: "'Syne', sans-serif" }}>
              Bugun boshlang!
            </h2>
            <p style={{ margin: "0 0 32px", fontSize: 15, color: CS.textSecondary, lineHeight: 1.7 }}>
              5000+ o'quvchi allaqachon Premium'dan foydalanmoqda. Sizning navbatingiz!
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <a
                href="https://t.me/jumanazarov_0501"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "14px 28px", borderRadius: 14,
                  background: `linear-gradient(135deg, ${CS.accent}, ${CS.accentB})`,
                  color: "#fff", fontWeight: 700, fontSize: 15,
                  textDecoration: "none",
                  boxShadow: `0 8px 28px rgba(124,111,255,0.35)`,
                }}
              >
                <MessageCircle size={17} /> Telegram'ga yozish
              </a>
              <button
                onClick={() => navigate("/test-ishlash")}
                style={{
                  padding: "14px 24px", borderRadius: 14,
                  background: "rgba(255,255,255,0.06)",
                  border: `1px solid ${CS.border}`,
                  color: CS.textPrimary, fontWeight: 600, fontSize: 15,
                  cursor: "pointer",
                }}
              >
                Bepul test ishlash
              </button>
            </div>
          </div>
        </div>
      </section>

    </MainLayout>
  );
}
