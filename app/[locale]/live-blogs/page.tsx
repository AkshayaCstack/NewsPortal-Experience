import Link from 'next/link';
import { getAllLiveBlogs, formatDate, formatDateTime, jsonRteToText } from '@/helper';
import { i18nConfig } from "@/i18n.config";
import ContentSearch from "@/components/search/ContentSearch";
import { getEditTagProps } from "@/lib/editTags";

// Helper to strip HTML tags from text
function stripHtmlTags(text: string): string {
  if (!text) return '';
  return text.replace(/<[^>]*>/g, '').trim();
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return i18nConfig.locales.map((locale) => ({ locale }));
}

// Status badge colors and labels
const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  live: { label: 'LIVE', color: '#ef4444', icon: '🔴' },
  paused: { label: 'PAUSED', color: '#f59e0b', icon: '⏸️' },
  ended: { label: 'ENDED', color: '#10b981', icon: '✅' },
  upcoming: { label: 'UPCOMING', color: '#3b82f6', icon: '📅' },
};

export const metadata = {
  title: 'Command Center - Live Coverage',
  description: 'Real-time monitoring of breaking news and events',
};

export default async function LiveBlogsPage({ params }: PageProps) {
  const { locale } = await params;
  const liveBlogs = await getAllLiveBlogs(locale);

  // Separate live blogs by status
  const activeLiveBlogs = liveBlogs.filter((blog: any) => blog.status === 'live');
  const upcomingBlogs = liveBlogs.filter((blog: any) => blog.status === 'upcoming');
  const endedBlogs = liveBlogs.filter((blog: any) => blog.status === 'ended' || blog.status === 'paused');
  
  // Primary live blog for command center view
  const primaryLiveBlog = activeLiveBlogs[0];
  const secondaryLiveBlog = activeLiveBlogs[1];
  
  // Calculate aggregate metrics from actual CMS data
  const totalUpdates = liveBlogs.reduce((sum: number, blog: any) => sum + (blog.liveupdates?.length || 0), 0);

  return (
    <main className="command-center-page">
      {/* Command Center Header */}
      <section className="command-header">
        <div className="command-header-bg">
          <div className="data-grid-bg"></div>
          <div className="scan-line"></div>
        </div>
        <div className="container">
          <div className="command-header-content">
            <div className="command-brand">
              <div className="command-icon">
                <span className="pulse-ring"></span>
                <span className="pulse-ring delay-1"></span>
                <span className="pulse-ring delay-2"></span>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="4"/>
                </svg>
              </div>
              <div>
                <h1>Command Center</h1>
                <p className="command-tagline">Real-Time Data Streams</p>
              </div>
            </div>
            <ContentSearch 
              locale={locale} 
              contentType="live_blog"
              placeholder="Search coverage..."
            />
          </div>
        </div>
      </section>

      {/* Live Metrics Dashboard */}
      <section className="metrics-dashboard">
        <div className="container">
          <div className="metrics-grid">
            <div className="metric-card active-streams">
              <div className="metric-icon">
                <span className="live-dot"></span>
              </div>
              <div className="metric-data">
                <span className="metric-value">{activeLiveBlogs.length}</span>
                <span className="metric-label">Active Streams</span>
              </div>
            </div>
            <div className="metric-card total-updates">
              <div className="metric-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              </div>
              <div className="metric-data">
                <span className="metric-value">{totalUpdates}</span>
                <span className="metric-label">Total Updates</span>
              </div>
            </div>
            <div className="metric-card upcoming">
              <div className="metric-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div className="metric-data">
                <span className="metric-value">{upcomingBlogs.length}</span>
                <span className="metric-label">Upcoming</span>
              </div>
            </div>
            <div className="metric-card coverage-count">
              <div className="metric-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="3" y1="9" x2="21" y2="9"/>
                  <line x1="9" y1="21" x2="9" y2="9"/>
                </svg>
              </div>
              <div className="metric-data">
                <span className="metric-value">{liveBlogs.length}</span>
                <span className="metric-label">Total Coverage</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="command-main">
        <div className="container">
          {/* Active Coverage - Split Screen for Multiple Live */}
          {activeLiveBlogs.length > 0 && (
            <div className="active-coverage-section">
              <div className="section-header-command">
                <h2>
                  <span className="live-indicator-pulse"></span>
                  Active Coverage
              </h2>
                <span className="coverage-badge">{activeLiveBlogs.length} LIVE</span>
              </div>

              {/* Dual Feed Layout */}
              <div className={`live-feeds-grid ${activeLiveBlogs.length >= 2 ? 'dual-feed' : 'single-feed'}`}>
                {activeLiveBlogs.slice(0, 2).map((blog: any, index: number) => (
                  <CommandFeedCard 
                    key={blog.uid} 
                    blog={blog} 
                    locale={locale}
                    isPrimary={index === 0}
                  />
                ))}
              </div>

              {/* Additional Active Streams */}
              {activeLiveBlogs.length > 2 && (
                <div className="additional-streams">
                  <h3>More Active Streams</h3>
                  <div className="streams-row">
                    {activeLiveBlogs.slice(2).map((blog: any) => (
                      <StreamMiniCard key={blog.uid} blog={blog} locale={locale} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Two Column Layout: Key Events + All Coverage */}
          <div className="command-layout">
            {/* Left: Key Events Ticker */}
            <aside className="key-events-rail">
              <div className="rail-header">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                <h3>Key Moments</h3>
              </div>
              <div className="key-events-list">
                {liveBlogs.slice(0, 5).map((blog: any) => {
                  const updates = blog.liveupdates || [];
                  const highlights = updates.filter((u: any) => u.update?.is_highlight).slice(0, 2);
                  
                  return highlights.map((item: any, idx: number) => (
                    <Link 
                      key={`${blog.uid}-${idx}`}
                      href={`/${locale}/live-blogs/${blog.uid}`}
                      className="key-event-item"
                    >
                      <time className="event-time">
                        {formatEventTime(item.update?.timestamp)}
                      </time>
                      <div className="event-content">
                        <span className="event-source">{blog.title}</span>
                        <p className="event-text">
                          {item.update?.headline || jsonRteToText(item.update?.body)?.substring(0, 80)}
                        </p>
                      </div>
                    </Link>
                  ));
                })}
                {liveBlogs.length === 0 && (
                  <div className="no-events">
                <span>📡</span>
                    <p>No key moments yet</p>
                  </div>
                )}
              </div>
            </aside>

            {/* Right: All Coverage Feed */}
            <div className="coverage-feed">
              {/* Upcoming Coverage */}
              {upcomingBlogs.length > 0 && (
                <div className="coverage-group">
                  <h3 className="group-title">
                    <span className="status-dot upcoming"></span>
                    Upcoming Coverage
                  </h3>
                  <div className="coverage-list">
                    {upcomingBlogs.map((blog: any) => (
                      <CoverageListItem key={blog.uid} blog={blog} locale={locale} />
                    ))}
                  </div>
                </div>
              )}

              {/* Ended Coverage */}
              {endedBlogs.length > 0 && (
                <div className="coverage-group">
                  <h3 className="group-title">
                    <span className="status-dot ended"></span>
                    Recent Coverage
                  </h3>
                  <div className="coverage-list">
                    {endedBlogs.map((blog: any) => (
                      <CoverageListItem key={blog.uid} blog={blog} locale={locale} />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {liveBlogs.length === 0 && (
                <div className="command-empty">
                  <div className="empty-radar">
                    <div className="radar-sweep"></div>
                    <span className="radar-dot"></span>
                  </div>
                  <h3>No Coverage Active</h3>
                  <p>Check back soon for live updates.</p>
              </div>
            )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// Command Feed Card - Large format for active coverage
function CommandFeedCard({ blog, locale, isPrimary }: { blog: any; locale: string; isPrimary: boolean }) {
  const status = statusConfig[blog.status] || statusConfig.ended;
  const heroImage = blog.hero_image?.url;
  const category = blog.category?.[0] || blog.category;
  const author = blog.author?.[0] || blog.author;
  const updates = blog.liveupdates || [];
  const latestUpdate = updates[0]?.update;
  
  const rawDescription = typeof blog.description === 'object' 
    ? jsonRteToText(blog.description) 
    : blog.description;
  const description = stripHtmlTags(rawDescription);

  return (
    <Link href={`/${locale}/live-blogs/${blog.uid}`} className={`command-feed-card ${isPrimary ? 'primary' : 'secondary'}`}>
      {/* Background Image */}
      <div 
        className="feed-backdrop"
        style={{ backgroundImage: heroImage ? `url(${heroImage})` : 'none' }}
      >
        <div className="feed-backdrop-overlay"></div>
          </div>
        
      {/* Live Badge */}
      <div className="feed-status-badge" style={{ backgroundColor: status.color }}>
        <span className="status-pulse"></span>
          {status.label}
      </div>

      {/* Content */}
      <div className="feed-content">
        {/* Metrics Row */}
        <div className="feed-metrics">
          <span className="metric">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            {updates.length} updates
          </span>
        {category && (
            <span className="metric category">
            {category.title || category.name}
          </span>
        )}
        </div>

        <h3 
          className="feed-title"
          {...getEditTagProps(blog, 'title', 'live_blog', locale)}
        >
          {blog.title}
        </h3>

        {description && (
          <p 
            className="feed-description"
            {...getEditTagProps(blog, 'description', 'live_blog', locale)}
          >
            {description.length > 100 ? description.substring(0, 100) + '...' : description}
          </p>
        )}

        {/* Latest Update Preview */}
        {latestUpdate && (
          <div className="feed-latest-update">
            <span className="update-label">Latest:</span>
            <p>{latestUpdate.headline || jsonRteToText(latestUpdate.body)?.substring(0, 60)}</p>
          </div>
        )}

        {/* Footer */}
        <div className="feed-footer">
          {author && (
            <span className="feed-author">
              {author.profile_image?.url && (
                <img src={author.profile_image.url} alt="" />
              )}
              {author.name || author.title}
            </span>
          )}
          <span className="feed-action">
            Enter Stream →
          </span>
        </div>
      </div>
    </Link>
  );
}

// Mini Card for additional streams
function StreamMiniCard({ blog, locale }: { blog: any; locale: string }) {
  const updates = blog.liveupdates || [];
  
  return (
    <Link href={`/${locale}/live-blogs/${blog.uid}`} className="stream-mini-card">
      <span className="mini-live-dot"></span>
      <span 
        className="mini-title"
        {...getEditTagProps(blog, 'title', 'live_blog', locale)}
      >
        {blog.title}
      </span>
      <span className="mini-updates">{updates.length} updates</span>
    </Link>
  );
}
          
// List Item for coverage feed
function CoverageListItem({ blog, locale }: { blog: any; locale: string }) {
  const status = statusConfig[blog.status] || statusConfig.ended;
  const updates = blog.liveupdates || [];
  const heroImage = blog.hero_image?.url;
  
  return (
    <Link href={`/${locale}/live-blogs/${blog.uid}`} className="coverage-list-item">
      <div className="coverage-thumb">
        {heroImage ? (
          <img src={heroImage} alt={blog.title} />
        ) : (
          <div className="coverage-thumb-placeholder">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
          </div>
        )}
        <span className="coverage-status-dot" style={{ backgroundColor: status.color }}></span>
      </div>
      <div className="coverage-info">
        <h4 
          className="coverage-title"
          {...getEditTagProps(blog, 'title', 'live_blog', locale)}
        >
          {blog.title}
        </h4>
        <div className="coverage-meta">
          <span className="coverage-status" style={{ color: status.color }}>{status.label}</span>
          <span className="coverage-updates">{updates.length} updates</span>
          <span className="coverage-date">{formatDate(blog.published_date, locale)}</span>
        </div>
      </div>
      <div className="coverage-action">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </div>
    </Link>
  );
}

// Helper to format event time
function formatEventTime(timestamp: string) {
  if (!timestamp) return '--:--';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}
