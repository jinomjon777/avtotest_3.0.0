import { AlarmClock, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MeterBar } from "@/components/ui/meter-bar";
import { useDailyPlan } from "@/hooks/useLearning";
import { useLearnT } from "@/hooks/useLearnT";

/** Kabinetdagi "Kunlik reja" bloki: bugungi 5 ta test holati va eslatma vaqti. */
export function DailyPlanCard() {
  const tl = useLearnT();
  const nav = useNavigate();
  const { data: plan } = useDailyPlan();
  if (!plan) return null;

  const finished = plan.done >= plan.target;
  const time = plan.reminder?.enabled ? plan.reminder.time : null;

  return (
    <Card className="p-4 border-border">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <AlarmClock className="w-5 h-5 text-primary" />
          {tl("plan.title")}
          {time && <span className="text-xs font-normal text-muted-foreground">· {time}</span>}
        </div>
        <div className="text-sm font-semibold text-foreground">{plan.done} / {plan.target}</div>
      </div>
      <MeterBar value={Math.min(100, (plan.done / plan.target) * 100)} tone={finished ? "success" : "warning"} className="mb-3" />
      {finished ? (
        <p className="text-sm text-success flex items-center gap-1.5"><Check className="w-4 h-4" />{tl("plan.done")}</p>
      ) : (
        <Button className="w-full h-11 rounded-xl" onClick={() => nav("/kunlik-reja")}>
          {time ? tl("plan.card.cta") : tl("plan.card.setup")}
        </Button>
      )}
    </Card>
  );
}
