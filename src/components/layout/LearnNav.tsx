import { Link, useLocation } from "react-router-dom";
import { AlarmClock, LayoutDashboard, ListX, TrendingDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLearnT } from "@/hooks/useLearnT";
import { cn } from "@/lib/utils";

/**
 * Shaxsiy o'quv bo'limlari (Kabinet, Mening xatolarim, Zaif mavzular, Kunlik reja) —
 * yuqori panelda gorizontal tugmalar. Faqat tizimga kirgan foydalanuvchiga ko'rinadi.
 * Kompyuterda — yuqori panelning chap qismida; telefonda — sarlavha ostida suriladigan qator.
 */
export function LearnNav({ className }: { className?: string }) {
  const { user } = useAuth();
  const tl = useLearnT();
  const { pathname } = useLocation();
  if (!user) return null;

  const items = [
    { path: "/dashboard",     icon: LayoutDashboard, label: tl("dash.title") },
    { path: "/xatolarim",     icon: ListX,           label: tl("mist.title") },
    { path: "/zaif-mavzular", icon: TrendingDown,    label: tl("weak.title") },
    { path: "/kunlik-reja",   icon: AlarmClock,      label: tl("plan.title") },
  ];

  return (
    <nav aria-label={tl("dash.title")} className={cn("flex items-center gap-1", className)}>
      {items.map(({ path, icon: Icon, label }) => {
        const active = pathname === path;
        return (
          <Link
            key={path}
            to={path}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
              active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
