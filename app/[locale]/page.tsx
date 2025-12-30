import { getPageByURL, getFeaturedArticles, getBreakingNews, getAllArticles, getFeaturedPodcasts, getFeaturedVideos, getAllMagazines, timeAgo } from "@/helper";
import Link from "next/link";
import CategorySection from "@/components/home/CategorySection";
import AuthorsSection from "@/components/home/AuthorsSection";
import Newsletter from "@/components/home/Newsletter";
import BreakingNews from "@/components/home/BreakingNews";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  
  const [page, featuredArticles, breakingArticles, allArticles, featuredPodcasts, featuredVideos, magazines] = await Promise.all([
    getPageByURL("/", locale),
    getFeaturedArticles(locale),
    getBreakingNews(locale),
    getAllArticles(locale),
    getFeaturedPodcasts(locale),
    getFeaturedVideos(locale),
    getAllMagazines(locale)
  ]);

  const featuredMagazines = magazines?.slice(0, 3) || [];
  
  // Get recent articles (excluding featured)
  const featuredUids = featuredArticles?.map((a: any) => a.uid) || [];
  const recentArticles = allArticles?.filter((a: any) => !featuredUids.includes(a.uid)).slice(0, 6) || [];

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

  const getHeroImage = (article: any) => {
    if (!article?.group) return null;
    const heroGroup = article.group.find((g: any) => g.is_hero_image);
    return heroGroup?.image?.url || article.group[0]?.image?.url;
  };

  // Get categories and authors from CMS
  const categorySection = page.components?.find((block: any) => block.category_section)?.category_section;
  const authorsSection = page.components?.find((block: any) => block.authors_section)?.authors_section;

  return (
    <main className="home">
      {/* Breaking News - Original Carousel Design */}
      {breakingArticles && breakingArticles.length > 0 && (
        <BreakingNews articles={breakingArticles} title="Breaking" locale={locale} />
      )}

      {/* Categories Section - Below Breaking News */}
      {categorySection && (
        <CategorySection data={categorySection.category} locale={locale} />
      )}

      {/* Authors Section - Below Categories */}
      {authorsSection && (
            <AuthorsSection
          data={authorsSection.author} 
              title={topWritersHero?.title}
              description={topWritersHero?.text_area}
              locale={locale}
            />
      )}

      {/* Recommendation Section */}
      {recentArticles && recentArticles.length > 0 && (
        <section className="recommendation-section">
          <div className="container">
            <div className="section-header-simple">
              <h2>Recommendation</h2>
              <Link href={`/${locale}/news`} className="view-all-link">View all</Link>
            </div>
            
            <div className="recommendation-list">
              {recentArticles.map((article: any) => {
                const author = article.author?.[0];
                const category = article.category?.[0];
                
                return (
                  <Link key={article.uid} href={`/${locale}/news/${article.uid}`} className="recommendation-card">
                    <div className="recommendation-img">
                      <img src={getHeroImage(article) || 'https://via.placeholder.com/120x90'} alt={article.title} />
                    </div>
                    <div className="recommendation-info">
                      {category && <span className="card-category-sm">{category.title}</span>}
                      <h4>{article.title}</h4>
                      <div className="card-meta">
                        {author?.profile_image?.url && (
                          <img src={author.profile_image.url} alt="" className="meta-avatar" />
                        )}
                        <span>{author?.name || 'Staff'}</span>
                        <span className="dot">•</span>
                        <span>{timeAgo(article.published_date, locale)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Featured Articles - Editor's Pick Style */}
      {featuredArticles && featuredArticles.length > 0 && (
        <section className="editors-pick-section">
          <div className="container">
            <div className="section-header-simple">
              <h2>Editor's Pick</h2>
              <Link href={`/${locale}/news`} className="view-all-link">View all</Link>
            </div>
            
            <div className="editors-pick-grid">
              {featuredArticles.slice(0, 6).map((article: any) => {
                const category = article.category?.[0];
                return (
                  <Link key={article.uid} href={`/${locale}/news/${article.uid}`} className="editors-pick-card">
                    <div className="editors-pick-img">
                      <img src={getHeroImage(article) || 'https://via.placeholder.com/300x180'} alt={article.title} />
                    </div>
                    <div className="editors-pick-info">
                      <span className="pick-label">Editor's Pick</span>
                      {category && <span className="pick-category">{category.title}</span>}
                    </div>
                    <h4 className="editors-pick-title">{article.title}</h4>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Featured Podcasts */}
      {featuredPodcasts && featuredPodcasts.length > 0 && (
        <section className="content-section">
          <div className="container">
            <div className="section-header-simple">
              <h2>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: 8, verticalAlign: 'middle'}}>
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                </svg>
                Podcasts
              </h2>
              <Link href={`/${locale}/podcasts`} className="view-all-link">View all</Link>
            </div>
            
            <div className="podcasts-row">
              {featuredPodcasts.slice(0, 4).map((podcast: any) => (
                <Link key={podcast.uid} href={`/${locale}/podcasts/${podcast.uid}`} className="podcast-card-home">
                  <div className="podcast-card-img">
                    <img src={podcast.cover_image?.url || 'https://via.placeholder.com/200x200'} alt={podcast.title} />
                    <div className="play-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                    </div>
                  </div>
                  <h4>{podcast.title}</h4>
                  {podcast.author?.[0] && (
                    <span className="podcast-author">By {podcast.author[0].name || podcast.author[0].title}</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Videos */}
      {featuredVideos && featuredVideos.length > 0 && (
        <section className="content-section">
          <div className="container">
            <div className="section-header-simple">
              <h2>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: 8, verticalAlign: 'middle'}}>
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Videos
              </h2>
              <Link href={`/${locale}/videos`} className="view-all-link">View all</Link>
            </div>
            
            <div className="videos-row">
              {featuredVideos.slice(0, 3).map((video: any) => (
                <div key={video.uid} className="video-card-home">
                  <div className="video-card-thumb">
                    <img 
                      src={video.thumbnail?.url || (video.youtube_url ? `https://img.youtube.com/vi/${getYouTubeId(video.youtube_url)}/hqdefault.jpg` : 'https://via.placeholder.com/320x180')} 
                      alt={video.title} 
                    />
                    <div className="play-btn-overlay">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                    </div>
                  </div>
                  <h4>{video.title}</h4>
                  {video.category?.[0] && (
                    <span className="video-category">{video.category[0].title}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Magazines */}
      {featuredMagazines && featuredMagazines.length > 0 && (
        <section className="content-section">
          <div className="container">
            <div className="section-header-simple">
              <h2>Magazines</h2>
              <Link href={`/${locale}/magazine`} className="view-all-link">View all</Link>
            </div>
            
            <div className="magazines-row">
              {featuredMagazines.map((magazine: any) => (
                <Link key={magazine.uid} href={`/${locale}/magazine/${magazine.uid}`} className="magazine-card-home">
                  <div className="magazine-cover-img">
                    <img src={magazine.cover_image?.url || 'https://via.placeholder.com/200x280'} alt={magazine.title} />
                    {magazine.access_level === 'subscription' && (
                      <span className="premium-badge">Premium</span>
                    )}
                  </div>
                  <h4>{magazine.title}</h4>
                  {magazine.edition && <span className="magazine-edition">{magazine.edition}</span>}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter */}
      <Newsletter />
    </main>
  );
}

function getYouTubeId(url: string) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}
