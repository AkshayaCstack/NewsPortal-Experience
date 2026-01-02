import { getAllMagazines, formatDate } from "@/helper";
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
  title: "Magazine | NewzHub",
  description: "Curated, long-form content featuring special reports, investigative pieces, and downloadable issues",
};

export default async function MagazinePage({ params }: PageProps) {
  const { locale } = await params;
  
  const allMagazines = await getAllMagazines(locale);

  return (
    <main className="content-page">
      {/* Page Header with Search */}
      <section className="content-page-header">
        <div className="container">
          <div className="content-page-title-row">
            <div className="content-page-info">
              <span className="content-page-icon">📖</span>
              <div>
                <h1>Magazine</h1>
                <p>{allMagazines.length} issues available</p>
              </div>
            </div>
            <ContentSearch 
              locale={locale} 
              contentType="magazine"
              placeholder="Search magazines..."
            />
          </div>
        </div>
      </section>

      {/* All Magazines Grid */}
      <section className="content-grid-section">
        <div className="container">
          <div className="content-subsection">
            <h2 className="content-subsection-title">All Issues</h2>
            {allMagazines.length > 0 ? (
              <div className="magazines-grid">
                {allMagazines.map((magazine: any) => (
                  <MagazineCard key={magazine.uid} magazine={magazine} locale={locale} />
                ))}
              </div>
            ) : (
              <div className="content-empty">
                <span>📖</span>
                <h3>No magazines yet</h3>
                <p>Check back later for new issues.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function MagazineCard({ magazine, locale }: { magazine: any; locale: string }) {
  const author = magazine.author?.[0] || magazine.author;
  const category = magazine.category?.[0] || magazine.category;
  const isPremium = magazine.access_level === 'subscription';

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
