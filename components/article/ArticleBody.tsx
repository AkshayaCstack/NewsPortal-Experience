import { jsonRteToHtml } from "@/helper";

interface ArticleBodyProps {
  article: any;
}

export default function ArticleBody({ article }: ArticleBodyProps) {
  if (!article?.body) return null;

  // Convert body to HTML (handle both string and JSON RTE)
  const bodyHtml = typeof article.body === 'string' 
    ? article.body 
    : jsonRteToHtml(article.body);

  // Get all non-hero images from article
  const getBodyImages = () => {
    if (!article.group) return [];
    return article.group
      .filter((g: any) => !g.is_hero_image && g.image?.url)
      .map((g: any) => ({
        url: g.image.url,
        label: g.label
      }));
  };

  const bodyImages = getBodyImages();

  return (
    <div className="container">
      <article 
        className="article-body"
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />

      {/* Additional Images Gallery */}
      {bodyImages.length > 0 && (
        <div className="container" style={{ maxWidth: 720, margin: '0 auto 48px' }}>
          <h3 style={{ marginBottom: 16 }}>Gallery</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
            gap: 16 
          }}>
            {bodyImages.map((img: any, index: number) => (
              <figure key={index} style={{ margin: 0 }}>
                <img
                  src={img.url}
                  alt={img.label || `Image ${index + 1}`}
                  style={{
                    width: '100%',
                    borderRadius: 'var(--radius-md)',
                    aspectRatio: '4/3',
                    objectFit: 'cover'
                  }}
                />
                {img.label && (
                  <figcaption style={{ 
                    fontSize: '0.85rem', 
                    color: 'var(--color-text-muted)',
                    marginTop: 8 
                  }}>
                    {img.label}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
