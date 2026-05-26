import { LucideIcon } from "lucide-react";
import { Card } from "./card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: string;
  variant?: "default" | "success" | "warning" | "destructive";
  className?: string;
}

const variantStyles = {
  default: "from-primary/10 to-primary/5 text-primary",
  success: "from-emerald-500/10 to-emerald-500/5 text-emerald-500",
  warning: "from-amber-500/10 to-amber-500/5 text-amber-500",
  destructive: "from-red-500/10 to-red-500/5 text-red-500",
};

export function StatCard({ icon: Icon, label, value, trend, variant = "default", className }: StatCardProps) {
  return (
    <Card className={cn("p-5 border-border/60 bg-card hover:shadow-md transition-shadow", className)}>
      <div className="flex items-start justify-between">
        <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center", variantStyles[variant])}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">{trend}</span>
        )}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
      </div>
    </Card>
  );
}
