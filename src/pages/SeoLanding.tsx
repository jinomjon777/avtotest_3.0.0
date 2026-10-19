import { Link } from "react-router-dom";
import { CheckCircle2, Play } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FAQSchema } from "@/components/FAQSchema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import landings from "@/data/seoLandings.json";

export type Landing = (typeof landings)[number];
export const SEO_LANDINGS: Landing[] = landings;

/**
 * Ma'lumotga asoslangan SEO sahifa shabloni: title, description, H1, H2, FAQ + FAQPage schema,
 * breadcrumbs, canonical va Open Graph (SEO komponenti orqali) va ichki havolalar.
 * Har bir sahifaning matni src/data/seoLandings.json da; takrorlanmasligi scripts/check-seo-landings.mjs bilan tekshiriladi.
 */
export default function SeoLanding({ slug }: { slug: string }) {
  const page = SEO_LANDINGS.find((p) => p.slug === slug);
  if (!page) return null;

  return (
    <MainLayout>
      <SEO title={page.title} description={page.description} path={page.path} keywords={page.keywords} />
      <Breadcrumbs items={[{ name: page.title.split(" — ")[0], path: page.path }]} />
      <FAQSchema items={page.faq} />

      <section className="border-b border-border bg-muted/30 py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-4">{page.h1}</h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-6">{page.lead}</p>
          <Button asChild className="h-12 px-6 rounded-xl text-base gap-2">
            <Link to="/test-ishlash"><Play className="w-5 h-5" />{page.cta}</Link>
          </Button>
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-14 space-y-10">
        {page.sections.map((s) => (
          <section key={s.h2}>
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3">{s.h2}</h2>
            {"paragraphs" in s && s.paragraphs?.map((t, i) => (
              <p key={i} className="text-muted-foreground leading-relaxed mb-3">{t}</p>
            ))}
            {"bullets" in s && s.bullets && (
              <ul className="space-y-2">
                {s.bullets.map((b) => (
                  <li key={b} className="flex gap-2.5 text-muted-foreground leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-1" />{b}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <section>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">Ko'p beriladigan savollar</h2>
          <div className="space-y-3">
            {page.faq.map((f) => (
              <Card key={f.question} className="p-4 border-border">
                <h3 className="font-semibold text-foreground mb-1.5">{f.question}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.answer}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border p-5 md:p-6 text-center">
          <p className="font-semibold text-foreground mb-3">Bilimingizni hoziroq sinab ko'ring</p>
          <Button asChild className="h-12 px-6 rounded-xl">
            <Link to="/test-ishlash">{page.cta}</Link>
          </Button>
        </section>

        <nav aria-label="Tegishli sahifalar">
          <h2 className="text-base font-semibold text-foreground mb-3">Tegishli sahifalar</h2>
          <div className="flex flex-wrap gap-2">
            {page.links.map((l) => (
              <Link key={l.to} to={l.to} className="px-3 py-1.5 rounded-full border border-border text-sm text-foreground hover:border-primary/50">{l.label}</Link>
            ))}
          </div>
        </nav>
      </article>
    </MainLayout>
  );
}
