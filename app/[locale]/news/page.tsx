import Link from "next/link";
import { getAllArticles, getAllCategories, getFeaturedArticles, timeAgo, formatDate } from "@/helper";
import { Metadata } from "next";
import { i18nConfig } from "@/i18n.config";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Discover - NewzHub",
  description: "News from all around the world",
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return i18nConfig.locales.map((locale) => ({ locale }));
}

export default async function DiscoverPage({ params }: PageProps) {
  const { locale } = await params;
  
  const [articles, categories, trendingArticles] = await Promise.all([
    getAllArticles(locale),
    getAllCategories(locale),
    getFeaturedArticles(locale)
  ]);

  const getHeroImage = (article: any) => {
    if (!article?.group) return null;
    const heroGroup = article.group.find((g: any) => g.is_hero_image);
    return heroGroup?.image?.url || article.group[0]?.image?.url;
  };

  // Get latest articles excluding trending
  const trendingUids = trendingArticles?.map((a: any) => a.uid) || [];
  const latestArticles = articles?.filter((a: any) => !trendingUids.includes(a.uid)) || [];

  return (
    <main className="discover-page">
      {/* Header */}
      <section className="discover-header">
        <div className="container">
          <Link href={`/${locale}`} className="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </Link>
          <div className="discover-title-block">
            <h1>Discover</h1>
            <p>News from all around the world</p>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="search-section">
        <div className="container">
          <div className="search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="text" placeholder="Search" className="search-input" />
          </div>
        </div>
      </section>

      {/* Category Pills */}
      {categories && categories.length > 0 && (
        <section className="category-pills-section">
          <div className="container">
            <div className="category-pills-row">
              <Link href={`/${locale}/news`} className="category-pill-new active">All</Link>
              {categories.map((cat: any) => (
                <Link 
                  key={cat.uid} 
                  href={`/${locale}/category/${cat.uid}`}
                  className="category-pill-new"
                >
                  {cat.title || cat.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* News List */}
      <section className="news-list-section">
        <div className="container">
          {/* Trending First */}
          {trendingArticles && trendingArticles.length > 0 && (
            <>
              {trendingArticles.slice(0, 4).map((article: any) => {
                const author = article.author?.[0];
                const category = article.category?.[0];
                
                return (
                  <Link key={article.uid} href={`/${locale}/news/${article.uid}`} className="news-list-item">
                    <div className="news-list-img">
                      <img src={getHeroImage(article) || 'https://via.placeholder.com/140x100'} alt={article.title} />
                    </div>
                    <div className="news-list-content">
                      {category && <span className="news-list-category">{category.title}</span>}
                      <h3 className="news-list-title">{article.title}</h3>
                      <div className="news-list-meta">
                        {author?.profile_image?.url && (
                          <img src={author.profile_image.url} alt="" className="news-list-avatar" />
                        )}
                        <span className="news-list-author">{author?.name || 'Staff'}</span>
                        <span className="news-list-dot">•</span>
                        <span className="news-list-date">{formatDate(article.published_date, locale)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </>
          )}

          {/* Latest Articles */}
          {latestArticles && latestArticles.length > 0 && (
            <>
              {latestArticles.map((article: any) => {
                const author = article.author?.[0];
                const category = article.category?.[0];
                
                return (
                  <Link key={article.uid} href={`/${locale}/news/${article.uid}`} className="news-list-item">
                    <div className="news-list-img">
                      <img src={getHeroImage(article) || 'https://via.placeholder.com/140x100'} alt={article.title} />
                    </div>
                    <div className="news-list-content">
                      {category && <span className="news-list-category">{category.title}</span>}
                      <h3 className="news-list-title">{article.title}</h3>
                      <div className="news-list-meta">
                        {author?.profile_image?.url && (
                          <img src={author.profile_image.url} alt="" className="news-list-avatar" />
                        )}
                        <span className="news-list-author">{author?.name || 'Staff'}</span>
                        <span className="news-list-dot">•</span>
                        <span className="news-list-date">{formatDate(article.published_date, locale)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </>
          )}

          {(!articles || articles.length === 0) && (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
                <path d="M7 7h10M7 12h10M7 17h6"/>
              </svg>
              <h3>No Articles Found</h3>
              <p>Check back later for new stories.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
