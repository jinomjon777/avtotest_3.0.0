import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { ContactForm } from "@/components/contact/ContactForm";
import { QuickContactLinks } from "@/components/contact/QuickContactLinks";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Mail } from "lucide-react";

export default function Contact() {
  const { t } = useLanguage();
  const { CS } = useTheme();
  return (
    <MainLayout>
      <SEO
        title={t("contact.seoTitle")}
        description={t("contact.seoDescription")}
        path="/contact"
        keywords="aloqa, bog'lanish, yordam, savol javob, avtotest kontakt"
      />

      {/* Hero */}
      <section style={{ background: `linear-gradient(135deg, #0A0B14 0%, #111220 50%, #0A0B14 100%)`, padding: "56px 20px 48px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "10%", left: "30%", width: 400, height: 400, background: "radial-gradient(circle, rgba(124,111,255,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative" }}>
          <div style={{ width: 56, height: 56, margin: "0 auto 16px", background: "rgba(124,111,255,0.12)", border: "1px solid rgba(124,111,255,0.25)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Mail size={26} color="#F5A623" />
          </div>
          <h1 style={{ margin: "0 0 10px", fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 800, color: CS.textPrimary }}>
            {t("contact.seoTitle")}
          </h1>
          <p style={{ fontSize: 15, color: CS.textSecondary, maxWidth: 400, margin: "0 auto" }}>
            Savollaringiz bo'lsa, biz doimo yordam berishga tayyormiz
          </p>
        </div>
      </section>

      {/* Main */}
      <section style={{ background: CS.bg, padding: "48px 20px 64px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }} className="contact-grid">
            <div style={{ background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 20, padding: "28px 24px" }}>
              <QuickContactLinks />
            </div>
            <div style={{ background: CS.card, border: `1px solid ${CS.border}`, borderRadius: 20, padding: "28px 24px" }}>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .contact-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </MainLayout>
  );
}
