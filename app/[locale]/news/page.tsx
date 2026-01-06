import { getAllArticles, getAllCategories, getFeaturedArticles, getBreakingNews } from "@/helper";
import { Metadata } from "next";
import { i18nConfig } from "@/i18n.config";
import NewsroomContent from "@/components/news/NewsroomContent";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "The Newsroom - NewzHub",
  description: "Breaking news, in-depth stories, and comprehensive coverage",
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return i18nConfig.locales.map((locale) => ({ locale }));
}

export default async function NewsroomPage({ params }: PageProps) {
  const { locale } = await params;
  
  const [articles, categories, featuredArticles, breakingNews] = await Promise.all([
    getAllArticles(locale),
    getAllCategories(locale),
    getFeaturedArticles(locale),
    getBreakingNews(locale)
  ]);

  return (
    <main className="newsroom-page">
      <NewsroomContent 
        articles={articles || []}
        categories={categories || []}
        featuredArticles={featuredArticles || []}
        breakingNews={breakingNews || []}
        locale={locale}
      />
    </main>
  );
}
