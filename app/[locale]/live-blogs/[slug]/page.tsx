import Link from 'next/link';
import { notFound } from 'next/navigation';
import { i18nConfig } from '@/i18n.config';
import { 
  getLiveBlogBySlug, 
  getAllLiveBlogSlugs, 
  formatDate, 
  formatLiveTime,
  formatDateTime,
  jsonRteToHtml,
  jsonRteToText 
} from '@/helper';
import ContentInteractions from '@/components/interactions/ContentInteractions';
import ContentTracker from '@/components/analytics/ContentTracker';
import { getEditTagProps } from '@/lib/editTags';

// Source icons and labels
const sourceConfig: Record<string, { label: string; icon: string; color: string }> = {
  reporter_on_ground: { label: 'Reporter on Ground', icon: '📍', color: '#10b981' },
  staff_writer: { label: 'Staff Writer', icon: '✍️', color: '#6366f1' },
  editorial: { label: 'Editorial Team', icon: '📰', color: '#8b5cf6' },
  press_release: { label: 'Press Release', icon: '📋', color: '#06b6d4' },
  press_conference: { label: 'Press Conference', icon: '🎤', color: '#ec4899' },
  reuters: { label: 'Reuters', icon: '🔵', color: '#f97316' },
  ap: { label: 'Associated Press', icon: '🔵', color: '#0ea5e9' },
  afp: { label: 'AFP', icon: '🔵', color: '#14b8a6' },
  pti: { label: 'PTI', icon: '🔵', color: '#a855f7' },
  ani: { label: 'ANI', icon: '🔵', color: '#f43f5e' },
  social_media: { label: 'Social Media', icon: '📱', color: '#3b82f6' },
  official_statement: { label: 'Official Statement', icon: '🏛️', color: '#64748b' },
  video_feed: { label: 'Video Feed', icon: '📹', color: '#ef4444' },
  government: { label: 'Government Source', icon: '🏛️', color: '#475569' },
  eyewitness: { label: 'Eyewitness Report', icon: '👁️', color: '#84cc16' },
  expert: { label: 'Expert Commentary', icon: '🎓', color: '#d946ef' },
  breaking: { label: 'Breaking Update', icon: '⚡', color: '#f59e0b' },
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  live: { label: 'LIVE', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  paused: { label: 'PAUSED', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  ended: { label: 'ENDED', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  upcoming: { label: 'UPCOMING', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
};

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  
  for (const locale of i18nConfig.locales) {
    const slugs = await getAllLiveBlogSlugs(locale);
    slugs.forEach((slug: string) => {
      params.push({ locale, slug });
    });
  }
  
  return params;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug, locale } = await params;
  const liveBlog = await getLiveBlogBySlug(slug, locale);
  
  if (!liveBlog) {
    return { title: 'Live Blog Not Found' };
  }

  const description = typeof liveBlog.description === 'object' 
    ? jsonRteToText(liveBlog.description) 
    : liveBlog.description;

  return {
    title: `${liveBlog.title} - Live Blog`,
    description: liveBlog.seo?.metadata_description || description || liveBlog.title,
    openGraph: {
      title: liveBlog.seo?.metadata_title || liveBlog.title,
      description: liveBlog.seo?.metadata_description || description,
      images: liveBlog.hero_image?.url ? [liveBlog.hero_image.url] : [],
    },
  };
}

export default async function LiveBlogPage({ params }: PageProps) {
  const { slug, locale } = await params;
  const liveBlog = await getLiveBlogBySlug(slug, locale);

  if (!liveBlog) {
    notFound();
  }

  const status = statusConfig[liveBlog.status] || statusConfig.ended;
  const heroImage = liveBlog.hero_image?.url;
  const category = liveBlog.category?.[0] || liveBlog.category;
  const author = liveBlog.author?.[0] || liveBlog.author;
  
  // Handle description - could be RTE JSON or plain text
  const descriptionHtml = typeof liveBlog.description === 'object' 
    ? jsonRteToHtml(liveBlog.description) 
    : liveBlog.description || '';

  // Get updates and sort by timestamp (newest first)
  const updates = liveBlog.liveupdates || [];
  const sortedUpdates = [...updates].sort((a: any, b: any) => {
    const dateA = new Date(a.update?.timestamp || 0).getTime();
    const dateB = new Date(b.update?.timestamp || 0).getTime();
    return dateB - dateA;
  });

  // Separate highlighted updates
  const highlightedUpdates = sortedUpdates.filter((u: any) => u.update?.is_highlight);

  return (
    <main className="liveblog-page">
      {/* Lytics Content Tracking */}
      <ContentTracker
        contentId={liveBlog.uid}
        contentType="live_blog"
        title={liveBlog.title}
        category={category?.title || category?.name}
        author={author?.name || author?.title}
        locale={locale}
        isFeatured={false}
        isPremium={false}
      />

      {/* Back Navigation */}
      <nav className="liveblog-nav">
        <div className="container">
          <Link href={`/${locale}/live-blogs`} className="liveblog-back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Live Blogs
          </Link>
        </div>
      </nav>

      {/* Hero Section - Full Width */}
      <header className="liveblog-hero">
        <div className="container">
          {/* Status & Category Row */}
          <div className="liveblog-badges">
            <span 
              className="liveblog-status-badge"
              style={{ backgroundColor: status.bg, color: status.color, borderColor: status.color }}
            >
              {liveBlog.status === 'live' && <span className="status-pulse"></span>}
              {status.label}
            </span>
            {category && (
              <Link href={`/${locale}/category/${category.uid}`} className="liveblog-category-badge">
                {category.title || category.name}
              </Link>
            )}
          </div>

          {/* Title - Full Width - With Edit Tag */}
          <h1 
            className="liveblog-title"
            {...getEditTagProps(liveBlog, 'title', 'live_blog', locale)}
          >
            {liveBlog.title}
          </h1>

          {/* Description - Full Width */}
          {descriptionHtml && (
            <div 
              className="liveblog-description"
              {...getEditTagProps(liveBlog, 'description', 'live_blog', locale)}
              dangerouslySetInnerHTML={{ __html: descriptionHtml }}
            />
          )}

          {/* Author & Meta */}
          <div className="liveblog-meta">
            {author && (
              <Link href={`/${locale}/author/${author.uid}`} className="liveblog-author">
                {author.profile_image?.url ? (
                  <img src={author.profile_image.url} alt={author.name || author.title} />
                ) : (
                  <span className="author-initial">{(author.name || author.title || 'A').charAt(0)}</span>
                )}
                <span className="author-name">{author.name || author.title}</span>
              </Link>
            )}
            {liveBlog.published_date && (
              <span className="liveblog-date">
                Started {formatDateTime(liveBlog.published_date)}
              </span>
            )}
            <span className="liveblog-updates-count">{sortedUpdates.length} updates</span>
          </div>

          {/* Hero Image - Below Content, Full Width */}
          {heroImage && (
            <div className="liveblog-hero-image">
              <img src={heroImage} alt={liveBlog.title} />
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <section className="liveblog-main">
        <div className="container">
          <div className="liveblog-layout">
            {/* Left Column: Updates */}
            <div className="liveblog-updates-column">
              {/* Key Highlights Card */}
              {highlightedUpdates.length > 0 && (
                <div className="highlights-card">
                  <div className="highlights-header">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <h3>Key Highlights</h3>
                  </div>
                  <ul className="highlights-list">
                    {highlightedUpdates.slice(0, 5).map((item: any, index: number) => (
                      <li key={index}>
                        <time>{formatLiveTime(item.update?.timestamp)}</time>
                        <p>{item.update?.headline || jsonRteToText(item.update?.body)?.substring(0, 120)}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Live Updates */}
              <div className="updates-section">
                <div className="updates-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12,6 12,12 16,14" />
                  </svg>
                  <h3>Live Updates</h3>
                </div>

                {sortedUpdates.length > 0 ? (
                  <div className="updates-list">
                    {sortedUpdates.map((item: any, index: number) => (
                      <UpdateCard 
                        key={index} 
                        update={item.update} 
                        isFirst={index === 0}
                        isLive={liveBlog.status === 'live'}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="no-updates-box">
                    <span className="no-updates-icon">⏳</span>
                    <h4>No Updates Yet</h4>
                    <p>Check back soon for live updates.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Sidebar */}
            <aside className="liveblog-sidebar">
              {/* Coverage Status */}
              <div className="sidebar-card status-card">
                <span className="sidebar-label">COVERAGE STATUS</span>
                <div className="status-display" style={{ color: status.color }}>
                  {liveBlog.status === 'live' && <span className="status-dot-animated"></span>}
                  {status.label}
                </div>
              </div>

              {/* Stats Row */}
              <div className="sidebar-stats-row">
                <div className="sidebar-stat">
                  <span className="stat-number">{sortedUpdates.length}</span>
                  <span className="stat-text">UPDATES</span>
                </div>
                <div className="sidebar-stat">
                  <span className="stat-number">{highlightedUpdates.length}</span>
                  <span className="stat-text">HIGHLIGHTS</span>
                </div>
              </div>

              {/* Lead Reporter */}
              {author && (
                <div className="sidebar-card reporter-card">
                  <span className="sidebar-label">LEAD REPORTER</span>
                  <Link href={`/${locale}/author/${author.uid}`} className="reporter-info">
                    {author.profile_image?.url ? (
                      <img src={author.profile_image.url} alt={author.name || author.title} />
                    ) : (
                      <span className="reporter-initial">{(author.name || author.title || 'A').charAt(0)}</span>
                    )}
                    <div className="reporter-details">
                      <strong>{author.name || author.title}</strong>
                      {author.bio && <p>{author.bio.length > 80 ? author.bio.substring(0, 80) + '...' : author.bio}</p>}
                    </div>
                  </Link>
                </div>
              )}

              {/* Share */}
              <div className="sidebar-card share-card">
                <span className="sidebar-label">SHARE THIS LIVE BLOG</span>
                <div className="share-icons">
                  <button className="share-icon" title="Share on X">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </button>
                  <button className="share-icon" title="Share on Facebook">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </button>
                  <button className="share-icon" title="Copy Link">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  </button>
                </div>
              </div>
            </aside>
          </div>

          {/* Content Interactions - Like, Save, Comments */}
          <ContentInteractions 
            contentType="live_blog"
            contentUid={liveBlog.uid}
            author={author ? { uid: author.uid, name: author.name || author.title } : null}
            category={category ? { uid: category.uid, name: category.name || category.title } : null}
          />
        </div>
      </section>
    </main>
  );
}

function UpdateCard({ update, isFirst, isLive }: { update: any; isFirst: boolean; isLive: boolean }) {
  if (!update) return null;

  const source = sourceConfig[update.source] || { label: update.source || 'Update', icon: '📝', color: '#6b7280' };
  const bodyHtml = update.body ? jsonRteToHtml(update.body) : '';
  const updateImage = update.image?.url;

  return (
    <article className={`update-item ${isFirst && isLive ? 'latest-update' : ''} ${update.is_highlight ? 'highlight-update' : ''}`}>
      {/* Timeline Dot */}
      <div className="update-timeline">
        <div className={`timeline-dot ${isFirst && isLive ? 'dot-live' : ''} ${update.is_highlight ? 'dot-highlight' : ''}`}>
          {isFirst && isLive && <span className="dot-pulse"></span>}
        </div>
        <div className="timeline-line"></div>
      </div>

      {/* Update Content */}
      <div className="update-content-box">
        {/* Time & Source */}
        <div className="update-top-row">
          <time className="update-timestamp">{formatLiveTime(update.timestamp)}</time>
          <span 
            className="update-source-tag"
            style={{ backgroundColor: `${source.color}15`, color: source.color }}
          >
            {source.icon} {source.label}
          </span>
        </div>

        {/* Headline */}
        {update.headline && (
          <h4 className="update-title">{update.headline}</h4>
        )}

        {/* Body */}
        {bodyHtml && (
          <div 
            className="update-body-content"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        )}

        {/* Image */}
        {updateImage && (
          <div className="update-media">
            <img src={updateImage} alt={update.headline || 'Update image'} />
          </div>
        )}
      </div>
    </article>
  );
}

