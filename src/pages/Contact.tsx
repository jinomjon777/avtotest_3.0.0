import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { ContactForm } from "@/components/contact/ContactForm";
import { QuickContactLinks } from "@/components/contact/QuickContactLinks";
import { useLanguage } from "@/contexts/LanguageContext";
import { Mail } from "lucide-react";

export default function Contact() {
  const { t } = useLanguage();
  return (
    <MainLayout>
      <SEO 
        title={t("contact.seoTitle")}
        description={t("contact.seoDescription")}
        path="/contact"
        keywords="aloqa, bog'lanish, yordam, savol javob, avtotestu kontakt"
      />
      
      {/* Hero */}
      <section className="bg-gradient-to-br from-[hsl(222_47%_8%)] via-[hsl(222_35%_14%)] to-[hsl(222_47%_8%)] py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-14 h-14 mx-auto mb-5 bg-primary/15 rounded-2xl flex items-center justify-center border border-primary/20">
            <Mail className="w-7 h-7 text-amber-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
            {t("contact.seoTitle")}
          </h1>
          <p className="text-white/50 text-base max-w-md mx-auto">
            Savollaringiz bo'lsa, biz doimo yordam berishga tayyormiz
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-stretch">
            <div className="order-2 lg:order-1 flex flex-col h-full">
              <div className="flex-1 rounded-2xl border border-border/60 bg-card shadow-sm p-6 md:p-8 flex flex-col">
                <QuickContactLinks />
              </div>
            </div>
            <div className="order-1 lg:order-2 flex flex-col h-full">
              <div className="flex-1 rounded-2xl border border-border/60 bg-card shadow-sm p-6 md:p-8 flex flex-col">
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
