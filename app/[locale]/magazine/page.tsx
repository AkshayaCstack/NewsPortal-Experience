import { getAllMagazines, formatDate, jsonRteToText, getRandomEditorialQuote } from "@/helper";
import Link from "next/link";
import { i18nConfig } from "@/i18n.config";
import ContentSearch from "@/components/search/ContentSearch";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return i18nConfig.locales.map((locale) => ({ locale }));
}

export const metadata = {
  title: "Magazine | The Editorial Flipbook",
  description: "Curated, long-form content featuring special reports, investigative pieces, and downloadable issues",
};

// Fallback quotes (used only if CMS quotes are not available)
const fallbackQuotes = [
  {
    quote: "In an age of information overload, curation is the new currency.",
    author: "Editorial Team",
    role: "Chief Editor"
  },
  {
    quote: "Every story we publish is a commitment to truth and depth.",
    author: "NewzHub Editorial",
    role: "Mission Statement"
  },
  {
    quote: "Long-form journalism is not dead—it's evolving.",
    author: "Features Desk",
    role: "Editorial Philosophy"
  }
];

export default async function MagazinePage({ params }: PageProps) {
  const { locale } = await params;
  
  const [allMagazines, cmsQuote] = await Promise.all([
    getAllMagazines(locale),
    getRandomEditorialQuote(locale)
  ]);
  
  // Current/Latest issue for double-spread hero
  const currentIssue = allMagazines[0];
  
  // Archive issues (all except current)
  const archiveIssues = allMagazines.slice(1);
  
  // Quote for callout - prefer CMS, fallback to hardcoded
  const quoteOfMonth = cmsQuote ? {
    quote: cmsQuote.quote_text || cmsQuote.quote,
    author: cmsQuote.author_name || cmsQuote.author?.title || cmsQuote.author,
    role: cmsQuote.author_role || cmsQuote.role
  } : fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];

  return (
    <main className="editorial-page">
      {/* Editorial Header */}
      <section className="editorial-header">
        <div className="editorial-paper-texture"></div>
        <div className="container">
          <div className="editorial-header-content">
            <div className="editorial-brand">
              <div className="editorial-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  <line x1="8" y1="6" x2="16" y2="6"/>
                  <line x1="8" y1="10" x2="16" y2="10"/>
                  <line x1="8" y1="14" x2="12" y2="14"/>
                </svg>
              </div>
              <div>
                <h1>The Editorial</h1>
                <p className="editorial-tagline">Curated Long-Form Journalism</p>
              </div>
            </div>
            <ContentSearch 
              locale={locale} 
              contentType="magazine"
              placeholder="Search issues..."
            />
          </div>
        </div>
      </section>

      {/* Double-Spread Hero - Current Issue */}
      {currentIssue && (
        <section className="flipbook-hero">
          <div className="container">
            <div className="flipbook-spread">
              {/* Left Page - Table of Contents */}
              <div className="spread-page left-page">
                <div className="page-content">
                  <div className="toc-header">
                    <span className="issue-label">Current Issue</span>
                    <h2 className="issue-date">{formatDate(currentIssue.date, locale)}</h2>
                  </div>
                  
                  <div className="toc-divider"></div>
                  
                  <div className="table-of-contents">
                    <h3 className="toc-title">In This Issue</h3>
                    <ul className="toc-list">
                      <li className="toc-item">
                        <span className="toc-number">01</span>
                        <span className="toc-text">{currentIssue.title}</span>
                      </li>
                      {currentIssue.sections?.slice(0, 4).map((section: any, idx: number) => (
                        <li key={idx} className="toc-item">
                          <span className="toc-number">{String(idx + 2).padStart(2, '0')}</span>
                          <span className="toc-text">{section.title || 'Feature Article'}</span>
                        </li>
                      )) || (
                        <>
                          <li className="toc-item">
                            <span className="toc-number">02</span>
                            <span className="toc-text">Feature Story</span>
                          </li>
                          <li className="toc-item">
                            <span className="toc-number">03</span>
                            <span className="toc-text">In-Depth Analysis</span>
                          </li>
                          <li className="toc-item">
                            <span className="toc-number">04</span>
                            <span className="toc-text">Expert Commentary</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                  
                  <div className="toc-footer">
                    <span className="page-fold"></span>
                  </div>
                </div>
              </div>

              {/* Center Spine */}
              <div className="spread-spine">
                <div className="spine-shadow"></div>
              </div>

              {/* Right Page - Editor's Note & Cover */}
              <div className="spread-page right-page">
                <div className="page-content">
                  <div className="cover-preview">
                    <img 
                      src={currentIssue.cover_image?.url || 'https://via.placeholder.com/300x400?text=Magazine'} 
                      alt={currentIssue.title}
                    />
                    {currentIssue.access_level === 'subscription' && (
                      <span className="premium-ribbon">Premium</span>
                    )}
                  </div>
                  
                  <div className="editors-note">
                    <h3 className="note-title">Editor's Note</h3>
                    <p className="note-text">
                      {currentIssue.description 
                        ? (currentIssue.description.length > 150 
                            ? currentIssue.description.substring(0, 150) + '...' 
                            : currentIssue.description)
                        : "Welcome to this month's edition. We've curated the finest stories for your reading pleasure."}
                    </p>
                    {currentIssue.author?.[0] && (
                      <span className="note-author">
                        — {currentIssue.author[0].name || currentIssue.author[0].title}
                      </span>
                    )}
                  </div>
                  
                  <Link 
                    href={`/${locale}/magazine/${currentIssue.uid}`}
                    className="btn-read-issue"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    </svg>
                    Read This Issue
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Quote Callout */}
      <section className="quote-callout">
        <div className="container">
          <blockquote className="editorial-quote">
            <div className="quote-mark">"</div>
            <p className="quote-text">{quoteOfMonth.quote}</p>
            <footer className="quote-footer">
              <cite className="quote-author">{quoteOfMonth.author}</cite>
              <span className="quote-role">{quoteOfMonth.role}</span>
            </footer>
          </blockquote>
        </div>
      </section>

      {/* Library Shelf - Archive */}
      {archiveIssues.length > 0 && (
        <section className="library-section">
          <div className="container">
            <div className="section-header-editorial">
              <h2>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                The Archive
              </h2>
              <span className="archive-count">{archiveIssues.length} past issues</span>
            </div>

            {/* Bookshelf Design */}
            <div className="bookshelf">
              <div className="shelf-row">
                {archiveIssues.map((magazine: any) => (
                  <BookSpine 
                    key={magazine.uid} 
                    magazine={magazine} 
                    locale={locale}
                  />
                ))}
              </div>
              <div className="shelf-wood"></div>
            </div>
          </div>
        </section>
      )}

      {/* All Issues Grid Fallback */}
      <section className="all-issues-section">
        <div className="container">
          <div className="section-header-editorial">
            <h2>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
              All Issues
            </h2>
          </div>

          {allMagazines.length > 0 ? (
            <div className="issues-grid">
              {allMagazines.map((magazine: any) => (
                <IssueCard key={magazine.uid} magazine={magazine} locale={locale} />
              ))}
            </div>
          ) : (
            <div className="editorial-empty">
              <div className="empty-book">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
              </div>
              <h3>No Issues Yet</h3>
              <p>Check back soon for our latest publications.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

// Book Spine Component - Shows as spine, expands on hover to show cover
function BookSpine({ magazine, locale }: { magazine: any; locale: string }) {
  const isPremium = magazine.access_level === 'subscription';
  const category = magazine.category?.[0] || magazine.category;
  
  // Generate a color based on title for variety
  const colors = ['#1a365d', '#2d3748', '#742a2a', '#234e52', '#44337a', '#744210', '#285e61', '#4a5568'];
  const colorIndex = magazine.title?.charCodeAt(0) % colors.length || 0;
  const spineColor = colors[colorIndex];

  return (
    <Link 
      href={`/${locale}/magazine/${magazine.uid}`}
      className={`book-spine ${isPremium ? 'premium' : ''}`}
      style={{ '--spine-color': spineColor } as React.CSSProperties}
    >
      {/* Spine View (Default) */}
      <div className="spine-face">
        <span className="spine-title">{magazine.title}</span>
        <span className="spine-date">{formatDate(magazine.date, locale)}</span>
        {isPremium && <span className="spine-premium-dot">●</span>}
      </div>
      
      {/* Expanded Cover (On Hover) */}
      <div className="spine-expanded">
        <div className="expanded-cover">
          <img 
            src={magazine.cover_image?.url || 'https://via.placeholder.com/150x200?text=Magazine'} 
            alt={magazine.title}
          />
          {isPremium && (
            <span className="expanded-premium-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2Z"/>
              </svg>
              Premium
            </span>
          )}
        </div>
        <div className="expanded-info">
          <h4 className="expanded-title">{magazine.title}</h4>
          {category && (
            <span className="expanded-category">{category.title || category.name}</span>
          )}
          <span className="expanded-date">{formatDate(magazine.date, locale)}</span>
        </div>
      </div>
    </Link>
  );
}

// Issue Card for Grid View
function IssueCard({ magazine, locale }: { magazine: any; locale: string }) {
  const author = magazine.author?.[0] || magazine.author;
  const category = magazine.category?.[0] || magazine.category;
  const isPremium = magazine.access_level === 'subscription';

  return (
    <Link 
      href={`/${locale}/magazine/${magazine.uid}`} 
      className={`issue-card ${isPremium ? 'premium' : ''}`}
    >
      <div className="issue-cover">
        <img 
          src={magazine.cover_image?.url || 'https://via.placeholder.com/200x280?text=Magazine'} 
          alt={magazine.title}
        />
        <div className="issue-overlay">
          <span className="read-label">Read Issue</span>
        </div>
        <span className={`access-badge ${magazine.access_level}`}>
          {isPremium ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2Z"/>
              </svg>
              Premium
            </>
          ) : 'Free'}
        </span>
      </div>
      <div className="issue-info">
        {category && (
          <span className="issue-category">{category.title || category.name}</span>
        )}
        <h4 className="issue-title">{magazine.title}</h4>
        <div className="issue-meta">
          {author && (
            <span className="issue-author">{author.name || author.title}</span>
          )}
          <span className="issue-date">{formatDate(magazine.date, locale)}</span>
        </div>
      </div>
    </Link>
  );
}
