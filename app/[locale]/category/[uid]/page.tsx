import { getCategoryByUid, getArticlesByCategory, getAllCategories, timeAgo, jsonRteToText } from "@/helper";
import { notFound } from "next/navigation";
import Link from "next/link";
import { i18nConfig } from "@/i18n.config";
import { getEditTagProps } from "@/lib/editTags";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ uid: string; locale: string }>;
}

// Generate static params for all categories in all locales
export async function generateStaticParams() {
  const params: { locale: string; uid: string }[] = [];
  
  for (const locale of i18nConfig.locales) {
    const categories = await getAllCategories(locale);
    categories.forEach((category: any) => {
      params.push({ locale, uid: category.uid });
    });
  }
  
  return params;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  const { uid, locale } = await params;
  const category = await getCategoryByUid(uid, locale);
  
  if (!category) {
    return { title: 'Category Not Found' };
  }

  return {
    title: `${category.name || category.title} - News`,
    description: `Latest news and articles in ${category.name || category.title}`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { uid, locale } = await params;
  
  const [category, articles] = await Promise.all([
    getCategoryByUid(uid, locale),
    getArticlesByCategory(uid, locale)
  ]);

  if (!category) {
    notFound();
  }

  const categoryName = category.name || category.title;

  const getHeroImage = (article: any) => {
    if (!article?.group) return null;
    const heroGroup = article.group.find((g: any) => g.is_hero_image);
    return heroGroup?.image?.url || article.group[0]?.image?.url;
  };

  const getSummary = (article: any, maxLength = 100) => {
    let text = '';
    if (article.description) {
      text = typeof article.description === 'string' ? article.description : jsonRteToText(article.description);
    } else if (article.body) {
      text = typeof article.body === 'string' ? article.body : jsonRteToText(article.body);
    }
    text = text.replace(/<[^>]*>/g, '').trim();
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <main className="category-page">
      {/* Category Header */}
      <section className="category-page-header">
        <div className="container">
          <Link href={`/${locale}/news`} className="breadcrumb-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            All News
          </Link>
          
          <div className="category-page-info">
            <h1 
              className="category-page-title"
              {...getEditTagProps(category, 'title', 'category', locale)}
            >
              {categoryName}
            </h1>
            <p className="category-page-count">{articles.length} article{articles.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="category-articles-section">
        <div className="container">
          {articles && articles.length > 0 ? (
            <div className="news-card-grid">
              {articles.map((article: any) => {
                const author = article.author?.[0];
                const isFeatured = article.is_featured;
                
                return (
                  <Link key={article.uid} href={`/${locale}/news/${article.uid}`} className="news-card">
                    <div className="news-card-image">
                      <img src={getHeroImage(article) || 'https://via.placeholder.com/400x250'} alt={article.title} />
                      {isFeatured && <span className="news-card-badge">Featured</span>}
                    </div>
                    <div className="news-card-body">
                      <span className="news-card-category">{categoryName}</span>
                      <h3 
                        className="news-card-title"
                        {...getEditTagProps(article, 'title', 'news_article', locale)}
                      >
                        {article.title}
                      </h3>
                      <p 
                        className="news-card-summary"
                        {...getEditTagProps(article, 'description', 'news_article', locale)}
                      >
                        {getSummary(article)}
                      </p>
                      <div className="news-card-footer">
                        <span className="news-card-author">{author?.name || 'Staff'}</span>
                        <span className="news-card-time">{timeAgo(article.published_date, locale)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="empty-state-centered">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <h3>No articles yet</h3>
              <p>Check back later for new stories in {categoryName}.</p>
              <Link href={`/${locale}/news`} className="back-to-news-btn">
                Browse all news
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

