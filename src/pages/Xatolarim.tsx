import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { SEO } from "@/components/SEO";
import { MainLayout } from "@/components/layout/MainLayout";
import { MistakeCard } from "@/components/learn/MistakeCard";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchMistakes, isSetupMissing, MistakeItem, useSavedKeys, useToggleSaved } from "@/hooks/useLearning";
import { useLearnT } from "@/hooks/useLearnT";
import { resolveQuestions, ResolvedQuestion } from "@/lib/questionLookup";
import { topicName } from "@/lib/topicName";
import { toast } from "@/hooks/use-toast";

type Tab = "open" | "solved" | "saved";
const PAGE = 20;
const LANG = { "uz-lat": "uz_lat", uz: "uz_cyr", ru: "ru" } as const;

export default function Xatolarim() {
  const { user, isLoading } = useAuth();
  const { language, questionLang } = useLanguage();
  const tl = useLearnT();
  const nav = useNavigate();
  const tl3 = LANG[language as keyof typeof LANG] ?? "uz_lat";

  const [tab, setTab] = useState<Tab>("open");
  const [items, setItems] = useState<MistakeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [qmap, setQmap] = useState<Map<string, ResolvedQuestion>>(new Map());
  const [loading, setLoading] = useState(true);
  const [setupMissing, setSetupMissing] = useState(false);
  const [failed, setFailed] = useState(false);
  const { data: savedRows } = useSavedKeys();
  const toggleSaved = useToggleSaved();
  const [savedLocal, setSavedLocal] = useState<Record<string, boolean>>({});
  const isSaved = (k: string) => savedLocal[k] ?? !!savedRows?.some((r) => r.question_key === k);

  useEffect(() => {
    if (!isLoading && !user) nav("/auth", { replace: true });
  }, [user, isLoading, nav]);

  const attach = useCallback(
    async (list: MistakeItem[]) => {
      const m = await resolveQuestions(list.map((x) => x.question_key), questionLang as any);
      setQmap((prev) => new Map([...prev, ...m]));
    },
    [questionLang],
  );

  // Tab almashganda boshidan yuklash
  useEffect(() => {
    if (!user) return;
    let alive = true;
    setLoading(true); setFailed(false); setItems([]);
    (async () => {
      try {
        let list: MistakeItem[] = [];
        let tot = 0;
        if (tab === "open") {
          const r = await fetchMistakes(PAGE, 0, true);
          list = r.items; tot = r.total;
        } else if (tab === "solved") {
          const r = await fetchMistakes(200, 0, false);
          list = r.items.filter((x) => x.resolved); tot = list.length;
        } else {
          const keys = (savedRows ?? []).map((s) => s.question_key);
          list = keys.map((k) => ({ question_key: k, topic_id: null, attempts: 0, wrong_count: 0, last_wrong_at: "", last_wrong_option: null, resolved: false }));
          tot = list.length;
        }
        if (!alive) return;
        setItems(list); setTotal(tot);
        await attach(list);
      } catch (e) {
        if (!alive) return;
        if (isSetupMissing(e)) setSetupMissing(true); else setFailed(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [user, tab, savedRows, attach]);

  const loadMore = async () => {
    try {
      const r = await fetchMistakes(PAGE, items.length, true);
      setItems((p) => [...p, ...r.items]);
      await attach(r.items);
    } catch { toast({ title: tl("common.error"), variant: "destructive" }); }
  };

  const onToggle = async (k: string) => {
    try {
      const r = await toggleSaved(k);
      setSavedLocal((s) => ({ ...s, [k]: r.saved }));
    } catch (e: any) {
      toast({ title: e?.message === "limit_reached" ? tl("saved.limit") : tl("common.error"), variant: "destructive" });
    }
  };

  const tabs: { id: Tab; label: string }[] = useMemo(
    () => [
      { id: "open", label: tl("mist.tab.open") },
      { id: "solved", label: tl("mist.tab.solved") },
      { id: "saved", label: tl("mist.tab.saved") },
    ],
    [tl],
  );

  return (
    <MainLayout>
      <SEO title={tl("mist.title")} description={tl("mist.subtitle")} path="/xatolarim" noIndex />
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-10">
        <h1 className="text-2xl font-bold text-foreground">{tl("mist.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-5">{tl("mist.subtitle")}</p>

        <div className="flex gap-1 p-1 rounded-xl bg-muted mb-5">
          {tabs.map((x) => (
            <button
              key={x.id}
              onClick={() => setTab(x.id)}
              className={`flex-1 h-10 rounded-lg text-sm font-medium transition-colors ${tab === x.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              {x.label}
            </button>
          ))}
        </div>

        {tab === "open" && items.length > 0 && (
          <Button className="w-full h-12 rounded-xl mb-4" onClick={() => nav("/mashq?mode=mistakes")}>
            {tl("mist.reviewAll")} ({total})
          </Button>
        )}

        {setupMissing ? (
          <p className="text-sm text-muted-foreground">{tl("common.setupMissing")}</p>
        ) : failed ? (
          <EmptyState icon={CheckCircle2} title={tl("common.error")} description="" actionLabel={tl("common.retry")} onAction={() => setTab(tab)} />
        ) : loading ? (
          <div className="space-y-3"><Skeleton className="h-40 rounded-xl" /><Skeleton className="h-40 rounded-xl" /></div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title={tl(`mist.empty.${tab}`)}
            description=""
            actionLabel={tab === "saved" ? undefined : tl("mist.startTest")}
            onAction={tab === "saved" ? undefined : () => nav("/test-ishlash")}
          />
        ) : (
          <div className="space-y-3">
            {items.map((it) => (
              <MistakeCard
                key={it.question_key}
                item={it}
                question={qmap.get(it.question_key)}
                topicLabel={topicName(it.topic_id, tl3)}
                isSaved={tab === "saved" ? savedLocal[it.question_key] !== false : isSaved(it.question_key)}
                onToggleSave={() => onToggle(it.question_key)}
                onReview={tab === "open" ? () => nav(`/mashq?mode=mistakes&first=${it.question_key}`) : undefined}
              />
            ))}
            {tab === "open" && items.length < total && (
              <Button variant="outline" className="w-full h-11 rounded-xl" onClick={loadMore}>{tl("mist.loadMore")}</Button>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
