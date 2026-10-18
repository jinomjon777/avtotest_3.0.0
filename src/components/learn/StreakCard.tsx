import { Award, Check, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MeterBar } from "@/components/ui/meter-bar";
import { useLearnT } from "@/hooks/useLearnT";
import type { ActivityDay, DashboardStats } from "@/hooks/useLearning";
import { daysToNextBadge, earnedBadges, STREAK_BADGES, weekdayOf } from "@/lib/streakBadges";

interface Props {
  stats: DashboardStats;
  days: ActivityDay[];
}

/** Kunlik qaytishga undovchi blok: seriya, hafta kunlari, bugungi maqsad, nishonlar. */
export function StreakCard({ stats, days }: Props) {
  const tl = useLearnT();
  const nav = useNavigate();
  const cur = stats.current_streak;
  const today = days.length ? days[days.length - 1].day : null;
  const atRisk = cur > 0 && !stats.today_done;
  const goalPct = stats.daily_goal ? Math.min(100, (stats.today_answers / stats.daily_goal) * 100) : 0;
  const earned = earnedBadges(stats.longest_streak);
  const toNext = daysToNextBadge(cur);

  return (
    <Card className="p-4 border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <Flame className={`w-5 h-5 ${cur > 0 ? "text-warning" : "text-muted-foreground"}`} />
          {cur > 0 ? tl("streak.title", { n: cur }) : tl("streak.none")}
        </div>
        <div className="text-xs text-muted-foreground">{tl("streak.longest")}: <span className="font-semibold text-foreground">{stats.longest_streak}</span></div>
      </div>

      <div className="flex gap-1.5 mb-4">
        {days.map((d) => {
          const done = d.answers > 0 || d.tests > 0;
          const isToday = d.day === today;
          return (
            <div key={d.day} className="flex-1 text-center">
              <div
                className={`h-9 rounded-lg flex items-center justify-center border ${done ? "bg-success/15 border-success/40 text-success" : isToday ? "border-primary/50 border-dashed" : "border-border bg-muted/40"}`}
              >
                {done && <Check className="w-4 h-4" />}
              </div>
              <div className={`text-[11px] mt-1 ${isToday ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{tl(`day.${weekdayOf(d.day)}`)}</div>
            </div>
          );
        })}
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{tl("streak.todayGoal")}</span>
          <span className="font-medium text-foreground">{stats.today_answers} / {stats.daily_goal}</span>
        </div>
        <MeterBar value={goalPct} tone={stats.today_done ? "success" : "warning"} />
      </div>

      {atRisk ? (
        <div className="rounded-lg bg-warning/15 p-3 flex items-center justify-between gap-3">
          <span className="text-sm text-foreground">{tl("streak.risk")}</span>
          <Button size="sm" className="rounded-lg shrink-0" onClick={() => nav("/mashq")}>{tl("streak.start")}</Button>
        </div>
      ) : stats.today_done ? (
        <p className="text-sm text-success">{tl("streak.safe")}</p>
      ) : null}

      <div className="mt-4 pt-3 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-foreground">{tl("streak.badges")}</span>
          {toNext != null && cur > 0 && <span className="text-xs text-muted-foreground">{tl("streak.nextBadge", { n: toNext })}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {STREAK_BADGES.map((b) => {
            const on = earned.includes(b);
            return (
              <span
                key={b}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${on ? "bg-primary/10 border-primary/30 text-primary" : "border-border text-muted-foreground opacity-60"}`}
              >
                <Award className="w-3.5 h-3.5" />{tl("streak.badge", { n: b })}
              </span>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
