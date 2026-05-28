import { Link, useLocation } from "react-router-dom";
import { Home, Car, BookOpen, Crown, User, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();

  const navItems = [
    { path: "/", icon: Home, labelKey: "nav.home" },
    { path: "/variant", icon: FileText, labelKey: "nav.variantlar" },
    { path: "/belgilar", icon: Car, labelKey: "nav.belgilar" },
    { path: "/pro", icon: Crown, labelKey: "nav.premium" },
    { path: user ? "/profile" : "/auth", icon: User, labelKey: user ? "nav.profil" : "nav.kirish" },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors min-w-[52px]",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
              <span className="text-[10px] font-medium leading-tight text-center">{t(item.labelKey)}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
