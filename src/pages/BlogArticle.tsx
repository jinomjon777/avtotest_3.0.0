import { Link, useParams, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ArticleSchema } from "@/components/ArticleSchema";
import { Button } from "@/components/ui/button";
import { getArticleBySlug, blogArticles } from "@/data/blogArticles";
import { Calendar, ChevronRight, Play } from "lucide-react";

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getArticleBySlug(slug) : undefined;

  if (!article) return <Navigate to="/blog" replace />;

  const otherArticles = blogArticles.filter((a) => a.slug !== article.slug).slice(0, 3);

  return (
    <MainLayout>
      <SEO
        title={article.seoTitle}
        description={article.seoDescription}
        path={`/blog/${article.slug}`}
        keywords={article.keywords}
      />
      <Breadcrumbs items={[{ name: "Blog", path: "/blog" }, { name: article.title, path: `/blog/${article.slug}` }]} />
      <ArticleSchema
        title={article.title}
        description={article.seoDescription}
        path={`/blog/${article.slug}`}
        publishedDate={article.publishedDate}
      />

      <article className="py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(article.publishedDate).toLocaleDateString("uz-UZ")}
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-6 leading-tight">
            {article.title}
          </h1>

          <p className="text-lg text-muted-foreground mb-10 leading-relaxed">{article.excerpt}</p>

          <div className="space-y-9">
            {article.sections.map((section, i) => (
              <div key={i}>
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3">{section.heading}</h2>
                {section.paragraphs.map((p, j) => (
                  <p key={j} className="text-muted-foreground leading-relaxed mb-3">{p}</p>
                ))}
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 p-6 rounded-2xl bg-muted/50 border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="font-semibold text-foreground text-center sm:text-left">
              Bilimingizni hoziroq sinab ko'rmoqchimisiz?
            </p>
            <Link to="/test-ishlash">
              <Button className="bg-gradient-to-r from-[hsl(250_70%_56%)] to-[hsl(190_80%_45%)] hover:opacity-90 text-white gap-2 rounded-xl border-0 whitespace-nowrap">
                <Play className="w-4 h-4" /> Test ishlash
              </Button>
            </Link>
          </div>

          {/* Ichki havolalar */}
          <div className="mt-10">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide mb-4">Tegishli bo'limlar</h2>
            <div className="flex flex-wrap gap-3">
              {article.relatedLinks.map((link) => (
                <Link key={link.path} to={link.path}>
                  <Button variant="outline" size="sm" className="rounded-full gap-1">
                    {link.label} <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              ))}
            </div>
          </div>

          {/* Boshqa maqolalar */}
          {otherArticles.length > 0 && (
            <div className="mt-14 pt-10 border-t border-border">
              <h2 className="text-lg font-bold text-foreground mb-5">Boshqa maqolalar</h2>
              <div className="space-y-3">
                {otherArticles.map((a) => (
                  <Link
                    key={a.slug}
                    to={`/blog/${a.slug}`}
                    className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/50 transition-colors"
                  >
                    <span className="font-medium text-foreground text-sm">{a.title}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </MainLayout>
  );
}