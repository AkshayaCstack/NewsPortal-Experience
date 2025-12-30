import { getPageByURL, getAllPodcasts, getFeaturedPodcasts, formatDate } from "@/helper";
import Link from "next/link";
import { i18nConfig } from "@/i18n.config";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return i18nConfig.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return {
    title: "Podcasts | NewzHub",
    description: "Explore our collection of podcasts featuring interviews, discussions, and expert conversations",
  };
}

export default async function PodcastsPage({ params }: PageProps) {
  const { locale } = await params;
  
  const [pageData, allPodcasts, featuredPodcasts] = await Promise.all([
    getPageByURL("/podcast-page", locale),
    getAllPodcasts(locale),
    getFeaturedPodcasts(locale)
  ]);

  const heroSection = pageData?.components?.find((c: any) => c.hero_section)?.hero_section;

  return (
    <main className="podcasts-page">
      {/* Hero Section */}
      <section className="podcast-hero">
        <div className="podcast-hero-bg"></div>
        <div className="container">
          <div className="podcast-hero-content">
            <div className="podcast-hero-badge">
              <span className="podcast-hero-badge-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </span>
              Podcasts
            </div>
            <h1>{heroSection?.title || "Discover Our Podcasts"}</h1>
            {heroSection?.text_area ? (
              <p className="podcast-hero-desc">{heroSection.text_area}</p>
            ) : (
              <p className="podcast-hero-desc">
                Explore our collection of podcasts featuring in-depth interviews, 
                expert discussions, and compelling stories.
              </p>
            )}
            <div className="podcast-hero-stats">
              <div className="podcast-stat">
                <span className="podcast-stat-number">{allPodcasts.length}</span>
                <span className="podcast-stat-label">Shows</span>
              </div>
              <div className="podcast-stat-divider"></div>
              <div className="podcast-stat">
                <span className="podcast-stat-number">{featuredPodcasts.length}</span>
                <span className="podcast-stat-label">Featured</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Podcast */}
      {featuredPodcasts.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Featured Podcast</h2>
            </div>
            <Link href={`/${locale}/podcasts/${featuredPodcasts[0].uid}`} className="featured-podcast-card">
              <div className="featured-podcast-image">
                <img 
                  src={featuredPodcasts[0].cover_image?.url || 'https://via.placeholder.com/400x400?text=Podcast'} 
                  alt={featuredPodcasts[0].title}
                />
                <div className="featured-podcast-overlay">
                  <div className="featured-play-btn">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="featured-podcast-info">
                <div className="podcast-badge-row">
                  <span className="podcast-badge featured">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    Featured
                  </span>
                </div>
                <h3>{featuredPodcasts[0].title}</h3>
                <p className="podcast-description">{featuredPodcasts[0].description}</p>
                <div className="podcast-meta">
                  {featuredPodcasts[0].author?.[0] && (
                    <div className="podcast-host">
                      {featuredPodcasts[0].author[0].profile_image?.url && (
                        <img src={featuredPodcasts[0].author[0].profile_image.url} alt="" />
                      )}
                      <span>By {featuredPodcasts[0].author[0].name || featuredPodcasts[0].author[0].title}</span>
                    </div>
                  )}
                </div>
                <div className="podcast-cta">
                  <span className="listen-btn-inline">
                    View Episodes
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* All Podcasts Grid */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">All Podcasts</h2>
            <span className="episode-count">{allPodcasts.length} shows</span>
          </div>
          <div className="podcasts-grid">
            {allPodcasts.map((podcast: any) => {
              const author = podcast.author?.[0] || podcast.author;
              const category = podcast.category?.[0] || podcast.category;
              
              return (
                <Link key={podcast.uid} href={`/${locale}/podcasts/${podcast.uid}`} className="podcast-card">
                  <div className="podcast-card-image">
                    <img 
                      src={podcast.cover_image?.url || 'https://via.placeholder.com/300x300?text=Podcast'} 
                      alt={podcast.title}
                    />
                    <div className="podcast-play-overlay">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                    </div>
                    {podcast.is_featured && (
                      <span className="podcast-badge small">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="podcast-card-content">
                    {category && (
                      <span className="podcast-category">{category.title || category.name}</span>
                    )}
                    <h4 className="podcast-card-title">{podcast.title}</h4>
                    {podcast.description && (
                      <p className="podcast-card-desc">{podcast.description}</p>
                    )}
                    <div className="podcast-card-footer">
                      {author && (
                        <div className="podcast-card-author">
                          {author.profile_image?.url && (
                            <img src={author.profile_image.url} alt="" />
                          )}
                          <span>{author.name || author.title}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
