import { getAllArticles, getAllCategories, getFeaturedArticles } from "@/helper";
import { Metadata } from "next";
import { i18nConfig } from "@/i18n.config";
import ExploreContent from "@/components/news/ExploreContent";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Explore - NewzHub",
  description: "News from all around the world",
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return i18nConfig.locales.map((locale) => ({ locale }));
}

export default async function ExplorePage({ params }: PageProps) {
  const { locale } = await params;
  
  const [articles, categories, trendingArticles] = await Promise.all([
    getAllArticles(locale),
    getAllCategories(locale),
    getFeaturedArticles(locale)
  ]);

  return (
    <main className="explore-page">
      <ExploreContent 
        articles={articles || []}
        categories={categories || []}
        trendingArticles={trendingArticles || []}
        locale={locale}
      />
    </main>
  );
}
