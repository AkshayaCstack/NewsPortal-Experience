import { getPageByURL, getBreakingNews, getFeaturedPodcasts, getFeaturedVideos, getAllMagazines, getAllArticles } from "@/helper";
import AuthorsSection from "@/components/home/AuthorsSection";
import Newsletter from "@/components/home/Newsletter";
import BreakingNews from "@/components/home/BreakingNews";
import LatestPopularSidebar from "@/components/home/LatestPopularSidebar";
import FeaturedPosts from "@/components/home/FeaturedPosts";
import PersonalizeTracker from "@/components/analytics/PersonalizeTracker";
import OfferSection from "@/components/home/OfferSection";
import WalkthroughWrapper from "@/components/walkthrough/WalkthroughWrapper";
import { headers, cookies } from "next/headers";

// Disable caching to ensure fresh personalization on every request
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ variant?: string }>;
}

export default async function HomePage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  
  // Read variant from HEADERS (primary) or COOKIES (fallback for production)
  const headersList = await headers();
  const cookieStore = await cookies();
  
  // Try header first, then cookie fallback
  const variantFromHeader = headersList.get('x-personalize-variant');
  const variantFromCookie = cookieStore.get('x-personalize-variant')?.value;
  const variant = variantFromHeader || variantFromCookie || undefined;
  
  console.log('=== [Page] HOMEPAGE DEBUG ===');
  console.log('[Page] Locale:', locale);
  console.log('[Page] Variant from header:', variantFromHeader);
  console.log('[Page] Variant from cookie:', variantFromCookie);
  console.log('[Page] Using variant:', variant);
  
  // Fetch page with personalization variant if available
  // The CMS decides what components to return based on the variant
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
    console.log('[Page] ERROR: No page returned from CMS!');
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

  // ============================================
  // RENDER ONLY WHAT CMS RETURNS
  // CMS is the source of truth for personalization
  // React is a dumb renderer
  // ============================================

  // Find Offer Section block if CMS included it
  const offerBlock = page.components?.find(
    (block: any) => block.offer_section
  )?.offer_section;

  // Find Sign-in card block if CMS included it
  const signinBlock = page.components?.find((block: any) => {
    const keys = Object.keys(block);
    return keys.some(k => k.includes('get_started') || k.includes('signin') || k.includes('sign_in'));
  });
  const signinCard = signinBlock ? Object.values(signinBlock)[0] : undefined;

  // Find Newsletter card block
  const newsletterBlock = page.components?.find((block: any) => 
    block.newsletter_card
  );
  const newsletterCard = newsletterBlock?.newsletter_card;

  // Find Walkthrough blocks for new user experience
  const walkthroughStepsBlock = page.components?.find((block: any) => 
    block.walkthrough_steps
  );
  const walkthroughSteps = walkthroughStepsBlock?.walkthrough_steps?.step || [];
  
  const getStartedBlock = page.components?.find((block: any) => 
    block.get_started_signin
  );
  const getStartedData = getStartedBlock?.get_started_signin;
  
  // DEBUG: Log what was found
  console.log('[Page] --- COMPONENT DETECTION ---');
  console.log('[Page] All component keys:', page.components?.map((c: any) => Object.keys(c)));
  console.log('[Page] offerBlock found:', !!offerBlock);
  console.log('[Page] signinBlock found:', !!signinBlock);
  console.log('[Page] signinCard extracted:', !!signinCard);
  console.log('[Page] newsletterCard found:', !!newsletterCard);
  console.log('[Page] walkthroughSteps found:', walkthroughSteps.length, 'steps');
  console.log('[Page] getStartedData found:', !!getStartedData);
  console.log('[Page] --- RENDERING DECISIONS ---');
  console.log('[Page] Will render OfferSection:', !!offerBlock);
  console.log('[Page] Will render Newsletter with signin:', !!(signinCard));
  console.log('[Page] Will render Newsletter without signin:', !!(!signinCard && newsletterCard));
  console.log('[Page] Will render Walkthrough:', walkthroughSteps.length > 0);
  console.log('=== [Page] END DEBUG ===');

  // Exclude breaking news from latest articles
  const breakingUids = breakingArticles?.map((a: any) => a.uid) || [];
  const latestArticles = allArticles?.filter((a: any) => !breakingUids.includes(a.uid)) || [];
  const popularArticles = [...latestArticles].reverse();

  return (
    <main className="home">
      {/* Personalization Impression Tracker */}
      <PersonalizeTracker variant={variant} />

      {/* Walkthrough for New Users - Rendered if CMS includes it */}
      {walkthroughSteps.length > 0 && (
        <WalkthroughWrapper
          welcomeTitle={getStartedData?.title}
          welcomeDescription={getStartedData?.description}
          buttonText={getStartedData?.button_text}
          steps={walkthroughSteps}
        />
      )}

      {/* Hero Section: Breaking News + Latest/Popular Sidebar */}
      <section className="hero-split-section" id="hero-section-split">
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

      {/* ============================================
          PERSONALIZED CONTENT - CMS-DRIVEN RENDERING
          Render ONLY what CMS returns in the variant
          ============================================ */}
      
      {/* Offer Section - rendered if CMS included it in the variant */}
      {offerBlock && (
        <OfferSection
          title={offerBlock.title}
          description={offerBlock.description}
          discountPercent={offerBlock.discount_percent}
          price={offerBlock.price}
        />
      )}

      {/* Sign-in section - rendered if CMS included it in the variant */}
      {signinCard && (
        <Newsletter 
          signinCard={signinCard}
          newsletterCard={newsletterCard}
        />
      )}

      {/* Default Newsletter - only when no signin card (base entry or subscribed user) */}
      {!signinCard && newsletterCard && (
        <Newsletter newsletterCard={newsletterCard} />
      )}
    </main>
  );
}
