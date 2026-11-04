// Qurilma limiti dialogi faqat kerak bo'lganda yuklanadi (asosiy JS paketini kichik saqlash uchun).
import { lazy, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";

const DeviceLimitDialog = lazy(() =>
  import("./DeviceLimitDialog").then((m) => ({ default: m.DeviceLimitDialog })),
);

export function DeviceLimitGate() {
  const { deviceLimit } = useAuth();
  if (!deviceLimit) return null;
  return (
    <Suspense fallback={null}>
      <DeviceLimitDialog />
    </Suspense>
  );
}
