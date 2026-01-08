import { getAllVideos, getFeaturedVideos } from "@/helper";
import { i18nConfig } from "@/i18n.config";
import ContentSearch from "@/components/search/ContentSearch";
import Link from "next/link";
import { getEditTagProps } from "@/lib/editTags";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return i18nConfig.locales.map((locale) => ({ locale }));
}

export const metadata = {
  title: "Videos | NewzHub Cinema",
  description: "Watch news explainers, interviews, reports, and visual stories",
};



export default async function VideosPage({ params }: PageProps) {
  const { locale } = await params;
  
  const allVideos = await getAllVideos(locale);
  
  // Get hero video (featured or first)
  const featuredVideos = allVideos.filter((v: any) => v.is_featured);
  const heroVideo = featuredVideos[0] || allVideos[0];
  
  // Categorize videos for Netflix-style shelves
  const latestVideos = allVideos.slice(0, 8);
  const popularVideos = [...allVideos].sort(() => Math.random() - 0.5).slice(0, 8); // Simulated popularity
  
  // Group by category
  const videosByCategory = allVideos.reduce((acc: any, video: any) => {
    const category = video.category?.[0] || video.category;
    const categoryName = category?.title || category?.name || 'Uncategorized';
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(video);
    return acc;
  }, {});
  
  // Trending sidebar - simulated
  const trendingNow = allVideos.slice(0, 5);

  return (
    <main className="cinema-page">
      {/* Auto-Play Hero Section */}
      {heroVideo && (
        <section className="cinema-hero-section">
          <div className="cinema-hero-video">
            {/* Video Background - Muted Autoplay */}
            <div className="hero-video-container">
              {getYouTubeId(heroVideo.video_url?.href) ? (
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeId(heroVideo.video_url?.href)}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&playlist=${getYouTubeId(heroVideo.video_url?.href)}`}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  className="hero-video-iframe"
                />
              ) : heroVideo.thumbnail?.url ? (
                <img 
                  src={heroVideo.thumbnail.url} 
                  alt={heroVideo.title}
                  className="hero-video-fallback"
                />
              ) : (
                <div className="hero-video-placeholder">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                </div>
              )}
              <div className="hero-video-overlay"></div>
            </div>

            {/* Hero Content */}
            <div className="cinema-hero-content">
        <div className="container">
                <div className="hero-info">
                  <div className="hero-badges">
                    {heroVideo.is_featured && (
                      <span className="badge-featured">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        Featured
                      </span>
                    )}
                    {heroVideo.category?.[0] && (
                      <span className="badge-category">
                        {heroVideo.category[0].title || heroVideo.category[0].name}
                      </span>
                    )}
                  </div>
                  
                  <h1 
                    className="hero-title"
                    {...getEditTagProps(heroVideo, 'title', 'videos', locale)}
                  >
                    {heroVideo.title}
                  </h1>
                  
                  {heroVideo.description && (
                    <p 
                      className="hero-description"
                      {...getEditTagProps(heroVideo, 'description', 'videos', locale)}
                    >
                      {heroVideo.description.length > 150 
                        ? heroVideo.description.substring(0, 150) + '...' 
                        : heroVideo.description}
                    </p>
                  )}
                  
                  <div className="hero-actions">
                    <a 
                      href={heroVideo.video_url?.href || '#'} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-play-hero"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                      Play Now
                    </a>
                    <button className="btn-info">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                      More Info
                    </button>
                  </div>
                </div>

                {/* Muted indicator */}
                <div className="hero-muted-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <line x1="23" y1="9" x2="17" y2="15"/>
                    <line x1="17" y1="9" x2="23" y2="15"/>
                  </svg>
                  Muted Preview
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Search Bar */}
      <section className="cinema-search-section">
        <div className="container">
          <div className="cinema-search-row">
            <h2 className="cinema-browse-title">Browse All Videos</h2>
            <ContentSearch 
              locale={locale} 
              contentType="video"
              placeholder="Search videos..."
            />
          </div>
        </div>
      </section>

      {/* Main Content: Shelves + Trending Sidebar */}
      <section className="cinema-main">
        <div className="container">
          <div className="cinema-layout">
            {/* Binge Rows / Shelves */}
            <div className="cinema-shelves">
              {/* Latest Highlights */}
              <VideoShelf 
                title="Latest Highlights"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                }
                videos={latestVideos}
                locale={locale}
              />

              {/* Popular Now */}
              <VideoShelf 
                title="Popular Now"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 7l-7 5 7 5V7z"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                }
                videos={popularVideos}
                locale={locale}
              />

            

              {/* Empty State */}
              {allVideos.length === 0 && (
                <div className="cinema-empty">
                  <div className="empty-screen">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
                      <line x1="7" y1="2" x2="7" y2="22"/>
                      <line x1="17" y1="2" x2="17" y2="22"/>
                      <line x1="2" y1="12" x2="22" y2="12"/>
                      <line x1="2" y1="7" x2="7" y2="7"/>
                      <line x1="2" y1="17" x2="7" y2="17"/>
                      <line x1="17" y1="17" x2="22" y2="17"/>
                      <line x1="17" y1="7" x2="22" y2="7"/>
                    </svg>
                  </div>
                  <h3>No Videos Available</h3>
                  <p>Check back soon for new content.</p>
                </div>
              )}
            </div>

            {/* Watch Party / Trending Sidebar */}
            <aside className="trending-sidebar">
              <div className="trending-header">
                <div className="trending-icon">
                  <span className="trending-pulse"></span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23 7l-7 5 7 5V7z"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                </div>
                <h3>Trending Now</h3>
              </div>
              
              <div className="trending-list">
                {trendingNow.map((video: any, index: number) => (
                  <TrendingItem 
                    key={video.uid} 
                    video={video} 
                    rank={index + 1}
                    locale={locale}
                  />
                ))}
              </div>

              <div className="watch-party-cta">
                <span className="viewers-badge">
                  <span className="viewer-dot"></span>
                  Watch now
                </span>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

// Netflix-style Video Shelf
function VideoShelf({ title, icon, videos, locale }: { title: string; icon: React.ReactNode; videos: any[]; locale: string }) {
  if (videos.length === 0) return null;
  
  return (
    <div className="video-shelf">
      <div className="shelf-header">
        {icon}
        <h3>{title}</h3>
        <span className="shelf-count">{videos.length}</span>
      </div>
      <div className="shelf-scroll-container">
        <div className="shelf-scroll">
          {videos.map((video: any) => (
            <ShelfVideoCard key={video.uid} video={video} locale={locale} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Shelf Video Card
function ShelfVideoCard({ video, locale }: { video: any; locale: string }) {
  const youtubeId = getYouTubeId(video.video_url?.href);
  const thumbnailUrl = video.thumbnail?.url || 
    (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : null);
  const category = video.category?.[0] || video.category;

  return (
    <a 
      href={video.video_url?.href || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="shelf-video-card"
    >
      <div 
        className="shelf-card-thumb"
        {...getEditTagProps(video, 'thumbnail', 'videos', locale)}
      >
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={video.title} />
        ) : (
          <div className="shelf-thumb-placeholder">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>
        )}
        <div className="shelf-card-overlay">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        </div>
        {video.is_featured && (
          <span className="shelf-featured-badge">Featured</span>
        )}
      </div>
      <div className="shelf-card-info">
        {category && (
          <span className="shelf-card-category">{category.title || category.name}</span>
        )}
        <h4 
          className="shelf-card-title"
          {...getEditTagProps(video, 'title', 'videos', locale)}
        >
          {video.title}
        </h4>
      </div>
    </a>
  );
}

// Trending Sidebar Item
function TrendingItem({ video, rank, locale }: { video: any; rank: number; locale: string }) {
  const youtubeId = getYouTubeId(video.video_url?.href);
  const thumbnailUrl = video.thumbnail?.url || 
    (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/default.jpg` : null);

  return (
    <a 
      href={video.video_url?.href || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="trending-item"
    >
      <span className="trending-rank">{rank}</span>
      <div className="trending-thumb">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={video.title} />
        ) : (
          <div className="trending-thumb-placeholder">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>
        )}
      </div>
      <div className="trending-info">
        <h4 
          className="trending-title"
          {...getEditTagProps(video, 'title', 'videos', locale)}
        >
          {video.title}
        </h4>
        {video.category?.[0] && (
          <span className="trending-category">
            {video.category[0].title || video.category[0].name}
          </span>
        )}
      </div>
    </a>
  );
}

// Helper function for YouTube ID
function getYouTubeId(url: string | undefined): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}
