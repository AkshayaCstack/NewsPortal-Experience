import Link from "next/link";
import { timeAgo } from "@/helper";
import { getEditTagProps } from "@/lib/editTags";

interface ArticlesSectionProps {
  data: any[];
  title?: string;
  description?: string;
  seeMoreText?: string;
  seeMoreLink?: string;
  locale?: string;
}

export default function ArticlesSection({ 
  data, 
  title = "Latest News", 
  description,
  seeMoreText,
  seeMoreLink,
  locale = 'en-us'
}: ArticlesSectionProps) {
  if (!data || data.length === 0) return null;

  // Get hero image from article's group field
  const getHeroImage = (article: any) => {
    if (!article?.group) return null;
    const heroGroup = article.group.find((g: any) => g.is_hero_image);
    return heroGroup?.image?.url || article.group[0]?.image?.url;
  };

  // Default see more text based on locale
  const defaultSeeMoreText = locale === 'ta-in' ? 'அனைத்தும் காண்க' : 'See all';
  const defaultSeeMoreLink = `/${locale}/news`;

  return (
    <section className="articles-section">
      <div className="container">
        <div className="section-header-row">
          <div className="section-header-text">
            <h2 className="section-title">{title}</h2>
            {description && description.trim() !== '' && (
              <p className="section-desc">{description}</p>
            )}
          </div>
          <Link href={seeMoreLink || defaultSeeMoreLink} className="see-all-btn">
            {seeMoreText || defaultSeeMoreText}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </Link>
        </div>

        {/* Horizontal Scroll Container */}
        <div className="articles-row">
          {data.slice(0, 8).map((item: any, index: number) => {
            // Unwrap referenced_article if present
            const article = item.referenced_article || item;
            const heroImage = getHeroImage(article);
            const category = article.category?.[0] || article.category;
            const author = article.author?.[0] || article.author;
            const articleTitle = article.title || article.headline || (locale === 'ta-in' ? 'தலைப்பு இல்லை' : 'Untitled Article');

            return (
              <Link 
                key={article.uid || index} 
                href={`/${locale}/news/${article.uid}`}
                className="article-card-new"
              >
                <div className="article-card-img">
                  <img 
                    src={heroImage || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="280" viewBox="0 0 400 280"><rect fill="%231a1a2e" width="400" height="280"/></svg>'} 
                    alt={articleTitle}
                  />
                </div>
                <div className="article-card-body">
                  <div className="article-card-meta">
                    {author?.profile_image?.url && (
                      <img src={author.profile_image.url} alt="" className="meta-avatar" />
                    )}
                    <span className="meta-author">{author?.name || author?.title || (locale === 'ta-in' ? 'தெரியாத' : 'Unknown')}</span>
                    <span className="meta-dot">•</span>
                    {category && (
                      <span className="meta-category">{category.title || category.name}</span>
                    )}
                  </div>
                  <h3 
                    className="article-card-title"
                    {...getEditTagProps(article, 'title', 'news_article', locale)}
                  >
                    {articleTitle}
                  </h3>
                  <span className="article-card-time">{timeAgo(article.published_date, locale)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
