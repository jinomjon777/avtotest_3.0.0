import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlarmClock, LayoutDashboard, ListX, Sparkles, TrendingDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useLearnT } from "@/hooks/useLearnT";

const KEY = "guest-signup-prompt-dismissed-at";
const SNOOZE_DAYS = 3;
const DELAY_MS = 2500;
const HIDE_ON = ["/auth", "/auth/callback"];

function snoozed(): boolean {
  try {
    const at = Number(localStorage.getItem(KEY) || 0);
    return at > 0 && Date.now() - at < SNOOZE_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

/**
 * Hisobga kirmagan foydalanuvchiga: "Ro'yxatdan o'ting — yangi funksiyalar ochiladi".
 * Sahifa ochilgach 2.5 s da chiqadi; "Keyinroq" bosilsa 3 kun ko'rinmaydi.
 * Telefonda pastki menyu ustida, kompyuterda o'ng pastki burchakda.
 */
export function GuestSignupPrompt() {
  const { user, isLoading } = useAuth();
  const tl = useLearnT();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isLoading || user || HIDE_ON.includes(pathname) || snoozed()) {
      setShow(false);
      return;
    }
    const id = setTimeout(() => setShow(true), DELAY_MS);
    return () => clearTimeout(id);
  }, [user, isLoading, pathname]);

  if (!show) return null;

  const dismiss = () => {
    try { localStorage.setItem(KEY, String(Date.now())); } catch { /* xotira yopiq */ }
    setShow(false);
  };

  const features = [
    { icon: ListX, text: tl("guest.f.mistakes") },
    { icon: TrendingDown, text: tl("guest.f.weak") },
    { icon: AlarmClock, text: tl("guest.f.plan") },
    { icon: LayoutDashboard, text: tl("guest.f.progress") },
  ];

  return (
    <div
      role="dialog"
      aria-labelledby="guest-signup-title"
      className="fixed z-[60] left-3 right-3 bottom-[76px] lg:left-auto lg:right-6 lg:bottom-6 lg:w-[380px] animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <Card className="relative p-4 border-primary/30 shadow-xl">
        <button
          onClick={dismiss}
          aria-label={tl("guest.later")}
          className="absolute top-2.5 right-2.5 w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 mb-1 pr-8">
          <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
          <h2 id="guest-signup-title" className="font-semibold text-foreground">{tl("guest.title")}</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-3">{tl("guest.text")}</p>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-4">
          {features.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-1.5 text-xs text-foreground">
              <Icon className="w-3.5 h-3.5 text-primary flex-shrink-0" />{text}
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Button className="flex-1 h-10 rounded-xl" onClick={() => { setShow(false); nav("/auth"); }}>
            {tl("guest.cta")}
          </Button>
          <Button variant="ghost" className="h-10 rounded-xl" onClick={dismiss}>{tl("guest.later")}</Button>
        </div>
      </Card>
    </div>
  );
}
