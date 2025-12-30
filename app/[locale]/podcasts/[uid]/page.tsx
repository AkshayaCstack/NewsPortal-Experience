import { getPodcastByUid, getAllPodcastUids, getEpisodesByPodcast, formatDate, formatDateTime } from "@/helper";
import { notFound } from "next/navigation";
import Link from "next/link";
import { i18nConfig } from "@/i18n.config";

interface PageProps {
  params: Promise<{ uid: string; locale: string }>;
}

export async function generateStaticParams() {
  const params: { locale: string; uid: string }[] = [];
  
  for (const locale of i18nConfig.locales) {
    const uids = await getAllPodcastUids(locale);
    uids.forEach((uid: string) => {
      params.push({ locale, uid });
    });
  }
  
  return params;
}

export async function generateMetadata({ params }: PageProps) {
  const { uid, locale } = await params;
  const podcast = await getPodcastByUid(uid, locale);
  return {
    title: podcast ? `${podcast.title} | NewzHub Podcasts` : "Podcast Not Found",
    description: podcast?.description || "",
  };
}

export default async function PodcastDetailPage({ params }: PageProps) {
  const { uid, locale } = await params;
  const [podcast, episodes] = await Promise.all([
    getPodcastByUid(uid, locale),
    getEpisodesByPodcast(uid, locale)
  ]);

  if (!podcast) {
    notFound();
  }

  const author = podcast.author?.[0] || podcast.author;
  const category = podcast.category?.[0] || podcast.category;
  
  // Separate free and premium episodes
  const freeEpisodes = episodes.filter((ep: any) => ep.isfree === true);
  const premiumEpisodes = episodes.filter((ep: any) => ep.isfree !== true);

  return (
    <main className="podcast-detail-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link href={`/${locale}`}>Home</Link>
          <span>/</span>
          <Link href={`/${locale}/podcasts`}>Podcasts</Link>
          <span>/</span>
          <span className="current">{podcast.title}</span>
        </nav>

        {/* Podcast Header */}
        <div className="podcast-header-section">
          <div className="podcast-header-cover">
            <img 
              src={podcast.cover_image?.url || 'https://via.placeholder.com/400x400?text=Podcast'} 
              alt={podcast.title}
            />
            {podcast.is_featured && (
              <span className="podcast-featured-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                Featured
              </span>
            )}
          </div>
          
          <div className="podcast-header-info">
            <div className="podcast-header-badges">
              {category && (
                <span className="podcast-category-badge">{category.title || category.name}</span>
              )}
              <span className="podcast-type-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                </svg>
                Podcast
              </span>
            </div>
            
            <h1 className="podcast-header-title">{podcast.title}</h1>
            
            {podcast.description && (
              <p className="podcast-header-description">{podcast.description}</p>
            )}
            
            <div className="podcast-header-stats">
              <div className="podcast-stat-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>{formatDate(podcast.publish_date, locale)}</span>
              </div>
              <div className="podcast-stat-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <span>{episodes.length} Episode{episodes.length !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Host/Author */}
            {author && (
              <Link href={`/${locale}/author/${author.uid}`} className="podcast-host-card">
                <div className="host-avatar">
                  {author.profile_image?.url ? (
                    <img src={author.profile_image.url} alt={author.name || author.title} />
                  ) : (
                    <div className="avatar-placeholder">
                      {(author.name || author.title || 'U').charAt(0)}
                    </div>
                  )}
                </div>
                <div className="host-info">
                  <span className="host-label">Hosted by</span>
                  <span className="host-name">{author.name || author.title}</span>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Episodes Section */}
        <section className="episodes-section">
          <div className="episodes-header">
            <h2 className="episodes-title">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"/>
                <line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/>
                <line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
              All Episodes
            </h2>
            <div className="episodes-meta">
              <span className="free-count">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                  <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" fill="none"/>
                </svg>
                {freeEpisodes.length} Free
              </span>
              <span className="premium-count">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" fill="none" stroke="currentColor" strokeWidth="2"/>
                </svg>
                {premiumEpisodes.length} Premium
              </span>
            </div>
          </div>

          {episodes.length === 0 ? (
            <div className="no-episodes">
              <div className="no-episodes-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </div>
              <h3>No Episodes Yet</h3>
              <p>Episodes for this podcast will appear here once they are published.</p>
            </div>
          ) : (
            <div className="episodes-list">
              {episodes.map((episode: any, index: number) => {
                const isFree = episode.isfree === true;
                const episodeNumber = episode.episode_number || (episodes.length - index);
                
                return (
                  <article 
                    key={episode.uid} 
                    className={`episode-card ${isFree ? 'episode-free' : 'episode-premium'}`}
                  >
                    <div className="episode-cover">
                      <img 
                        src={episode.episode_cover_image?.url || podcast.cover_image?.url || 'https://via.placeholder.com/120x120?text=EP'} 
                        alt={episode.title}
                      />
                      {!isFree && (
                        <div className="episode-lock-overlay">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" fill="none" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        </div>
                      )}
                      {isFree && (
                        <div className="episode-play-overlay">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <div className="episode-content">
                      <div className="episode-top-row">
                        <span className="episode-number">Episode {episodeNumber}</span>
                        <span className={`episode-access-badge ${isFree ? 'free' : 'premium'}`}>
                          {isFree ? (
                            <>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                              Free
                            </>
                          ) : (
                            <>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                              </svg>
                              Premium
                            </>
                          )}
                        </span>
                      </div>
                      
                      <h3 className="episode-title">{episode.title}</h3>
                      
                      {episode.episode_summary && (
                        <div 
                          className="episode-summary"
                          dangerouslySetInnerHTML={{ 
                            __html: typeof episode.episode_summary === 'string' 
                              ? episode.episode_summary.substring(0, 150) + '...'
                              : ''
                          }}
                        />
                      )}
                      
                      <div className="episode-footer">
                        <span className="episode-date">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          {formatDate(episode.publish_date, locale)}
                        </span>
                        
                        {isFree && episode.audio_file?.url ? (
                          <button className="episode-play-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="5 3 19 12 5 21 5 3"/>
                            </svg>
                            Play Episode
                          </button>
                        ) : !isFree ? (
                          <button className="episode-unlock-btn">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                              <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                            </svg>
                            Unlock
                          </button>
                        ) : null}
                      </div>
                    </div>
                    
                    {/* Audio Player for Free Episodes */}
                    {isFree && episode.audio_file?.url && (
                      <div className="episode-audio-player">
                        <audio controls src={episode.audio_file.url}>
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Tags/Taxonomies */}
        {podcast.taxonomies && podcast.taxonomies.length > 0 && (
          <div className="podcast-tags">
            <h3>Tags</h3>
            <div className="podcast-tags-list">
              {podcast.taxonomies.map((tax: any, index: number) => (
                <span key={index} className="podcast-tag">
                  #{tax.term_uid}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
