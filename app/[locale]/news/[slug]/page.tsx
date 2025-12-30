import { getArticleBySlug, getAllArticleSlugs, formatDate, jsonRteToHtml } from "@/helper";
import { notFound } from "next/navigation";
import Link from "next/link";
import { i18nConfig } from "@/i18n.config";

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
  const article = await getArticleBySlug(slug, locale);

  if (!article) {
    notFound();
  }

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
                  <button className="subscribe-btn">Subscribe</button>
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

            {/* Share & Tags Section */}
            <div className="article-footer">
              <div className="share-section">
                <span>Share this article:</span>
                <div className="share-buttons">
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
                  <button className="share-btn" title="Copy Link">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </article>

          {/* Sidebar - Right Side (Related Articles Only) */}
          <aside className="article-sidebar">
            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div className="sidebar-related">
                <h4 className="sidebar-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                  </svg>
                  Related Articles
                </h4>
                <div className="related-list">
                  {relatedArticles.map((related: any) => {
                    const relatedHeroImage = related.group?.find((g: any) => g.is_hero_image)?.image?.url 
                      || related.group?.[0]?.image?.url;
                    const relatedCategory = related.category?.[0];
                    const relatedTitle = related.headline || related.title || 'Related Article';
                    
                    return (
                      <Link 
                        key={related.uid} 
                        href={`/${locale}/news/${related.uid}`}
                        className="related-item"
                      >
                        {relatedHeroImage && (
                          <img src={relatedHeroImage} alt={relatedTitle} />
                        )}
                        <div className="related-item-content">
                          {relatedCategory && (
                            <span className="related-category">
                              {relatedCategory.name || relatedCategory.title}
                            </span>
                          )}
                          <h5>{relatedTitle}</h5>
                          {related.published_date && (
                            <span className="related-date">{formatDate(related.published_date, locale)}</span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
