import { getPageByURL, getBreakingNews, getFeaturedPodcasts, getFeaturedVideos, getAllMagazines, getAllArticles } from "@/helper";
import AuthorsSection from "@/components/home/AuthorsSection";
import Newsletter from "@/components/home/Newsletter";
import BreakingNews from "@/components/home/BreakingNews";
import LatestPopularSidebar from "@/components/home/LatestPopularSidebar";
import FeaturedPosts from "@/components/home/FeaturedPosts";
import PersonalizeTracker from "@/components/analytics/PersonalizeTracker";
import OfferSection from "@/components/home/OfferSection";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ variant?: string; variantUid?: string }>;
}

export default async function HomePage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { variant, variantUid } = await searchParams;
  
  // Determine which variant to show based on variantUid from Personalize SDK
  // The SDK returns activeVariantShortUid which maps to your Contentstack experience variants:
  //   - variantUid '0' = First variant (Anonymous Promo - for anonymous users)
  //   - variantUid '1' = Second variant (Subscription Offer - for logged-in unsubscribed users)
  //   - null/undefined = Base entry (no personalization)
  let activeVariant: 'subscription_offer' | 'anonymous_promo' | null = null;
  
  if (variantUid === '0') {
    activeVariant = 'anonymous_promo';
  } else if (variantUid === '1') {
    activeVariant = 'subscription_offer';
  }
  
  console.log('[Personalize] Variant param:', variant);
  console.log('[Personalize] VariantUid param:', variantUid);
  console.log('[Personalize] Active Variant:', activeVariant);
  
  // Fetch page with personalization variant if available
  const [page, breakingArticles, allArticles, featuredPodcasts, featuredVideos, magazines] = await Promise.all([
    getPageByURL("/", locale, variant || null),
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

  // Get Newsletter cards from CMS (for anonymous users)
  const signinCardBlock = page.components?.find((block: any) => {
    const keys = Object.keys(block);
    return keys.some(k => k.includes('get_started') || k.includes('signin') || k.includes('sign_in'));
  });
  const signinCard = signinCardBlock ? Object.values(signinCardBlock)[0] : undefined;
  
  const newsletterCardBlock = page.components?.find((block: any) => 
    block.newsletter_card
  );
  const newsletterCard = newsletterCardBlock?.newsletter_card;

  // Get Offer Section from CMS (for unsubscribed users)
  const offerSectionBlock = page.components?.find((block: any) => {
    const keys = Object.keys(block);
    return keys.some(k => k.includes('offer_section') || k.includes('offer'));
  });
  const offerData = offerSectionBlock ? Object.values(offerSectionBlock)[0] as any : undefined;

  // Debug logging
  console.log('[Personalize] All component keys:', page.components?.map((c: any) => Object.keys(c)));
  console.log('[Personalize] Signin card found:', !!signinCard);
  console.log('[Personalize] Offer section found:', !!offerData);

  // Exclude breaking news from latest articles
  const breakingUids = breakingArticles?.map((a: any) => a.uid) || [];
  const latestArticles = allArticles?.filter((a: any) => !breakingUids.includes(a.uid)) || [];
  const popularArticles = [...latestArticles].reverse();

  return (
    <main className="home">
      {/* Personalization Impression Tracker */}
      <PersonalizeTracker variant={variant} />

      {/* Hero Section: Breaking News + Latest/Popular Sidebar */}
      <section className="hero-split-section">
        <div className="container">
          <div className="hero-split-grid">
            <div className="hero-main-content">
      {breakingArticles && breakingArticles.length > 0 && (
        <BreakingNews articles={breakingArticles} title="Breaking" locale={locale} />
      )}
            </div>
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

      {/* Featured Posts */}
      <FeaturedPosts 
        videos={featuredVideos || []}
        podcasts={featuredPodcasts || []}
        magazines={featuredMagazines || []}
        locale={locale}
      />

      {/* ================================================
          PERSONALIZED CONTENT - VARIANT-DRIVEN RENDERING
          ================================================ */}
      
      {/* Subscription Offer - ONLY for subscription_offer variant */}
      {activeVariant === 'subscription_offer' && offerData && (
        <OfferSection
          title={offerData.title}
          description={offerData.description}
          discountPercent={offerData.discount_percent}
          price={offerData.price}
        />
      )}

      {/* Sign-in / Get Started - ONLY for anonymous_promo variant */}
      {activeVariant === 'anonymous_promo' && signinCard && (
        <Newsletter 
          signinCard={signinCard}
          newsletterCard={newsletterCard}
        />
      )}

      {/* Default Newsletter - When no variant is active (base entry) */}
      {!activeVariant && (
        <Newsletter 
          signinCard={undefined}
          newsletterCard={newsletterCard}
        />
      )}
    </main>
  );
}
