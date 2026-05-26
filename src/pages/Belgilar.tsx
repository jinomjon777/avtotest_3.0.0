import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { X, Search, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SignItem { src: string; title: string; }
interface SignGroup { title: string; items: SignItem[]; }

export default function Belgilar() {
  const [groups, setGroups] = useState<SignGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; src: string; title: string }>({ open: false, src: "", title: "" });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadFromHtml() {
      try {
        const res = await fetch("/belgilar/belgilar.html");
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        const sequence = Array.from(doc.querySelectorAll(".categories-header, .dez-box"));
        const results: SignGroup[] = [];
        let current: SignGroup | null = null;
        const seen = new Set<string>();
        sequence.forEach((node) => {
          if (node.classList.contains("categories-header")) {
            const title = (node.textContent || "").replace(/\s+/g, " ").trim();
            current = { title, items: [] };
            results.push(current);
          } else if (node.classList.contains("dez-box")) {
            const img = node.querySelector("img");
            const nameEl = node.querySelector("#prodname");
            if (!img) return;
            const src = img.getAttribute("src") || "";
            const file = src.split("/").pop();
            if (!file || seen.has(file)) return;
            seen.add(file);
            const mapped = "/belgilar/" + file;
            const title = (nameEl && nameEl.textContent?.trim()) || img.getAttribute("title") || img.getAttribute("alt") || file;
            if (!current) { current = { title: "Barcha belgilar", items: [] }; results.push(current); }
            current.items.push({ src: mapped, title });
          }
        });
        if (!cancelled) setGroups(results);
      } catch (err) {
        console.error("Error loading signs:", err);
        if (!cancelled) setGroups([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadFromHtml();
    return () => { cancelled = true; };
  }, []);

  const filteredGroups = groups
    .map((g) => ({ ...g, items: g.items.filter((i) => i.title.toLowerCase().includes(searchQuery.toLowerCase())) }))
    .filter((g) => g.items.length > 0);

  const totalSigns = groups.reduce((acc, g) => acc + g.items.length, 0);

  return (
    <MainLayout>
      <SEO 
        title="Yo'l belgilari 2026 - Barcha yangi belgilar"
        description="O'zbekiston yo'l belgilari 2026 yil uchun."
        path="/belgilar"
        keywords="yo'l belgilari, ogohlantiruvchi belgilar, taqiqlovchi belgilar"
      />

      <section className="bg-gradient-to-br from-[hsl(222_47%_8%)] via-[hsl(222_35%_14%)] to-[hsl(222_47%_8%)] py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-14 h-14 mx-auto mb-5 bg-amber-500/15 rounded-2xl flex items-center justify-center border border-amber-500/20">
            <AlertTriangle className="w-7 h-7 text-amber-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">Yo'l belgilari</h1>
          <p className="text-white/50 text-base mb-8">Yangi yo'l belgilari 2026 — {totalSigns} ta belgi</p>
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Belgilarni qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-5 text-base rounded-xl bg-white border-none shadow-lg"
            />
          </div>
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-12">
              {filteredGroups.map((group, idx) => (
                <div key={idx}>
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-foreground">{group.title}</h2>
                    <span className="px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-semibold">{group.items.length} ta</span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 md:gap-3">
                    {group.items.map((item, i) => (
                      <Card key={i} className="cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden rounded-xl border-border/60"
                        onClick={() => setModal({ open: true, src: item.src, title: item.title })}>
                        <CardContent className="p-0">
                          <div className="aspect-square bg-muted/30 flex items-center justify-center p-3">
                            <img src={item.src} alt={item.title} className="max-w-full max-h-full object-contain" loading="lazy" />
                          </div>
                          <div className="p-2 text-center">
                            <p className="text-[10px] md:text-xs text-foreground line-clamp-2">{item.title}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
              {filteredGroups.length === 0 && !loading && (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-lg">"{searchQuery}" bo'yicha hech narsa topilmadi</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {modal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModal({ open: false, src: "", title: "" }); }}>
          <div className="bg-card rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-scale-in">
            <div className="relative bg-muted/30 p-8 flex items-center justify-center">
              <button onClick={() => setModal({ open: false, src: "", title: "" })}
                className="absolute top-4 right-4 w-10 h-10 bg-card rounded-full flex items-center justify-center shadow-lg hover:bg-destructive hover:text-destructive-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
              <img src={modal.src} alt={modal.title} className="max-h-[50vh] object-contain" />
            </div>
            <div className="p-6 text-center">
              <h3 className="text-xl font-semibold text-foreground">{modal.title}</h3>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
