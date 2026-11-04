// Profil: faol qurilmalar ro'yxati va boshqa qurilmani chiqarish.
import { useCallback, useEffect, useState } from "react";
import { Laptop, Smartphone, Loader2, ShieldCheck } from "lucide-react";
import { describeDevice, listDevices, revokeDevice, type DeviceRow } from "@/lib/device";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function DevicesCard() {
  const [devices, setDevices] = useState<DeviceRow[] | null>(null);
  const [max, setMax] = useState(2);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await listDevices();
      setDevices(r.devices);
      setMax(r.maxDevices);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik");
      setDevices([]);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const revoke = async (id: string) => {
    if (!window.confirm("Bu qurilma hisobdan chiqariladi. Davom etasizmi?")) return;
    setBusy(id);
    try {
      await revokeDevice(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik");
    }
    setBusy(null);
  };

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
        <h2 className="text-base font-semibold">Qurilmalar</h2>
        <span className="ml-auto text-xs text-muted-foreground">{devices?.length ?? 0} / {max}</span>
      </div>
      {devices === null ? (
        <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <ul className="space-y-2">
          {devices.map((d) => {
            const Icon = /Android|iPhone|iPad|Mobile/i.test(d.device_info ?? "") ? Smartphone : Laptop;
            return (
              <li key={d.device_id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <Icon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {describeDevice(d.device_info)} {d.current && <span className="text-xs text-primary">(shu qurilma)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Oxirgi faollik: {new Date(d.last_seen).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>
                {!d.current && (
                  <Button size="sm" variant="outline" disabled={!!busy} onClick={() => revoke(d.device_id)}>
                    {busy === d.device_id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Chiqarish"}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
      <p className="mt-3 text-xs text-muted-foreground">
        Bir vaqtda ko'pi bilan {max} ta qurilma. 30 kun ishlatilmagan qurilma avtomatik chiqariladi.
      </p>
    </Card>
  );
}
