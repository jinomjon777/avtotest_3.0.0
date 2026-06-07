import { Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { BookOpen, Video } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProAccess } from "@/hooks/useProAccess";
import { getOrderedChapters } from "@/data/videoDarslar";
import { ChapterAccordion } from "@/components/darslik/ChapterAccordion";

export default function Darslik() {
  const { user, profile, isLoading } = useAuth();
  const { hasAccess, loading: accessLoading } = useProAccess();
  const chapters = getOrderedChapters();

  if (!isLoading && !user) return <Navigate to="/auth" replace />;
  if (!isLoading && !accessLoading && !hasAccess) return <Navigate to="/pro" replace />;

  if (isLoading || accessLoading) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <SEO title="Video Darslik - YHQ bo'yicha video darslar" description="Yo'l harakati qoidalari bo'yicha video darsliklar." path="/darslik" keywords="YHQ darslik, video darslar" />

      <section className="hero-bg py-6 md:py-8 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center border border-primary/20">
              <Video className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">Video Darslik</h1>
              <p className="text-xs text-white/40 hidden md:block">YHQ bo'yicha video darsliklar</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-amber-300/80">{chapters.length} bo'lim · {chapters.reduce((sum, c) => sum + c.data.length, 0)} video</span>
          </div>
        </div>
      </section>

      <section className="py-4 md:py-6 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ChapterAccordion chapters={chapters} />
        </div>
      </section>
    </MainLayout>
  );
}