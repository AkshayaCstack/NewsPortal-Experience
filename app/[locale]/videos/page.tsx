import { getPageByURL, getAllVideos, getFeaturedVideos, getYouTubeId } from "@/helper";
import Link from "next/link";
import { i18nConfig } from "@/i18n.config";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return i18nConfig.locales.map((locale) => ({ locale }));
}

export const metadata = {
  title: "Videos | NewzHub",
  description: "Watch news explainers, interviews, reports, and visual stories",
};

export default async function VideosPage({ params }: PageProps) {
  const { locale } = await params;
  
  const [pageData, allVideos, featuredVideos] = await Promise.all([
    getPageByURL("/video-page", locale),
    getAllVideos(locale),
    getFeaturedVideos(locale)
  ]);

  const heroSection = pageData?.components?.find((c: any) => c.hero_section)?.hero_section;

  return (
    <main className="videos-page">
      {/* Hero Section */}
      <section className="video-hero">
        <div className="container">
          <div className="video-hero-content">
            <div className="video-hero-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
            </div>
            <h1>{heroSection?.title || "NEWS Videos"}</h1>
            {heroSection?.text_area && (
              <p className="video-hero-desc">{heroSection.text_area}</p>
            )}
          </div>
        </div>
      </section>

      {/* Featured Video */}
      {featuredVideos.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Featured Video</h2>
            </div>
            <div className="featured-video-card">
              <div className="featured-video-player">
                {getYouTubeId(featuredVideos[0].video_url?.href) ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeId(featuredVideos[0].video_url?.href)}`}
                    title={featuredVideos[0].title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : featuredVideos[0].thumbnail?.url ? (
                  <div className="video-thumbnail-large">
                    <img src={featuredVideos[0].thumbnail.url} alt={featuredVideos[0].title} />
                    <div className="play-btn-overlay">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="featured-video-info">
                {featuredVideos[0].category?.[0] && (
                  <span className="video-category-badge">
                    {featuredVideos[0].category[0].title || featuredVideos[0].category[0].name}
                  </span>
                )}
                <h3>{featuredVideos[0].title}</h3>
                {featuredVideos[0].description && (
                  <p className="video-description">{featuredVideos[0].description}</p>
                )}
                {featuredVideos[0].video_url?.href && (
                  <a 
                    href={featuredVideos[0].video_url.href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="watch-btn"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    Watch on YouTube
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* All Videos Grid */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">All Videos</h2>
            <span className="video-count">{allVideos.length} videos</span>
          </div>
          <div className="videos-grid">
            {allVideos.map((video: any) => {
              const category = video.category?.[0] || video.category;
              const youtubeId = getYouTubeId(video.video_url?.href);
              const thumbnailUrl = video.thumbnail?.url || 
                (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : null);
              
              return (
                <a 
                  key={video.uid} 
                  href={video.video_url?.href || '#'} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="video-card"
                >
                  <div className="video-card-thumbnail">
                    {thumbnailUrl ? (
                      <img src={thumbnailUrl} alt={video.title} />
                    ) : (
                      <div className="video-placeholder">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <polygon points="23 7 16 12 23 17 23 7"/>
                          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                        </svg>
                      </div>
                    )}
                    <div className="video-play-overlay">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                    </div>
                    {video.is_featured && (
                      <span className="video-badge">Featured</span>
                    )}
                  </div>
                  <div className="video-card-content">
                    {category && (
                      <span className="video-card-category">{category.title || category.name}</span>
                    )}
                    <h4 className="video-card-title">{video.title}</h4>
                    {video.description && (
                      <p className="video-card-desc">{video.description}</p>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
