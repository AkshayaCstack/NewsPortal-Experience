import Link from 'next/link';
import { getAllLiveBlogs, formatDate, jsonRteToText } from '@/helper';
import { i18nConfig } from "@/i18n.config";
import ContentSearch from "@/components/search/ContentSearch";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return i18nConfig.locales.map((locale) => ({ locale }));
}

// Status badge colors and labels
const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  live: { label: 'LIVE NOW', color: '#ef4444', icon: '🔴' },
  paused: { label: 'PAUSED', color: '#f59e0b', icon: '⏸️' },
  ended: { label: 'ENDED', color: '#6b7280', icon: '✅' },
  upcoming: { label: 'UPCOMING', color: '#3b82f6', icon: '📅' },
};

export const metadata = {
  title: 'Live Blogs - NewzHub',
  description: 'Follow our live coverage of breaking news and events',
};

export default async function LiveBlogsPage({ params }: PageProps) {
  const { locale } = await params;
  const liveBlogs = await getAllLiveBlogs(locale);

  // Separate live blogs by status
  const activeLiveBlogs = liveBlogs.filter((blog: any) => blog.status === 'live');
  const otherBlogs = liveBlogs.filter((blog: any) => blog.status !== 'live');

  return (
    <main className="content-page">
      {/* Page Header with Search */}
      <section className="content-page-header">
        <div className="container">
          <div className="content-page-title-row">
            <div className="content-page-info">
              <span className="content-page-icon live-icon">
                <span className="pulse-dot-small"></span>
                🔴
              </span>
              <div>
                <h1>Live Blogs</h1>
                <p>{liveBlogs.length} live coverage{liveBlogs.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <ContentSearch 
              locale={locale} 
              contentType="live_blog"
              placeholder="Search live blogs..."
            />
          </div>
        </div>
      </section>

      {/* Content Grid */}
      <section className="content-grid-section">
        <div className="container">
          {/* Active Live Blogs */}
          {activeLiveBlogs.length > 0 && (
            <div className="content-subsection">
              <h2 className="content-subsection-title live-title">
                <span className="live-indicator-dot"></span>
                Happening Now
              </h2>
              <div className="live-blogs-grid">
                {activeLiveBlogs.map((blog: any) => (
                  <LiveBlogCard key={blog.uid} blog={blog} locale={locale} featured />
                ))}
              </div>
            </div>
          )}

          {/* Other Live Blogs */}
          <div className="content-subsection">
            <h2 className="content-subsection-title">All Coverage</h2>
            {liveBlogs.length > 0 ? (
              <div className="live-blogs-grid">
                {(otherBlogs.length > 0 ? otherBlogs : liveBlogs).map((blog: any) => (
                  <LiveBlogCard key={blog.uid} blog={blog} locale={locale} />
                ))}
              </div>
            ) : (
              <div className="content-empty">
                <span>📡</span>
                <h3>No live blogs yet</h3>
                <p>Check back soon for live coverage.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function LiveBlogCard({ blog, locale, featured = false }: { blog: any; locale: string; featured?: boolean }) {
  const status = statusConfig[blog.status] || statusConfig.ended;
  const heroImage = blog.hero_image?.url;
  const category = blog.category?.[0] || blog.category;
  const author = blog.author?.[0] || blog.author;
  const updateCount = blog.liveupdates?.length || 0;
  const description = typeof blog.description === 'object' 
    ? jsonRteToText(blog.description) 
    : blog.description;

  return (
    <Link 
      href={`/${locale}/live-blogs/${blog.uid}`} 
      className={`live-blog-card ${featured ? 'live-blog-card-featured' : ''} ${blog.status === 'live' ? 'is-live' : ''}`}
    >
      {/* Hero Image */}
      <div className="live-card-image">
        {heroImage ? (
          <img src={heroImage} alt={blog.title} />
        ) : (
          <div className="live-card-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Status Badge */}
        <div 
          className="live-status-badge"
          style={{ backgroundColor: status.color }}
        >
          {blog.status === 'live' && <span className="live-pulse"></span>}
          {status.label}
        </div>
      </div>

      {/* Card Content */}
      <div className="live-card-content">
        {/* Category */}
        {category && (
          <span className="live-card-category">
            {category.title || category.name}
          </span>
        )}

        {/* Title */}
        <h3 className="live-card-title">{blog.title}</h3>

        {/* Description */}
        {description && (
          <p className="live-card-desc">
            {description.length > 120 ? description.substring(0, 120) + '...' : description}
          </p>
        )}

        {/* Meta Info */}
        <div className="live-card-meta">
          {author && (
            <div className="live-card-author">
              {author.profile_image?.url ? (
                <img src={author.profile_image.url} alt={author.name || author.title} />
              ) : (
                <div className="live-author-placeholder">
                  {(author.name || author.title || 'A').charAt(0)}
                </div>
              )}
              <span>{author.name || author.title}</span>
            </div>
          )}
          
          <div className="live-card-stats">
            {updateCount > 0 && (
              <span className="update-count">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {updateCount} updates
              </span>
            )}
            
            {blog.published_date && (
              <span className="live-card-date">
                {formatDate(blog.published_date, locale)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Live Glow Effect */}
      {blog.status === 'live' && <div className="live-glow"></div>}
    </Link>
  );
}
