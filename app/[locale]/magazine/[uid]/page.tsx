import { getMagazineByUid, getAllMagazineUids, getAllMagazines, formatDate } from "@/helper";
import { notFound } from "next/navigation";
import Link from "next/link";
import { i18nConfig } from "@/i18n.config";
import ContentInteractions from "@/components/interactions/ContentInteractions";
import ContentTracker from "@/components/analytics/ContentTracker";
import { getEditTagProps } from "@/lib/editTags";

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
      {/* Lytics Content Tracking */}
      <ContentTracker
        contentId={magazine.uid}
        contentType="magazine"
        title={magazine.title}
        category={category?.title || category?.name}
        author={author?.name || author?.title}
        locale={locale}
        isFeatured={false}
        isPremium={isPremium}
      />

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
          {/* Left Column - Cover - With Edit Tag */}
          <div className="magazine-cover-section">
            <div 
              className="magazine-cover-large"
              {...getEditTagProps(magazine, 'cover_image', 'magazine', locale)}
            >
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
            
            <h1 
              className="magazine-detail-title"
              {...getEditTagProps(magazine, 'title', 'magazine', locale)}
            >
              {magazine.title}
            </h1>
            
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

            {/* Description - With Edit Tag */}
            {magazine.description && (
              <div className="magazine-detail-description">
                <h3>About this issue</h3>
                <p {...getEditTagProps(magazine, 'description', 'magazine', locale)}>
                  {magazine.description}
                </p>
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

          </div>
        </div>

        {/* Interactions - Likes, Comments, Follow, Report */}
        <ContentInteractions 
          contentType="magazine"
          contentUid={magazine.uid}
          author={author ? { uid: author.uid, name: author.name || author.title } : null}
          category={category ? { uid: category.uid, name: category.name || category.title } : null}
        />

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
                      {...getEditTagProps(m, 'cover_image', 'magazine', locale)}
                    />
                    <span className={`access-badge mini ${m.access_level}`}>
                      {m.access_level === 'subscription' ? '👑' : 'Free'}
                    </span>
                  </div>
                  <div className="related-magazine-info">
                    <h4 {...getEditTagProps(m, 'title', 'magazine', locale)}>{m.title}</h4>
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

