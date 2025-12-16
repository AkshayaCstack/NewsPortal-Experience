import Link from "next/link";
import { timeAgo } from "@/helper";

interface ArticlesSectionProps {
  data: any[];
  title?: string;
  description?: string;
}

export default function ArticlesSection({ data, title = "Latest News", description }: ArticlesSectionProps) {
  if (!data || data.length === 0) return null;

  // Get hero image from article
  const getHeroImage = (article: any) => {
    if (!article?.group) return null;
    const heroGroup = article.group.find((g: any) => g.is_hero_image);
    return heroGroup?.image?.url || article.group[0]?.image?.url;
  };

  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <div>
            <h2 className="section-title">{title}</h2>
            {description && (
              <p className="text-muted" style={{ marginTop: 4 }}>{description}</p>
            )}
          </div>
          <Link href="/news" className="see-all">
            See All
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </Link>
        </div>

        <div className="articles-grid">
          {data.map((item: any, index: number) => {
            const article = item.referenced_article?.[0] || item.referenced_article || item;
            if (!article) return null;

            const heroImage = getHeroImage(article);
            // Category is already included in the article data via reference
            const category = article.category?.[0] || article.category;
            // Author is already included in the article data via reference
            const author = article.author?.[0] || article.author;
            const articleTitle = article.headline || article.title || 'Untitled Article';

            return (
              <Link 
                key={article.uid || index} 
                href={`/news/${article.uid}`}
                className="article-card"
              >
                <div className="article-card-image">
                  <img 
                    src={heroImage || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250"><rect fill="%23e5e7eb" width="400" height="250"/><text x="200" y="130" text-anchor="middle" fill="%239ca3af" font-size="16">No Image</text></svg>'} 
                    alt={articleTitle}
                  />
                </div>
                <div className="article-card-content">
                  {category && (
                    <span className="article-card-category">
                      {category.name || category.title}
                    </span>
                  )}
                  <h3 className="article-card-title">{articleTitle}</h3>
                  <div className="article-card-meta">
                    {author?.profile_image?.url && (
                      <img 
                        src={author.profile_image.url} 
                        alt={author.name || author.title}
                        className="article-card-author-img"
                      />
                    )}
                    <span>{author?.name || author?.title || 'Unknown'}</span>
                    <span>•</span>
                    <span>{timeAgo(article.published_date)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
