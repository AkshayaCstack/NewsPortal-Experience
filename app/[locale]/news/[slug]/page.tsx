import { getArticleBySlug, getAllArticleSlugs, getAllArticles, formatDate, jsonRteToHtml, timeAgo } from "@/helper";
import { notFound } from "next/navigation";
import Link from "next/link";
import { i18nConfig } from "@/i18n.config";
import ArticleInteractions from "@/components/article/ArticleInteractions";
import ContentTracker from "@/components/analytics/ContentTracker";
import FollowButton from "@/components/interactions/FollowButton";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

// Generate static params for all articles in all locales
export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  
  for (const locale of i18nConfig.locales) {
    const slugs = await getAllArticleSlugs(locale);
    slugs.forEach((slug: string) => {
      params.push({ locale, slug });
    });
  }
  
  return params;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  const { slug, locale } = await params;
  const article = await getArticleBySlug(slug, locale);
  
  if (!article) {
    return { title: 'Article Not Found' };
  }

  const pageTitle = article.headline || article.title || 'Article';
  
  return {
    title: article.seo?.metadata_title || pageTitle,
    description: article.seo?.metadata_description || pageTitle,
    keywords: article.seo?.metadata_keywords,
    openGraph: {
      title: article.seo?.metadata_title || pageTitle,
      description: article.seo?.metadata_description,
      type: 'article',
      publishedTime: article.published_date,
      authors: article.author?.[0]?.name,
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug, locale } = await params;
  const [article, allArticles] = await Promise.all([
    getArticleBySlug(slug, locale),
    getAllArticles(locale)
  ]);

  if (!article) {
    notFound();
  }
  
  // Get latest articles (excluding current) for sidebar fallback
  const latestArticles = allArticles?.filter((a: any) => a.uid !== slug).slice(0, 5) || [];

  // Get hero image
  const getHeroImage = () => {
    if (!article.group) return null;
    const heroGroup = article.group.find((g: any) => g.is_hero_image);
    return heroGroup?.image?.url || article.group[0]?.image?.url;
  };

  // Get body images (non-hero)
  const getBodyImages = () => {
    if (!article.group) return [];
    return article.group
      .filter((g: any) => !g.is_hero_image && g.image?.url)
      .map((g: any) => ({
        url: g.image.url,
        label: g.label
      }));
  };

  const heroImage = getHeroImage();
  const bodyImages = getBodyImages();
  const category = article.category?.[0];
  const author = article.author?.[0] || article.author;
  const relatedArticles = article.related_articles || [];
  
  // Get article title (try headline first, then title)
  const articleTitle = article.headline || article.title || 'Untitled Article';
  
  // Convert body to HTML
  const bodyHtml = typeof article.body === 'string' 
    ? article.body 
    : jsonRteToHtml(article.body);

  return (
    <main className="article-detail-page">
      {/* Lytics Content Tracking */}
      <ContentTracker
        contentId={article.uid}
        contentType="news_article"
        title={articleTitle}
        category={category?.name || category?.title}
        author={author?.name || author?.title}
        locale={locale}
        isFeatured={article.is_breaking}
        isPremium={article.is_premium}
        tags={article.tags?.map((t: any) => t.title || t.name)}
      />

      {/* Back Navigation */}
      <div className="article-back-nav">
        <div className="container">
          <Link href={`/${locale}`} className="back-to-home">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Back to Home
          </Link>
        </div>
      </div>

      <div className="container">
        <div className="article-layout">
          {/* Main Content - Left Side */}
          <article className="article-main">
            {/* Category Badge */}
            {category && (
              <Link href={`/${locale}/category/${category.uid}`} className="article-category-badge">
                {category.name || category.title}
              </Link>
            )}

            {/* Headline */}
            <h1 className="article-title">{articleTitle}</h1>

            {/* Author & Date Row - Minimal */}
            <div className="article-meta-row">
              {article.published_date && (
                <span className="article-date">
                  {formatDate(article.published_date, locale)}
                </span>
              )}
              <span className="meta-separator">•</span>
              {author && (
                <div className="article-author-minimal">
                  <span className="by-text">By</span>
                  <Link href={`/${locale}/author/${author.uid}`} className="author-name-link">
                    {author.name || author.title}
                  </Link>
                  <FollowButton 
                    targetType="author"
                    targetEntryId={author.uid}
                    targetName={author.name || author.title}
                    variant="minimal"
                    size="sm"
                  />
                </div>
              )}
            </div>

            {/* Hero Image */}
            {heroImage && (
              <div className="article-hero-image">
                <img src={heroImage} alt={articleTitle} />
              </div>
            )}

            {/* Article Body */}
            <div 
              className="article-content"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />

            {/* Image Gallery */}
            {bodyImages.length > 0 && (
              <div className="article-gallery">
                <h3 className="gallery-title">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="m21 15-5-5L5 21"/>
                  </svg>
                  Gallery
                </h3>
                <div className="gallery-grid">
                  {bodyImages.map((img: any, index: number) => (
                    <figure key={index} className="gallery-item">
                      <img src={img.url} alt={img.label || `Image ${index + 1}`} />
                      {img.label && <figcaption>{img.label}</figcaption>}
                    </figure>
                  ))}
                </div>
              </div>
            )}

            {/* Interactions - Likes, Comments, Follow */}
            <ArticleInteractions 
              articleUid={article.uid}
              author={author ? { uid: author.uid, name: author.name || author.title } : null}
              category={category ? { uid: category.uid, name: category.name || category.title } : null}
            />
          </article>

          {/* Sidebar - Right Side */}
          <aside className="article-sidebar">
            {/* Related Articles or Latest News */}
            {(() => {
              const sidebarArticles = relatedArticles.length > 0 ? relatedArticles : latestArticles;
              const sidebarTitle = relatedArticles.length > 0 ? 'Related Stories' : 'Latest News';
              
              if (sidebarArticles.length === 0) return null;
              
              return (
                <div className="sidebar-section">
                  <h4 className="sidebar-title">{sidebarTitle}</h4>
                  <div className="sidebar-articles">
                    {sidebarArticles.slice(0, 5).map((item: any) => {
                      const itemImage = item.group?.find((g: any) => g.is_hero_image)?.image?.url 
                        || item.group?.[0]?.image?.url;
                      const itemCategory = item.category?.[0];
                      const itemTitle = item.headline || item.title;
                      
                      return (
                        <Link 
                          key={item.uid} 
                          href={`/${locale}/news/${item.uid}`}
                          className="sidebar-article"
                        >
                          {itemImage && (
                            <div className="sidebar-article-img">
                              <img src={itemImage} alt={itemTitle} />
                            </div>
                          )}
                          <div className="sidebar-article-content">
                            {itemCategory && (
                              <span className="sidebar-article-category">
                                {itemCategory.name || itemCategory.title}
                              </span>
                            )}
                            <h5 className="sidebar-article-title">{itemTitle}</h5>
                            <span className="sidebar-article-time">
                              {timeAgo(item.published_date, locale)}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
            
            {/* Category Follow Suggestion */}
            {category && (
              <div className="sidebar-section sidebar-category-box">
                <h4 className="sidebar-title">More from {category.name || category.title}</h4>
                <Link href={`/${locale}/category/${category.uid}`} className="sidebar-category-link">
                  View all articles →
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
