import { getAllArticles, getAllCategories, getFeaturedArticles, getBreakingNews, getPageByURL } from "@/helper";
import { Metadata } from "next";
import { i18nConfig } from "@/i18n.config";
import NewsroomContent from "@/components/news/NewsroomContent";
import { getEditTagProps } from "@/lib/editTags";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const page = await getPageByURL("/news", locale);
  
  const headerHero = page?.components?.find((block: any) => 
    block.hero_section?.title?.toLowerCase().includes('newsroom')
  )?.hero_section;

  return {
    title: headerHero?.title || "The Newsroom - NewzHub",
    description: headerHero?.text_area || "Breaking news, in-depth stories, and comprehensive coverage",
  };
}

export async function generateStaticParams() {
  return i18nConfig.locales.map((locale) => ({ locale }));
}

export default async function NewsroomPage({ params }: PageProps) {
  const { locale } = await params;
  
  const [articles, categories, featuredArticles, breakingNews, page] = await Promise.all([
    getAllArticles(locale),
    getAllCategories(locale),
    getFeaturedArticles(locale),
    getBreakingNews(locale),
    getPageByURL("/news", locale)
  ]);

  // Extract CMS hero sections for different page areas
  const findHeroSection = (pattern: string) => {
    return page?.components?.find((block: any) => 
      block.hero_section?.title?.toLowerCase().includes(pattern.toLowerCase())
    )?.hero_section;
  };

  // Get component index for edit tags
  const findComponentIndex = (pattern: string) => {
    return page?.components?.findIndex((block: any) => 
      block.hero_section?.title?.toLowerCase().includes(pattern.toLowerCase())
    ) ?? -1;
  };

  const headerHero = findHeroSection('newsroom');
  const latestHero = findHeroSection('latest');
  const trendingHero = findHeroSection('trending');
  const mostReadHero = findHeroSection('most read') || findHeroSection('read');

  // Get indices for edit tags
  const headerIndex = findComponentIndex('newsroom');
  const latestIndex = findComponentIndex('latest');
  const mostReadIndex = findComponentIndex('most read') !== -1 ? findComponentIndex('most read') : findComponentIndex('read');

  return (
    <main className="newsroom-page">
      <NewsroomContent 
        articles={articles || []}
        categories={categories || []}
        featuredArticles={featuredArticles || []}
        breakingNews={breakingNews || []}
        locale={locale}
        headerTitle={headerHero?.title}
        latestStoriesTitle={latestHero?.title}
        trendingTopicsTitle={trendingHero?.title}
        mostReadTitle={mostReadHero?.title}
        page={page}
        headerIndex={headerIndex}
        latestIndex={latestIndex}
        mostReadIndex={mostReadIndex}
      />
    </main>
  );
}
