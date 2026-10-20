import { useEffect, useState } from "react";
import { BellRing, CalendarPlus, Send, Smartphone } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import type { DailyPlan } from "@/hooks/useLearning";
import { useLearnT } from "@/hooks/useLearnT";
import {
  disablePushOnThisDevice, downloadIcs, enablePush, googleCalendarUrl, pushSupport,
  saveReminder, sendTestReminder, telegramLinkUrl, unlinkTelegram,
} from "@/lib/reminders";

/** Eslatma sozlamalari: vaqt, Telegram, push-bildirishnoma, kalendar. */
export function ReminderSettings({ plan }: { plan: DailyPlan }) {
  const tl = useLearnT();
  const qc = useQueryClient();
  const r = plan.reminder;
  const [time, setTime] = useState(r?.time ?? "20:00");
  const [enabled, setEnabled] = useState(r?.enabled ?? true);
  const [telegram, setTelegram] = useState(r?.telegram ?? true);
  const [push, setPush] = useState(r?.push ?? true);
  const [busy, setBusy] = useState<string | null>(null);
  const [pushHere, setPushHere] = useState(false);
  const support = pushSupport();

  useEffect(() => {
    if (support !== "ok") return;
    navigator.serviceWorker.getRegistration("/sw.js")
      .then((reg) => reg?.pushManager.getSubscription())
      .then((s) => setPushHere(!!s && Notification.permission === "granted"))
      .catch(() => undefined);
  }, [support]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["learn", "plan"] });
  const fail = () => toast({ title: tl("common.error"), variant: "destructive" });

  const save = async (over?: Partial<{ enabled: boolean; telegram: boolean; push: boolean }>) => {
    setBusy("save");
    try {
      await saveReminder(over?.enabled ?? enabled, time, over?.telegram ?? telegram, over?.push ?? push);
      toast({ title: tl("rem.saved") });
      refresh();
    } catch { fail(); } finally { setBusy(null); }
  };

  const linkTelegram = async () => {
    // Oynani darhol ochamiz (mobil brauzerlar asinxron ochishni bloklaydi), havolani keyin beramiz
    const w = window.open("about:blank", "_blank");
    try {
      if (!r) await saveReminder(enabled, time, true, push); // vaqt saqlanmagan bo'lsa — avval saqlaymiz
      const url = await telegramLinkUrl();
      if (w) w.location.href = url; else window.location.href = url;
      toast({ title: tl("rem.telegram.hint") });
    } catch { w?.close(); fail(); }
  };

  const onEnablePush = async () => {
    setBusy("push");
    try {
      const res = await enablePush();
      if (res === "ok") {
        setPushHere(true);
        if (!r) await saveReminder(enabled, time, telegram, true);
        toast({ title: tl("rem.push.on") });
        refresh();
      } else {
        toast({ title: tl(`rem.push.${res}`), variant: "destructive" });
      }
    } catch { fail(); } finally { setBusy(null); }
  };

  const onTest = async () => {
    setBusy("test");
    try {
      const res = await sendTestReminder();
      const any = res.telegram === "ok" || (res.push ?? []).includes("ok");
      toast({ title: any ? tl("rem.test.sent") : tl("rem.test.none"), variant: any ? undefined : "destructive" });
    } catch { fail(); } finally { setBusy(null); }
  };

  return (
    <Card className="p-4 md:p-5 border-border space-y-5">
      <div className="flex items-center gap-2 font-semibold text-foreground">
        <BellRing className="w-5 h-5 text-primary" />{tl("rem.title")}
      </div>

      {/* Vaqt */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm text-muted-foreground">
          {tl("rem.time")}
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1 w-32 text-lg font-semibold" />
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground pb-2">
          <Switch checked={enabled} onCheckedChange={(v) => { setEnabled(v); if (r) save({ enabled: v }); }} />
          {tl("rem.enabled")}
        </label>
        <Button className="rounded-xl h-10 ml-auto" disabled={busy === "save" || !time} onClick={() => save()}>{tl("rem.save")}</Button>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">{tl("rem.repeatNote")}</p>

      {/* Telegram */}
      <div className="border-t border-border pt-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground"><Send className="w-4 h-4 text-primary" />{tl("rem.telegram")}</div>
          {plan.telegram_linked && (
            <Switch checked={telegram} onCheckedChange={(v) => { setTelegram(v); save({ telegram: v }); }} />
          )}
        </div>
        {plan.telegram_linked ? (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-success">✓ {tl("rem.telegram.linked")}</span>
            <Button variant="ghost" size="sm" onClick={async () => { await unlinkTelegram().catch(fail); refresh(); }}>{tl("rem.telegram.unlink")}</Button>
          </div>
        ) : (
          <Button variant="outline" className="rounded-xl" onClick={linkTelegram}>{tl("rem.telegram.link")}</Button>
        )}
      </div>

      {/* Push */}
      <div className="border-t border-border pt-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground"><Smartphone className="w-4 h-4 text-primary" />{tl("rem.push")}</div>
          {plan.push_devices > 0 && (
            <Switch checked={push} onCheckedChange={(v) => { setPush(v); save({ push: v }); }} />
          )}
        </div>
        {support === "ok" ? (
          pushHere ? (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-success">✓ {tl("rem.push.on")}</span>
              <Button variant="ghost" size="sm" onClick={async () => { await disablePushOnThisDevice(); setPushHere(false); refresh(); }}>{tl("rem.push.off")}</Button>
            </div>
          ) : (
            <Button variant="outline" className="rounded-xl" disabled={busy === "push"} onClick={onEnablePush}>{tl("rem.push.enable")}</Button>
          )
        ) : (
          <p className="text-xs text-muted-foreground">{tl(support === "ios-needs-install" ? "rem.push.ios" : support === "denied" ? "rem.push.denied" : "rem.push.unsupported")}</p>
        )}
      </div>

      {/* Kalendar */}
      <div className="border-t border-border pt-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground"><CalendarPlus className="w-4 h-4 text-primary" />{tl("rem.calendar")}</div>
        <p className="text-xs text-muted-foreground">{tl("rem.calendar.hint")}</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-xl">
            <a href={googleCalendarUrl(time)} target="_blank" rel="noopener noreferrer">{tl("rem.calendar.google")}</a>
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={() => downloadIcs(time)}>{tl("rem.calendar.ics")}</Button>
        </div>
      </div>

      {(plan.telegram_linked || plan.push_devices > 0) && (
        <div className="border-t border-border pt-4">
          <Button variant="ghost" size="sm" disabled={busy === "test"} onClick={onTest}>{tl("rem.test")}</Button>
        </div>
      )}
    </Card>
  );
}
