import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { blogArticles } from "@/data/blogArticles";
import { Calendar, ArrowRight } from "lucide-react";

export default function Blog() {
  return (
    <MainLayout>
      <SEO
        title="Blog — Avto Test va Prava Imtihoni Bo'yicha Maqolalar"
        description="Avto test, YHQ savollari, yo'l belgilari va prava imtihoniga tayyorgarlik bo'yicha foydali maqolalar va amaliy maslahatlar."
        path="/blog"
        keywords="avto test blog, prava imtihoni maqolalari, YHQ maqolalar"
      />
      <Breadcrumbs items={[{ name: "Blog", path: "/blog" }]} />

      <section className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">
            Blog — Avto Test va Prava Imtihoni Bo'yicha Maqolalar
          </h1>
          <p className="text-muted-foreground mb-10 max-w-2xl">
            YHQ savollari, yo'l belgilari, imtihonga tayyorgarlik va ko'p uchraydigan xatolar haqida foydali va amaliy maqolalar.
          </p>

          <div className="grid sm:grid-cols-2 gap-5">
            {blogArticles.map((article) => (
              <Link key={article.slug} to={`/blog/${article.slug}`}>
                <Card className="h-full border border-border rounded-2xl hover:border-primary/50 transition-colors">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(article.publishedDate).toLocaleDateString("uz-UZ")}
                    </div>
                    <h2 className="font-bold text-foreground mb-2 leading-snug">{article.title}</h2>
                    <p className="text-sm text-muted-foreground mb-4 flex-1">{article.excerpt}</p>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                      O'qish <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}