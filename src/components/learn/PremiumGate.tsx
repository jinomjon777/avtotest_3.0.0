import { Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLearnT } from "@/hooks/useLearnT";
import type { FreeKind } from "@/lib/freeLimit";

/** Bepul kunlik limit tugaganda ko'rsatiladi: asosiy CTA — Premium olish. */
export function PremiumGate({ kind }: { kind: FreeKind }) {
  const tl = useLearnT();
  const nav = useNavigate();
  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <Card className="p-6 md:p-8 border-border text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Crown className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">{tl("limit.title")}</h1>
        <p className="text-muted-foreground mb-1">{tl(`limit.text.${kind}`)}</p>
        <p className="text-sm text-muted-foreground mb-6">{tl("limit.tomorrow")}</p>
        <div className="flex flex-col gap-2">
          <Button className="h-12 rounded-xl text-base" onClick={() => nav("/pro")}>
            <Crown className="w-4 h-4 mr-2" />{tl("limit.getPremium")}
          </Button>
          <Button variant="ghost" className="h-11 rounded-xl" onClick={() => nav("/dashboard")}>{tl("practice.toDashboard")}</Button>
        </div>
      </Card>
    </div>
  );
}
