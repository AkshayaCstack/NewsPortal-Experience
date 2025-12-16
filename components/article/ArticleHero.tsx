import { formatDate } from "@/helper";

interface ArticleHeroProps {
  article: any;
}

export default function ArticleHero({ article }: ArticleHeroProps) {
  if (!article) return null;

  // Get hero image from article
  const getHeroImage = () => {
    if (!article.group) return null;
    const heroGroup = article.group.find((g: any) => g.is_hero_image);
    return heroGroup?.image?.url || article.group[0]?.image?.url;
  };

  const heroImage = getHeroImage();
  const category = article.category?.[0];
  const author = article.author?.[0] || article.author;

  return (
    <div className="article-hero">
      <div className="container">
        {/* Category */}
        {category && (
          <span className="article-category">
            {category.name || category.title}
          </span>
        )}

        {/* Headline */}
        <h1 className="article-headline">{article.headline}</h1>

        {/* Meta */}
        <div className="article-meta">
          {author && (
            <div className="article-author-info">
              {author.profile_image?.url && (
                <img
                  src={author.profile_image.url}
                  alt={author.name}
                />
              )}
              <div>
                <div className="article-author-name">{author.name}</div>
                {author.bio && (
                  <div className="article-author-role">
                    {author.bio.length > 50 ? author.bio.substring(0, 50) + '...' : author.bio}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {article.published_date && (
            <div className="article-date">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6, verticalAlign: 'middle' }}>
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <path d="M16 2v4"/>
                <path d="M8 2v4"/>
                <path d="M3 10h18"/>
              </svg>
              {formatDate(article.published_date)}
            </div>
          )}
        </div>

        {/* Hero Image */}
        {heroImage && (
          <div className="article-hero-image">
            <img
              src={heroImage}
              alt={article.headline}
            />
          </div>
        )}
      </div>
    </div>
  );
}
