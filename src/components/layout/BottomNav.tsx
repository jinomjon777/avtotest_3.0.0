import { Link, useLocation } from "react-router-dom";
import { Home, Car, BookOpen, Crown, User, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", icon: Home, label: "Bosh sahifa" },
  { path: "/variant", icon: FileText, label: "Variantlar" },
  { path: "/belgilar", icon: Car, label: "Belgilar" },
  { path: "/pro", icon: Crown, label: "Premium" },
  { path: "/profile", icon: User, label: "Profil" },
];

export function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();

  const items = navItems.map(item => 
    item.path === "/profile" && !user 
      ? { ...item, path: "/auth", label: "Kirish" } 
      : item
  );

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[56px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
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
