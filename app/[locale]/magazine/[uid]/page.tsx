import { getMagazineByUid, getAllMagazineUids, getAllMagazines, formatDate } from "@/helper";
import { notFound } from "next/navigation";
import Link from "next/link";
import { i18nConfig } from "@/i18n.config";

interface PageProps {
  params: Promise<{ uid: string; locale: string }>;
}

export async function generateStaticParams() {
  const params: { locale: string; uid: string }[] = [];
  
  for (const locale of i18nConfig.locales) {
    const uids = await getAllMagazineUids(locale);
    uids.forEach((uid: string) => {
      params.push({ locale, uid });
    });
  }
  
  return params;
}

export async function generateMetadata({ params }: PageProps) {
  const { uid, locale } = await params;
  const magazine = await getMagazineByUid(uid, locale);
  return {
    title: magazine ? `${magazine.title} | NewzHub Magazine` : "Magazine Not Found",
    description: magazine?.description || "",
  };
}

export default async function MagazineDetailPage({ params }: PageProps) {
  const { uid, locale } = await params;
  const [magazine, allMagazines] = await Promise.all([
    getMagazineByUid(uid, locale),
    getAllMagazines(locale)
  ]);

  if (!magazine) {
    notFound();
  }

  const author = magazine.author?.[0] || magazine.author;
  const category = magazine.category?.[0] || magazine.category;
  const isPremium = magazine.access_level === 'subscription';
  
  // Get related magazines (exclude current)
  const relatedMagazines = allMagazines
    .filter((m: any) => m.uid !== magazine.uid)
    .slice(0, 4);

  return (
    <main className="magazine-detail-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link href={`/${locale}`}>Home</Link>
          <span>/</span>
          <Link href={`/${locale}/magazine`}>Magazine</Link>
          <span>/</span>
          <span className="current">{magazine.title}</span>
        </nav>

        {/* Main Content */}
        <div className="magazine-detail-layout">
          {/* Left Column - Cover */}
          <div className="magazine-cover-section">
            <div className="magazine-cover-large">
              <img 
                src={magazine.cover_image?.url || 'https://via.placeholder.com/400x560?text=Magazine'} 
                alt={magazine.title}
              />
              <span className={`access-badge large ${magazine.access_level}`}>
                {isPremium ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                    </svg>
                    Premium
                  </>
                ) : 'Free Access'}
              </span>
            </div>

            {/* Download/Read Actions */}
            <div className="magazine-main-actions">
              {!isPremium && magazine.magazine_pdf?.url ? (
                <>
                  <a 
                    href={magazine.magazine_pdf.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="action-btn primary full"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                    Read PDF
                  </a>
                  <a 
                    href={magazine.magazine_pdf.url} 
                    download
                    className="action-btn full"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download
                  </a>
                </>
              ) : isPremium ? (
                <button className="action-btn subscribe full">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Subscribe to Unlock
                </button>
              ) : null}
            </div>
          </div>

          {/* Right Column - Info */}
          <div className="magazine-info-section">
            {category && (
              <span className="magazine-category-badge">{category.title || category.name}</span>
            )}
            
            <h1 className="magazine-detail-title">{magazine.title}</h1>
            
            <div className="magazine-detail-meta">
              <span className="meta-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {formatDate(magazine.date, locale)}
              </span>
              <span className={`meta-badge ${magazine.access_level}`}>
                {isPremium ? '👑 Premium' : '📖 Free'}
              </span>
            </div>

            {/* Author */}
            {author && (
              <Link href={`/${locale}/author/${author.uid}`} className="magazine-author-card">
                <div className="author-avatar">
                  {author.profile_image?.url ? (
                    <img src={author.profile_image.url} alt={author.name || author.title} />
                  ) : (
                    <div className="avatar-placeholder">
                      {(author.name || author.title || 'A').charAt(0)}
                    </div>
                  )}
                </div>
                <div className="author-info">
                  <span className="author-label">Written by</span>
                  <span className="author-name">{author.name || author.title}</span>
                </div>
              </Link>
            )}

            {/* Description */}
            {magazine.description && (
              <div className="magazine-detail-description">
                <h3>About this issue</h3>
                <p>{magazine.description}</p>
              </div>
            )}

            {/* Preview Text (for premium content) */}
            {isPremium && magazine.preview_text && (
              <div className="magazine-preview">
                <h3>Preview</h3>
                <div 
                  className="preview-content"
                  dangerouslySetInnerHTML={{ __html: magazine.preview_text }}
                />
                <div className="preview-fade">
                  <p>Subscribe to continue reading...</p>
                </div>
              </div>
            )}

            {/* Tags/Taxonomies */}
            {magazine.taxonomies && magazine.taxonomies.length > 0 && (
              <div className="magazine-tags">
                {magazine.taxonomies.map((tax: any, index: number) => (
                  <span key={index} className="magazine-tag">
                    #{tax.term_uid}
                  </span>
                ))}
              </div>
            )}

            {/* Share */}
            <div className="magazine-share">
              <span>Share:</span>
              <div className="share-buttons">
                <button className="share-btn" title="Copy link">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                </button>
                <button className="share-btn" title="Share on Twitter">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </button>
                <button className="share-btn" title="Share on LinkedIn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Magazines */}
        {relatedMagazines.length > 0 && (
          <section className="related-magazines">
            <h2 className="section-title">More Issues</h2>
            <div className="related-magazines-grid">
              {relatedMagazines.map((m: any) => (
                <Link key={m.uid} href={`/${locale}/magazine/${m.uid}`} className="related-magazine-card">
                  <div className="related-magazine-cover">
                    <img 
                      src={m.cover_image?.url || 'https://via.placeholder.com/120x170?text=Magazine'} 
                      alt={m.title}
                    />
                    <span className={`access-badge mini ${m.access_level}`}>
                      {m.access_level === 'subscription' ? '👑' : 'Free'}
                    </span>
                  </div>
                  <div className="related-magazine-info">
                    <h4>{m.title}</h4>
                    <span className="related-date">{formatDate(m.date, locale)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

