import { getPageByURL, getAllMagazines, formatDate } from "@/helper";
import Link from "next/link";
import { i18nConfig } from "@/i18n.config";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return i18nConfig.locales.map((locale) => ({ locale }));
}

export const metadata = {
  title: "Magazine | NewzHub",
  description: "Curated, long-form content featuring special reports, investigative pieces, and downloadable issues",
};

export default async function MagazinePage({ params }: PageProps) {
  const { locale } = await params;
  
  const [pageData, allMagazines] = await Promise.all([
    getPageByURL("/magazine-page", locale),
    getAllMagazines(locale)
  ]);

  const heroSection = pageData?.components?.find((c: any) => c.hero_section)?.hero_section;
  
  const freeMagazines = allMagazines.filter((m: any) => m.access_level === 'free');
  const premiumMagazines = allMagazines.filter((m: any) => m.access_level === 'subscription');

  return (
    <main className="magazine-page">
      {/* Hero Section */}
      <section className="magazine-hero">
        <div className="container">
          <div className="magazine-hero-content">
            <div className="magazine-hero-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                <line x1="8" y1="6" x2="16" y2="6"/>
                <line x1="8" y1="10" x2="14" y2="10"/>
              </svg>
            </div>
            <h1>{heroSection?.title || "Magazines"}</h1>
            {heroSection?.text_area && (
              <p className="magazine-hero-desc">{heroSection.text_area}</p>
            )}
          </div>
          
          {/* Access Type Filters */}
          <div className="magazine-filters">
            <span className="filter-label">Browse:</span>
            <a href="#all" className="filter-btn active">All Issues</a>
            <a href="#free" className="filter-btn">Free</a>
            <a href="#premium" className="filter-btn">Premium</a>
          </div>
        </div>
      </section>

      {/* Latest Issue Feature */}
      {allMagazines.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Latest Issue</h2>
            </div>
            <div className="latest-magazine-card">
              <div className="latest-magazine-cover">
                <img 
                  src={allMagazines[0].cover_image?.url || 'https://via.placeholder.com/300x400?text=Magazine'} 
                  alt={allMagazines[0].title}
                />
                <span className={`access-badge ${allMagazines[0].access_level}`}>
                  {allMagazines[0].access_level === 'subscription' ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                      </svg>
                      Premium
                    </>
                  ) : 'Free'}
                </span>
              </div>
              <div className="latest-magazine-info">
                {allMagazines[0].category?.[0] && (
                  <span className="magazine-category">
                    {allMagazines[0].category[0].title || allMagazines[0].category[0].name}
                  </span>
                )}
                <h3>{allMagazines[0].title}</h3>
                {allMagazines[0].description && (
                  <p className="magazine-description">{allMagazines[0].description}</p>
                )}
                
                {/* Author */}
                {allMagazines[0].author?.[0] && (
                  <div className="magazine-author">
                    {allMagazines[0].author[0].profile_image?.url && (
                      <img src={allMagazines[0].author[0].profile_image.url} alt="" />
                    )}
                    <span>By {allMagazines[0].author[0].name || allMagazines[0].author[0].title}</span>
                  </div>
                )}
                
                <div className="magazine-actions">
                  <Link href={`/${locale}/magazine/${allMagazines[0].uid}`} className="read-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </svg>
                    {allMagazines[0].access_level === 'subscription' ? 'Preview' : 'Read Now'}
                  </Link>
                  {allMagazines[0].access_level === 'free' && allMagazines[0].magazine_pdf?.url && (
                    <a 
                      href={allMagazines[0].magazine_pdf.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="download-btn"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Download PDF
                    </a>
                  )}
                </div>
                
                <span className="magazine-date">{formatDate(allMagazines[0].date, locale)}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Free Magazines */}
      {freeMagazines.length > 0 && (
        <section className="section" id="free">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">
                <span className="free-icon">📖</span>
                Free Issues
              </h2>
              <span className="issue-count">{freeMagazines.length} issues</span>
            </div>
            <div className="magazines-grid">
              {freeMagazines.map((magazine: any) => (
                <MagazineCard key={magazine.uid} magazine={magazine} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Premium Magazines */}
      {premiumMagazines.length > 0 && (
        <section className="section premium-section" id="premium">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">
                <span className="premium-icon">👑</span>
                Premium Collection
              </h2>
              <span className="issue-count">{premiumMagazines.length} issues</span>
            </div>
            <p className="premium-notice">
              Subscribe to unlock full access to our premium magazine collection
            </p>
            <div className="magazines-grid">
              {premiumMagazines.map((magazine: any) => (
                <MagazineCard key={magazine.uid} magazine={magazine} locale={locale} isPremium />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function MagazineCard({ magazine, locale, isPremium = false }: { magazine: any; locale: string; isPremium?: boolean }) {
  const author = magazine.author?.[0] || magazine.author;
  const category = magazine.category?.[0] || magazine.category;

  return (
    <Link href={`/${locale}/magazine/${magazine.uid}`} className={`magazine-card ${isPremium ? 'premium' : ''}`}>
      <div className="magazine-card-cover">
        <img 
          src={magazine.cover_image?.url || 'https://via.placeholder.com/200x280?text=Magazine'} 
          alt={magazine.title}
        />
        <span className={`access-badge small ${magazine.access_level}`}>
          {magazine.access_level === 'subscription' ? '👑' : 'Free'}
        </span>
        {isPremium && (
          <div className="premium-overlay">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
        )}
      </div>
      <div className="magazine-card-content">
        {category && (
          <span className="magazine-card-category">{category.title || category.name}</span>
        )}
        <h4 className="magazine-card-title">{magazine.title}</h4>
        {magazine.description && (
          <p className="magazine-card-desc">{magazine.description}</p>
        )}
        <div className="magazine-card-footer">
          {author && (
            <span className="magazine-card-author">{author.name || author.title}</span>
          )}
          <span className="magazine-card-date">{formatDate(magazine.date, locale)}</span>
        </div>
      </div>
    </Link>
  );
}
