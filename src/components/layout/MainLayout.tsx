import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TrialTimer } from "@/components/TrialTimer";
import { AppSidebar } from "./AppSidebar";
import { BottomNav } from "./BottomNav";
import { Crown, Globe, ChevronDown, Home, Phone, BookOpen, Car, FileText, Layers, Sun, Moon } from "lucide-react";
import logoImg from "@/assets/logo.png";

interface MainLayoutProps { children: React.ReactNode; }

export function MainLayout({ children }: MainLayoutProps) {
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const langBtnRefMobile = useRef<HTMLButtonElement | null>(null);
  const langBtnRefDesktop = useRef<HTMLButtonElement | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    const orig = document.body.style.overflow;
    if (mobileMenuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = orig;
    return () => { document.body.style.overflow = orig; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = useMemo(() => [
    { path: "/",         label: t("nav.home"),           icon: Home },
    { path: "/variant",  label: t("nav.variantlar"),     icon: FileText },
    { path: "/mavzuli",  label: t("nav.mavzuliTestlar"), icon: Layers },
    { path: "/belgilar", label: t("nav.belgilar"),       icon: Car },
    { path: "/darslik",  label: t("nav.darslik"),        icon: BookOpen },
    { path: "/contact",  label: t("nav.contact"),        icon: Phone },
  ], [t]);

  const languages = useMemo(() => [
    { code: "uz-lat" as const, display: "UZ", label: t("nav.langLatin") },
    { code: "uz"     as const, display: "ЎЗ", label: t("nav.langCyrillic") },
    { code: "ru"     as const, display: "RU", label: t("nav.langRussian") },
  ], [t]);

  const currentLangDisplay = useMemo(
    () => languages.find((l) => l.code === language)?.display ?? "UZ",
    [languages, language]
  );

  const handleLanguageChange = useCallback((code: typeof language) => {
    setLanguage(code);
    setLangMenuOpen(false);
  }, [setLanguage]);

  useEffect(() => {
    const handleOutside = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (langBtnRefMobile.current?.contains(target)) return;
      if (langBtnRefDesktop.current?.contains(target)) return;
      const menu = document.querySelector(".lang-menu-root");
      if (menu && !menu.contains(target)) setLangMenuOpen(false);
    };
    window.addEventListener("click", handleOutside, { passive: true });
    return () => {
      window.removeEventListener("click", handleOutside as EventListener);
    };
  }, []);

  useEffect(() => {
    const onLang = () => setLangMenuOpen(false);
    window.addEventListener("app:languagechange", onLang as EventListener);
    return () => window.removeEventListener("app:languagechange", onLang as EventListener);
  }, []);

  const isMavzuliSection = useMemo(
    () => location.pathname === "/mavzuli" || location.pathname.startsWith("/mavzuli/"),
    [location.pathname]
  );

  const getInitials = useCallback((name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  }, []);

  if (isMavzuliSection) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="flex bg-background min-h-screen">
      {/* Desktop Sidebar */}
      <AppSidebar />

      <div className="flex-1 flex flex-col min-h-screen lg:ml-[260px]">
        {/* Mobile Top Bar */}
        <nav className={`lg:hidden sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-card/95 backdrop-blur-xl shadow-sm border-b border-border"
            : "hero-bg border-b border-white/10"
        }`}>
          <div className="px-4 flex justify-between items-center h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <img src={logoImg} alt={t("common.siteName")} className="w-8 h-8 rounded-lg object-contain" width="32" height="32" />
              <span className={`font-bold text-base tracking-tight font-montserrat ${scrolled ? "text-foreground" : "text-white"}`}>
                {t("common.siteName")}
              </span>
            </Link>

            {/* Right */}
            <div className="flex items-center gap-1.5">
              <TrialTimer />

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                  scrolled ? "text-muted-foreground hover:bg-muted" : "text-white/80 hover:bg-white/10"
                }`}
                title={isDark ? "Kunduzgi rejim" : "Tungi rejim"}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Language */}
              <div className="relative">
                <button
                  ref={langBtnRefMobile}
                  id="lang-toggle-btn"
                  aria-haspopup="menu"
                  aria-expanded={langMenuOpen}
                  onClick={() => setLangMenuOpen(!langMenuOpen)}
                  className={`flex items-center gap-1 py-1.5 px-2 text-xs font-semibold transition-all rounded-lg ${
                    scrolled ? "text-muted-foreground hover:bg-muted" : "text-white/80 hover:bg-white/10"
                  }`}
                  style={{ zIndex: 60 }}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{currentLangDisplay}</span>
                </button>
                {langMenuOpen && (
                  <div className="lang-menu-root fixed right-3 top-[56px] bg-card rounded-xl shadow-xl border border-border py-1 animate-scale-in"
                    role="menu"
                    aria-labelledby="lang-toggle-btn"
                    onClick={(e) => e.stopPropagation()}
                    style={{ zIndex: 9999, pointerEvents: "auto", width: "240px", maxWidth: "calc(100% - 32px)" }}>
                    {languages.map((l) => (
                      <button key={l.code} onClick={() => handleLanguageChange(l.code)}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          language === l.code ? "bg-primary/10 text-primary font-bold" : "text-foreground hover:bg-muted"
                        }`}>{l.label}</button>
                    ))}
                  </div>
                )}
              </div>

              {/* Premium */}
              <Link to="/pro">
                <Button size="sm" className="bg-gradient-to-r from-[hsl(250_70%_56%)] to-[hsl(190_80%_45%)] text-white font-bold px-2.5 h-8 rounded-lg gap-1 border-0">
                  <Crown className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Desktop Top Bar */}
        <header className="hidden lg:flex items-center justify-between h-14 px-6 border-b border-border bg-card/50 sticky top-0 z-40">
          <nav className="flex items-center gap-1">
            {navLinks.slice(1, 4).map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <TrialTimer />

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? "Kunduzgi rejim" : "Tungi rejim"}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Premium button */}
            <Link to="/pro">
              <Button size="sm" className="bg-gradient-to-r from-[hsl(250_70%_56%)] to-[hsl(190_80%_45%)] text-white font-bold px-3 h-8 rounded-lg gap-1.5 border-0 text-xs">
                <Crown className="w-3.5 h-3.5" /> Premium
              </Button>
            </Link>

            {/* Language */}
            <div className="relative">
              <button
                ref={langBtnRefDesktop}
                id="lang-toggle-btn-desktop"
                aria-haspopup="menu"
                aria-expanded={langMenuOpen}
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 py-1.5 px-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                style={{ zIndex: 60 }}
              >
                <Globe className="w-4 h-4" />
                <span>{currentLangDisplay}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${langMenuOpen ? "rotate-180" : ""}`} />
              </button>
              {langMenuOpen && (
                <div className="lang-menu-root fixed right-6 top-[56px] bg-card rounded-xl shadow-xl border border-border py-1 animate-scale-in"
                  role="menu"
                  aria-labelledby="lang-toggle-btn-desktop"
                  onClick={(e) => e.stopPropagation()}
                  style={{ zIndex: 9999, pointerEvents: "auto", width: "260px", maxWidth: "calc(100% - 32px)" }}>
                  {languages.map((l) => (
                    <button key={l.code} onClick={() => handleLanguageChange(l.code)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        language === l.code ? "bg-primary/10 text-primary font-bold" : "text-foreground hover:bg-muted font-medium"
                      }`}>{l.label}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 app-main-content">{children}</main>

        {/* Footer — desktop only, theme-aware */}
        <footer className="block bg-[hsl(var(--sidebar-background))] border-t border-[hsl(var(--sidebar-border))] pb-20 lg:pb-0">
          <div className="max-w-7xl mx-auto px-6 py-10">
            <div className="grid grid-cols-1 gap-8 text-center lg:grid-cols-12 lg:gap-8 lg:text-left">
              <div className="lg:col-span-5">
                <div className="flex items-center justify-center gap-3 mb-3 lg:justify-start">
                  <img src={logoImg} alt="Logo" className="w-9 h-9 rounded-xl object-contain" width="36" height="36" />
                  <span className="font-bold text-lg font-montserrat gradient-text">
                    {t("common.siteName")}
                  </span>
                </div>
                <p className="text-[hsl(var(--sidebar-foreground))] text-sm leading-relaxed max-w-sm mx-auto lg:mx-0">{t("footer.aboutText")}</p>
              </div>
              <div className="lg:col-span-3">
                <h3 className="font-semibold text-sm mb-3 text-[hsl(var(--accent))] uppercase tracking-wider">{t("footer.quickLinksTitle")}</h3>
                <div className="space-y-2">
                  {navLinks.map((item) => (
                    <Link key={item.path} to={item.path} className="block text-[hsl(var(--sidebar-foreground))] hover:text-[hsl(var(--accent))] transition-colors text-sm">{item.label}</Link>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-4">
                <h3 className="font-semibold text-sm mb-3 text-[hsl(var(--accent))] uppercase tracking-wider">{t("footer.contactTitle")}</h3>
                <div className="space-y-2 text-sm text-[hsl(var(--sidebar-foreground))]">
                  <p>{t("footer.telegramLabel")}</p>
                  <p>{t("footer.botLabel")}</p>
                  <p>{t("footer.workingHoursLabel")}</p>
                </div>
              </div>
            </div>
            <div className="section-divider mt-8 mb-4" />
            <div className="text-center text-[hsl(var(--muted-foreground))] text-xs">{t("footer.copyright")}</div>
          </div>
        </footer>

        {/* Mobile Bottom Nav */}
        <BottomNav />
      </div>
    </div>
  );
}