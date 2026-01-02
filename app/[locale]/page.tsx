import { getPageByURL, getBreakingNews, getFeaturedPodcasts, getFeaturedVideos, getAllMagazines, getAllArticles } from "@/helper";
import AuthorsSection from "@/components/home/AuthorsSection";
import Newsletter from "@/components/home/Newsletter";
import BreakingNews from "@/components/home/BreakingNews";
import LatestPopularSidebar from "@/components/home/LatestPopularSidebar";
import FeaturedPosts from "@/components/home/FeaturedPosts";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  
  const [page, breakingArticles, allArticles, featuredPodcasts, featuredVideos, magazines] = await Promise.all([
    getPageByURL("/", locale),
    getBreakingNews(locale),
    getAllArticles(locale),
    getFeaturedPodcasts(locale),
    getFeaturedVideos(locale),
    getAllMagazines(locale)
  ]);

  const featuredMagazines = magazines?.slice(0, 3) || [];

  if (!page) {
    return (
      <main className="container" style={{ padding: '100px 20px', textAlign: 'center' }}>
        <h1>Welcome to NewzHub</h1>
        <p>Please create a Page entry in Contentstack with URL "/" to get started.</p>
      </main>
    );
  }

  const findHeroSection = (pattern: string) => {
    return page.components?.find((block: any) => 
      block.hero_section?.title?.toLowerCase().includes(pattern.toLowerCase())
    )?.hero_section;
  };

  const topWritersHero = findHeroSection('top writers') || findHeroSection('writers');

  // Get authors from CMS
  const authorsSection = page.components?.find((block: any) => block.authors_section)?.authors_section;

  // Get Newsletter cards from CMS
  const signinCard = page.components?.find((block: any) => 
    block.get_started___signin
  )?.get_started___signin;
  
  const newsletterCard = page.components?.find((block: any) => 
    block.newsletter_card
  )?.newsletter_card;

  // Exclude breaking news from latest articles
  const breakingUids = breakingArticles?.map((a: any) => a.uid) || [];
  const latestArticles = allArticles?.filter((a: any) => !breakingUids.includes(a.uid)) || [];
  
  // For popular, we can reverse or shuffle (in a real app, this would be based on views/likes)
  const popularArticles = [...latestArticles].reverse();

  return (
    <main className="home">
      {/* Hero Section: Breaking News + Latest/Popular Sidebar */}
      <section className="hero-split-section">
        <div className="container">
          <div className="hero-split-grid">
            {/* Breaking News - 70% */}
            <div className="hero-main-content">
              {breakingArticles && breakingArticles.length > 0 && (
                <BreakingNews articles={breakingArticles} title="Breaking" locale={locale} />
              )}
            </div>

            {/* Latest/Popular Sidebar - 30% */}
            <div className="hero-sidebar">
              <LatestPopularSidebar 
                latestArticles={latestArticles} 
                popularArticles={popularArticles}
                locale={locale}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Authors Section */}
      {authorsSection && (
        <AuthorsSection
          data={authorsSection.author} 
          title={topWritersHero?.title}
          description={topWritersHero?.text_area}
          locale={locale}
        />
      )}

      {/* Featured Posts from Videos, Podcasts, Magazines */}
      <FeaturedPosts 
        videos={featuredVideos || []}
        podcasts={featuredPodcasts || []}
        magazines={featuredMagazines || []}
        locale={locale}
      />

      {/* Newsletter / CTA Cards */}
      <Newsletter 
        signinCard={signinCard}
        newsletterCard={newsletterCard}
      />
    </main>
  );
}
