import Link from "next/link";
import { timeAgo } from "@/helper";

interface BreakingNewsProps {
  data: {
    title?: string;
    group?: any[];
  };
}

export default function BreakingNews({ data }: BreakingNewsProps) {
  if (!data?.group || data.group.length === 0) return null;

  const articles = data.group;
  const mainArticle = articles[0]?.referenced_article?.[0] || articles[0]?.referenced_article;
  const sideArticles = articles.slice(1, 5);

  if (!mainArticle) return null;

  // Get hero image from article
  const getHeroImage = (article: any) => {
    if (!article?.group) return null;
    const heroGroup = article.group.find((g: any) => g.is_hero_image);
    return heroGroup?.image?.url || article.group[0]?.image?.url;
  };

  return (
    <section className="breaking-section">
      <div className="container">
        <div className="section-header" style={{ marginBottom: 24 }}>
          <h2 className="section-title" style={{ color: 'white' }}>
            {data.title || 'Breaking News'}
          </h2>
          <Link href="/breaking" className="see-all" style={{ color: '#ff6b6b' }}>
            View All
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </Link>
        </div>

        <div className="breaking-grid">
          {/* Main Featured Article */}
          <Link href={mainArticle.url || '#'}>
            <div className="breaking-main">
              <img 
                src={getHeroImage(mainArticle) || '/placeholder.jpg'} 
                alt={mainArticle.headline}
              />
              <div className="breaking-main-overlay">
                <span className="breaking-badge">Live</span>
                <h3 className="breaking-main-title">{mainArticle.headline}</h3>
                <div className="featured-card-meta">
                  {mainArticle.author?.[0]?.name && (
                    <span>{mainArticle.author[0].name}</span>
                  )}
                  <span>•</span>
                  <span>{timeAgo(mainArticle.published_date)}</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Sidebar Articles */}
          {sideArticles.length > 0 && (
            <div className="breaking-sidebar">
              {sideArticles.map((item: any, index: number) => {
                const article = item.referenced_article?.[0] || item.referenced_article;
                if (!article) return null;

                return (
                  <Link key={article.uid || index} href={article.url || '#'}>
                    <div className="breaking-sidebar-item">
                      <img 
                        src={getHeroImage(article) || '/placeholder.jpg'} 
                        alt={article.headline}
                      />
                      <div className="breaking-sidebar-content">
                        <h4 className="breaking-sidebar-title">{article.headline}</h4>
                        <span className="breaking-sidebar-meta">
                          {timeAgo(article.published_date)}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
