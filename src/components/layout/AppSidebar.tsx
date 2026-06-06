import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home, Car, BookOpen, Phone, Info, Crown, User, LogOut,
  FileText, Layers, Sun, Moon
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logoImg from "@/assets/logo.png";

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();

  const mainNav = [
    { path: "/",         icon: Home,      labelKey: "nav.home" },
    { path: "/variant",  icon: FileText,  labelKey: "nav.variantlar" },
    { path: "/mavzuli",  icon: Layers,    labelKey: "nav.mavzuliTestlar" },
    { path: "/belgilar", icon: Car,       labelKey: "nav.belgilar" },
    { path: "/darslik",  icon: BookOpen,  labelKey: "nav.darslik" },
    { path: "/qoshimcha",icon: Info,      labelKey: "nav.qoshimcha" },
    { path: "/contact",  icon: Phone,     labelKey: "nav.contact" },
  ];

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-[260px] z-50 bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-[hsl(var(--sidebar-border))] flex-shrink-0">
        <img src={logoImg} alt="Logo" className="w-9 h-9 rounded-xl object-contain flex-shrink-0" width="36" height="36" />
        <span className="font-bold text-lg tracking-tight font-montserrat text-[hsl(var(--sidebar-accent-foreground))]">
          AVTOTEST
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-[hsl(var(--sidebar-primary)/0.15)] text-[hsl(var(--sidebar-primary))]"
                  : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}

        {/* Premium link */}
        <Link
          to="/pro"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all mt-4",
            location.pathname === "/pro"
              ? "bg-[hsl(var(--sidebar-primary)/0.2)] text-[hsl(var(--sidebar-primary))]"
              : "text-[hsl(190_80%_50%)] hover:bg-[hsl(var(--sidebar-primary)/0.1)]"
          )}
        >
          <Crown className="w-5 h-5 flex-shrink-0" />
          <span>{t("nav.premium")}</span>
        </Link>
      </nav>

      {/* Theme toggle */}
      <div className="px-3 pb-2">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))] transition-all"
        >
          {isDark ? <Sun className="w-5 h-5 flex-shrink-0" /> : <Moon className="w-5 h-5 flex-shrink-0" />}
          <span>{isDark ? "Kunduzgi rejim" : "Tungi rejim"}</span>
        </button>
      </div>

      {/* User section */}
      <div className="border-t border-[hsl(var(--sidebar-border))] p-3 flex-shrink-0">
        {user ? (
          <div className="space-y-2">
            <button
              onClick={() => navigate("/profile")}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-[hsl(var(--sidebar-accent))] transition-colors text-left",
                location.pathname === "/profile" && "bg-[hsl(var(--sidebar-accent))]"
              )}
            >
              <Avatar className="h-8 w-8 bg-gradient-to-br from-[hsl(250_70%_56%)] to-[hsl(190_80%_45%)] flex-shrink-0">
                <AvatarFallback className="bg-transparent text-white text-xs font-semibold">
                  {getInitials(profile?.full_name || profile?.username)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[hsl(var(--sidebar-accent-foreground))] truncate">
                  {profile?.full_name || profile?.username || t("nav.user")}
                </p>
                <p className="text-xs text-[hsl(var(--sidebar-foreground))] truncate">{user.email}</p>
              </div>
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="w-full justify-start gap-2 text-[hsl(var(--sidebar-foreground))] hover:text-[hsl(0_72%_55%)] hover:bg-[hsl(0_72%_55%/0.1)]"
            >
              <LogOut className="w-4 h-4" />
              {t("nav.logout")}
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => navigate("/auth")}
            className="w-full gap-2 bg-gradient-to-r from-[hsl(250_70%_56%)] to-[hsl(190_80%_45%)] text-white rounded-xl border-0"
          >
            <User className="w-4 h-4" />
            {t("nav.login")}
          </Button>
        )}
      </div>
    </aside>
  );
}
