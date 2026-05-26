import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProAccess } from "@/hooks/useProAccess";
import { useTestSession } from "@/hooks/useTestSession";
import { SEO } from "@/components/SEO";
import { TestStartPage } from "@/components/TestStartPage";
import { TestInterface } from "@/components/TestInterface";
import { AlertTriangle } from "lucide-react";

export default function Variant() {
  const variantStorageKey = 'variant_activeTest';

  const getInitialState = () => {
    try {
      const saved = localStorage.getItem(variantStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.testStarted && parsed.selectedVariant != null) {
          // Only restore if the in-progress test state still exists
          // (it's removed when the test finishes, so no orphan "active" state remains)
          const testKey = `testState_variant_${parsed.selectedVariant}`;
          if (!localStorage.getItem(testKey)) {
            localStorage.removeItem(variantStorageKey);
            return { testStarted: false, selectedVariant: null as number | null, sessionId: null as string | null };
          }
          return {
            testStarted: true,
            selectedVariant: parsed.selectedVariant as number,
            sessionId: (parsed.sessionId ?? null) as string | null,
          };
        }
      }
    } catch (e) { /* ignore */ }
    return { testStarted: false, selectedVariant: null as number | null, sessionId: null as string | null };
  };

  const initial = getInitialState();
  const [testStarted, setTestStarted]         = useState(initial.testStarted);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(initial.selectedVariant);
  const [sessionId, setSessionId]             = useState<string | null>(initial.sessionId);
  const [startError, setStartError]           = useState<string | null>(null);

  const { user, isLoading } = useAuth();
  const { hasAccess, loading: accessLoading } = useProAccess();
  const { starting, startSession } = useTestSession();

  // Persist active test state
  useEffect(() => {
    try {
      if (testStarted && selectedVariant !== null) {
        localStorage.setItem(variantStorageKey, JSON.stringify({ testStarted, selectedVariant, sessionId }));
      } else {
        localStorage.removeItem(variantStorageKey);
      }
    } catch (e) { /* ignore */ }
  }, [testStarted, selectedVariant, sessionId]);

  if (isLoading || accessLoading || !hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-medium">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  // Test in progress
  if (testStarted && selectedVariant !== null) {
    return (
      <TestInterface
        onExit={() => {
          setTestStarted(false);
          setSelectedVariant(null);
          setSessionId(null);
          setStartError(null);
        }}
        variant={selectedVariant}
        sessionId={sessionId}
        isPremiumSession={true}
      />
    );
  }

  const handleStartTest = async (variant: number) => {
    setStartError(null);
    const result = await startSession({
      variant,
      questionSource: `v${variant}.json`,
      isPremium: true,
    });

    if (!result.ok) {
      if (result.error === 'no_premium_access') {
        setStartError('Bu variantni boshlash uchun PREMIUM obuna kerak.');
      } else {
        setStartError('Serverga ulanishda xatolik. Qayta urinib ko\'ring.');
      }
      return;
    }

    setSessionId(result.session?.sessionId ?? null);
    setSelectedVariant(variant);
    setTestStarted(true);
  };

  // TestStartPage has its own full-page layout (header, profile, language)
  // so we render it without MainLayout wrapper, same as MavzuliTestlar
  return (
    <>
      <SEO
        title="Test variantlari - 61 variant"
        description="Haydovchilik guvohnomasi uchun 61 test varianti."
        path="/variant"
        keywords="test varianti, prava test, imtihon savollari, YHQ test"
      />
      {starting ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <TestStartPage onStartTest={handleStartTest} startError={startError} />
      )}
    </>
  );
}
