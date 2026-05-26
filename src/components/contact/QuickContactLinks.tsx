import { useState } from "react";
import { Clock, ChevronDown, Shield, Bot, Send } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function QuickContactLinks() {
  const [showTerms, setShowTerms] = useState(false);
  const { t } = useLanguage();

  const contactLinks = [
    { icon: Send, labelKey: "contact.telegram", value: "@avtotestu_ad2", href: "https://t.me/avtotestu_ad" },
    { icon: Bot, labelKey: "contact.telegramBot", value: "@Avtotestubot", href: "https://t.me/Avtotestubot" },
    { icon: Bot, labelKey: "contact.maktabAvtoBot", value: "@avtotestu_ad", href: "https://t.me/avtotestu_ad" },
  ];

  return (
    <div className="flex flex-col h-full space-y-6">
      
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
          <Shield className="w-5 h-5 text-primary" />
          {t("contact.quickTitle")}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          {t("contact.quickSubtitle")}
        </p>
      </div>

      {/* Contact Links */}
      <div className="space-y-4 flex-1">
        {contactLinks.map((item, index) => {
          const Icon = item.icon;
          return (
            <a
              key={index}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 group p-2 -mx-2 rounded-lg hover:bg-muted/50"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary">
                <Icon className="w-5 h-5 text-primary group-hover:text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  {t(item.labelKey)}
                </p>
                <p className="font-semibold text-foreground text-sm group-hover:text-primary mt-0.5">
                  {item.value}
                </p>
              </div>
            </a>
          );
        })}

        {/* Working Hours */}
        <div className="flex items-center gap-4 p-2 -mx-2 mt-4 border-t border-muted pt-4">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {t("contact.workingHours")}
            </p>
            <p className="font-semibold text-foreground text-sm mt-0.5">
              {t("contact.workingHours24")}
            </p>
          </div>
        </div>
      </div>

      {/* Collapsible Terms - Animatsiyalar olib tashlandi, biroz teparoqqa surildi */}
      <div className="border border-muted rounded-xl bg-muted/20 overflow-hidden">
        <button
          onClick={() => setShowTerms(!showTerms)}
          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-muted/40"
        >
          <span className="text-sm font-semibold text-foreground flex items-center gap-2">
             {t("contact.termsTitle")}
          </span>
          <ChevronDown 
            className={`w-4 h-4 text-muted-foreground ${showTerms ? "rotate-180" : ""}`} 
          />
        </button>
        
        {/* Shartlar matni. Animatsiya yo'q, shunchaki shart bo'yicha ko'rsatiladi */}
        {showTerms && (
          <div className="px-5 pb-5 space-y-3 text-muted-foreground text-sm border-t border-muted pt-4">
            <p className="font-medium text-foreground">
              {t("contact.termsIntro")}
            </p>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"/>
                <span>{t("contact.terms1")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"/>
                <span>{t("contact.terms2")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"/>
                <span>{t("contact.terms3")}</span>
              </li>
            </ul>
          </div>
        )}
      </div>
      
    </div>
  );
}
