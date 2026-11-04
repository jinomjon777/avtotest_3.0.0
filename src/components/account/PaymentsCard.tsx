// Profil: foydalanuvchining o'z to'lovlari (chek) va holati.
import { useEffect, useState } from "react";
import { Receipt, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

interface Payment {
  id: string;
  created_at: string | null;
  amount: number | null;
  tariff_days: number | null;
  status: string;
  premium_until: string | null;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Ko'rib chiqilmoqda", cls: "bg-amber-500/15 text-amber-600 dark:text-amber-300" },
  approved: { label: "Tasdiqlangan", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300" },
  rejected: { label: "Rad etilgan", cls: "bg-red-500/15 text-red-600 dark:text-red-300" },
};

export function PaymentsCard({ userId }: { userId: string }) {
  const [rows, setRows] = useState<Payment[] | null>(null);

  useEffect(() => {
    let alive = true;
    supabase
      .from("chek")
      .select("id, created_at, amount, tariff_days, status, premium_until")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => { if (alive) setRows((data as Payment[]) ?? []); });
    return () => { alive = false; };
  }, [userId]);

  if (rows !== null && rows.length === 0) return null;

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <Receipt className="h-5 w-5 text-primary" aria-hidden />
        <h2 className="text-base font-semibold">To'lovlarim</h2>
      </div>
      {rows === null ? (
        <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((p) => {
            const st = STATUS[p.status] ?? STATUS.pending;
            return (
              <li key={p.id} className="flex items-center gap-3 py-2.5 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {p.tariff_days ? `${p.tariff_days} kun` : "Tarif"}{p.amount ? ` · ${p.amount.toLocaleString("uz-UZ")} so'm` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {p.created_at ? new Date(p.created_at).toLocaleDateString("uz-UZ") : ""}
                    {p.premium_until ? ` · Premium ${new Date(p.premium_until).toLocaleDateString("uz-UZ")} gacha` : ""}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}>{st.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
