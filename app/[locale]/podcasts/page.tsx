import { getAllPodcasts, getEpisodesByPodcast, formatDate, formatDuration } from "@/helper";
import Link from "next/link";
import { i18nConfig } from "@/i18n.config";
import ContentSearch from "@/components/search/ContentSearch";
import { getEditTagProps } from "@/lib/editTags";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return i18nConfig.locales.map((locale) => ({ locale }));
}

export async function generateMetadata() {
  return {
    title: "Podcasts | The Immersive Studio",
    description: "Explore our collection of podcasts featuring interviews, discussions, and expert conversations",
  };
}

export default async function PodcastsPage({ params }: PageProps) {
  const { locale } = await params;
  
  const allPodcasts = await getAllPodcasts(locale);
  
  // Get the featured podcast (first featured or first one)
  const featuredPodcast = allPodcasts.find((p: any) => p.is_featured) || allPodcasts[0];
  const otherPodcasts = allPodcasts.filter((p: any) => p.uid !== featuredPodcast?.uid);
  
  // Get episodes for the featured podcast to show "newest episode"
  const featuredEpisodes = featuredPodcast ? await getEpisodesByPodcast(featuredPodcast.uid, locale) : [];
  const newestEpisode = featuredEpisodes[0];
  
  // Get up next queue (mix of latest episodes from different podcasts)
  const upNextQueue = await getUpNextQueue(allPodcasts, locale);

  return (
    <main className="studio-page">
      {/* Cinematic Header */}
      <section className="studio-header">
        <div className="studio-header-bg">
          <div className="studio-gradient-overlay"></div>
        </div>
        <div className="container">
          <div className="studio-header-content">
            <div className="studio-brand">
              <div className="studio-icon-wrap">
                <div className="sound-bars">
                  <span></span><span></span><span></span><span></span><span></span>
                </div>
              </div>
              <div>
                <h1>The Immersive Studio</h1>
                <p className="studio-tagline">Sequential Listening Experience</p>
              </div>
            </div>
            <ContentSearch 
              locale={locale} 
              contentType="podcast"
              placeholder="Search shows & episodes..."
            />
          </div>
        </div>
      </section>

      {/* Cinema Hero + Queue Layout */}
      <section className="studio-cinema-section">
        <div className="container">
          <div className="cinema-layout">
            {/* Featured Series Hero */}
            {featuredPodcast && (
              <div className="cinema-hero">
                <div 
                  className="cinema-backdrop"
                  style={{ 
                    backgroundImage: featuredPodcast.cover_image?.url 
                      ? `url(${featuredPodcast.cover_image.url})` 
                      : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
                  }}
                >
                  <div className="cinema-backdrop-overlay"></div>
                </div>
                
                <div className="cinema-content">
                  <div 
                    className="cinema-cover"
                    {...getEditTagProps(featuredPodcast, 'cover_image', 'podcast', locale)}
                  >
                    <img 
                      src={featuredPodcast.cover_image?.url || 'https://via.placeholder.com/300x300?text=🎙️'} 
                      alt={featuredPodcast.title}
                    />
                    {/* Live Waveform Preview */}
                    <div className="waveform-preview">
                      <div className="waveform-bars">
                        {[...Array(20)].map((_, i) => (
                          <span key={i} style={{ animationDelay: `${i * 0.05}s` }}></span>
                ))}
              </div>
                    </div>
                  </div>
                  
                  <div className="cinema-info">
                    <div className="cinema-badges">
                      <span className="badge-featured">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        Featured Series
                      </span>
                      {newestEpisode && (
                        <span className="badge-newest">
                          <span className="pulse-dot"></span>
                          Newest Episode
                        </span>
                      )}
                    </div>
                    
                    <h2 
                      className="cinema-title"
                      {...getEditTagProps(featuredPodcast, 'title', 'podcast', locale)}
                    >
                      {featuredPodcast.title}
                    </h2>
                    
                    {featuredPodcast.description && (
                      <p 
                        className="cinema-description"
                        {...getEditTagProps(featuredPodcast, 'description', 'podcast', locale)}
                      >
                        {featuredPodcast.description}
                      </p>
                    )}
                    
                    <div className="cinema-meta">
                      <span className="meta-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                          <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        {featuredEpisodes.length} Episodes
                      </span>
                      {featuredPodcast.category?.[0] && (
                        <span className="meta-item category">
                          {featuredPodcast.category[0].title || featuredPodcast.category[0].name}
                        </span>
                      )}
                    </div>
                    
                    <div className="cinema-actions">
                      <Link href={`/${locale}/podcasts/${featuredPodcast.uid}`} className="btn-play-now">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                        Start Listening
                      </Link>
                      <button className="btn-add-queue">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19"/>
                          <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Add to Queue
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Up Next Queue Sidebar */}
            <aside className="queue-sidebar">
              <div className="queue-header">
                <h3>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="8" y1="6" x2="21" y2="6"/>
                    <line x1="8" y1="12" x2="21" y2="12"/>
                    <line x1="8" y1="18" x2="21" y2="18"/>
                    <line x1="3" y1="6" x2="3.01" y2="6"/>
                    <line x1="3" y1="12" x2="3.01" y2="12"/>
                    <line x1="3" y1="18" x2="3.01" y2="18"/>
                  </svg>
                  Up Next
                </h3>
                <span className="queue-count">{upNextQueue.length} episodes</span>
              </div>
              
              <div className="queue-list">
                {upNextQueue.slice(0, 6).map((item: any, index: number) => (
                  <div key={item.uid || index} className="queue-item">
                    <span className="queue-number">{index + 1}</span>
                    <div className="queue-thumb">
                      <img 
                        src={item.cover_image?.url || item.episode_cover_image?.url || 'https://via.placeholder.com/60x60?text=🎙️'} 
                        alt={item.title} 
                      />
                    </div>
                    <div className="queue-info">
                      <span className="queue-show">{item.showTitle || 'Latest Episode'}</span>
                      <h4 className="queue-title">{item.title}</h4>
                    </div>
                    <button className="queue-play-btn" title="Play">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              
              {upNextQueue.length > 6 && (
                <button className="queue-see-all">
                  See All ({upNextQueue.length})
                </button>
              )}
            </aside>
          </div>
        </div>
      </section>

      {/* All Shows - Timeline View */}
      <section className="studio-shows-section">
        <div className="container">
          <div className="section-header-studio">
            <h2>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
              All Shows
            </h2>
            <span className="shows-count">{allPodcasts.length} shows</span>
          </div>

          {allPodcasts.length > 0 ? (
            <div className="shows-timeline">
              {allPodcasts.map((podcast: any, index: number) => (
                <TimelineShowCard 
                  key={podcast.uid} 
                  podcast={podcast} 
                  locale={locale}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="studio-empty">
              <div className="empty-icon">🎙️</div>
              <h3>No shows yet</h3>
              <p>Check back later for new podcasts.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

// Timeline Show Card - breaks the square card pattern
function TimelineShowCard({ podcast, locale, index }: { podcast: any; locale: string; index: number }) {
  const author = podcast.author?.[0] || podcast.author;
  const category = podcast.category?.[0] || podcast.category;
  
  return (
    <Link href={`/${locale}/podcasts/${podcast.uid}`} className="timeline-show-row">
      <div className="timeline-marker">
        <span className="timeline-index">{String(index + 1).padStart(2, '0')}</span>
        <div className="timeline-line"></div>
      </div>
      
      <div 
        className="timeline-cover"
        {...getEditTagProps(podcast, 'cover_image', 'podcast', locale)}
      >
        <img 
          src={podcast.cover_image?.url || 'https://via.placeholder.com/100x100?text=🎙️'} 
          alt={podcast.title}
        />
        {podcast.is_featured && (
          <span className="timeline-featured-badge">★</span>
        )}
      </div>
      
      <div className="timeline-content">
        <div className="timeline-top">
        {category && (
            <span className="timeline-category">{category.title || category.name}</span>
        )}
          {podcast.is_featured && (
            <span className="timeline-badge-featured">Featured</span>
        )}
        </div>
        <h3 
          className="timeline-title"
          {...getEditTagProps(podcast, 'title', 'podcast', locale)}
        >
          {podcast.title}
        </h3>
        {podcast.description && (
          <p 
            className="timeline-desc"
            {...getEditTagProps(podcast, 'description', 'podcast', locale)}
          >
            {podcast.description.length > 120 
              ? podcast.description.substring(0, 120) + '...' 
              : podcast.description}
          </p>
        )}
        <div className="timeline-meta">
          {author && (
            <span className="timeline-host">
              {author.profile_image?.url && (
                <img src={author.profile_image.url} alt="" />
              )}
              {author.name || author.title}
            </span>
          )}
          <span className="timeline-date">{formatDate(podcast.publish_date, locale)}</span>
        </div>
      </div>
      
      <div className="timeline-action">
        <button className="timeline-play-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        </button>
      </div>
    </Link>
  );
}

// Helper function to get a queue of upcoming episodes
async function getUpNextQueue(podcasts: any[], locale: string) {
  const queue: any[] = [];
  
  // Get 2 episodes from each podcast (up to first 4 podcasts)
  for (const podcast of podcasts.slice(0, 4)) {
    try {
      const { getEpisodesByPodcast } = await import("@/helper");
      const episodes = await getEpisodesByPodcast(podcast.uid, locale);
      const topEpisodes = episodes.slice(0, 2).map((ep: any) => ({
        ...ep,
        showTitle: podcast.title,
        cover_image: ep.episode_cover_image || podcast.cover_image
      }));
      queue.push(...topEpisodes);
    } catch {
      // Skip if error
    }
  }
  
  // Sort by date and return
  return queue.sort((a, b) => 
    new Date(b.publish_date || 0).getTime() - new Date(a.publish_date || 0).getTime()
  );
}
