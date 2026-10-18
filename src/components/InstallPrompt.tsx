import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLearnT } from "@/hooks/useLearnT";

const KEY = "pwa-install-dismissed";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone() {
  return window.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone === true;
}
function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
}
function wasDismissed() {
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
}

/**
 * "Ekranga qo'shish" taklifi. Android/Chrome'da brauzerning o'rnatish oynasi ochiladi,
 * iOS'da qo'lda qo'shish yo'riqnomasi ko'rsatiladi. O'rnatilgan yoki rad etilgan bo'lsa ko'rinmaydi.
 */
export function InstallPrompt() {
  const tl = useLearnT();
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (isStandalone() || wasDismissed()) return;
    if (isIos()) { setIos(true); setHidden(false); return; }
    const onPrompt = (e: Event) => { e.preventDefault(); setEvt(e as BIPEvent); setHidden(false); };
    const onInstalled = () => setHidden(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (hidden || (!evt && !ios)) return null;

  const dismiss = () => {
    try { localStorage.setItem(KEY, "1"); } catch { /* ignore */ }
    setHidden(true);
  };
  const install = async () => {
    if (!evt) return;
    await evt.prompt();
    await evt.userChoice.catch(() => null);
    setEvt(null);
    setHidden(true);
  };

  return (
    <Card className="p-4 border-border flex items-start gap-3">
      <Download className="w-5 h-5 text-primary shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-foreground">{tl("pwa.title")}</div>
        <p className="text-xs text-muted-foreground mt-0.5">{ios ? tl("pwa.ios") : tl("pwa.desc")}</p>
        {!ios && (
          <div className="mt-3 flex gap-2">
            <Button size="sm" className="rounded-lg h-10" onClick={install}>{tl("pwa.install")}</Button>
            <Button size="sm" variant="ghost" className="rounded-lg h-10" onClick={dismiss}>{tl("pwa.dismiss")}</Button>
          </div>
        )}
      </div>
      <button onClick={dismiss} aria-label={tl("pwa.dismiss")} className="p-1 text-muted-foreground"><X className="w-4 h-4" /></button>
    </Card>
  );
}
