// Qurilma limiti to'lganda (kirish paytida) ko'rsatiladi: boshqa qurilmani chiqarish yoki shu yerdan chiqish.
import { useState } from "react";
import { Laptop, Smartphone, LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { describeDevice } from "@/lib/device";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function DeviceLimitDialog() {
  const { deviceLimit, resolveDeviceLimit, signOut } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (!deviceLimit) return null;

  const revoke = async (id: string) => {
    setBusy(id);
    setError("");
    const r = await resolveDeviceLimit(id);
    if (r.error) setError(r.error);
    setBusy(null);
  };

  return (
    <AlertDialog open>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Qurilmalar limiti to'lgan</AlertDialogTitle>
          <AlertDialogDescription>
            Bitta hisobdan bir vaqtda ko'pi bilan {deviceLimit.maxDevices} ta qurilmada foydalanish mumkin.
            Davom etish uchun quyidagilardan birini hisobdan chiqaring (haftasiga 3 martagacha) yoki shu qurilmadan chiqing.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ul className="space-y-2">
          {deviceLimit.devices.map((d) => {
            const mobile = /Android|iPhone|iPad|Mobile/i.test(d.device_info ?? "");
            const Icon = mobile ? Smartphone : Laptop;
            return (
              <li key={d.device_id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <Icon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{describeDevice(d.device_info)}</p>
                  <p className="text-xs text-muted-foreground">Oxirgi faollik: {fmt(d.last_seen)}</p>
                </div>
                <Button size="sm" variant="outline" disabled={!!busy} onClick={() => revoke(d.device_id)}>
                  {busy === d.device_id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Chiqarish"}
                </Button>
              </li>
            );
          })}
        </ul>

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

        <AlertDialogFooter>
          <Button variant="ghost" onClick={() => void signOut()} disabled={!!busy}>
            <LogOut className="mr-2 h-4 w-4" /> Shu qurilmadan chiqish
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
