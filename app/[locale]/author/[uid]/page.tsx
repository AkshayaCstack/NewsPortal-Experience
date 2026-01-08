import { getAuthorByUid, getArticlesByAuthor, getAllAuthors } from "@/helper";
import ArticlesSection from "@/components/home/ArticlesSection";
import AuthorActions from "@/components/author/AuthorActions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getEditTagProps } from "@/lib/editTags";

export const revalidate = 60;

// Generate static params for all authors
export async function generateStaticParams() {
  const authors = await getAllAuthors();
  return authors.map((author: any) => ({ uid: author.uid }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  const author = await getAuthorByUid(uid);
  
  if (!author) {
    return { title: 'Author Not Found' };
  }

  const authorName = author.name || author.title || 'Author';

  return {
    title: `${authorName} - Author`,
    description: author.bio || `Articles by ${authorName}`,
  };
}

export default async function AuthorPage({ params }: { params: Promise<{ uid: string; locale: string }> }) {
  const { uid, locale } = await params;
  
  const [author, articles] = await Promise.all([
    getAuthorByUid(uid, locale),
    getArticlesByAuthor(uid, locale)
  ]);

  if (!author) {
    notFound();
  }

  // Get author name (try name first, then title)
  const authorName = author.name || author.title || 'Unknown Author';

  // Transform articles for ArticlesSection
  const articlesData = articles.map((article: any) => ({
    referenced_article: article,
  }));

  return (
    <main>
      {/* Author Hero Section */}
      <section className="author-hero-section">
        <div className="container">
          <Link href="/" className="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Back to Home
          </Link>
          
          <div className="author-hero">
            <div 
              className="author-hero-avatar"
              {...getEditTagProps(author, 'profile_image', 'author', locale)}
            >
              <img
                src={author.profile_image?.url || `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect fill="%23252540" width="160" height="160" rx="80"/><text x="80" y="95" text-anchor="middle" fill="%23a78bfa" font-size="56" font-weight="bold">${encodeURIComponent(authorName.charAt(0) || 'A')}</text></svg>`}
                alt={authorName}
              />
            </div>
            
            <div className="author-hero-info">
              <h1 {...getEditTagProps(author, 'name', 'author', locale)}>{authorName}</h1>
              {author.bio && (
                <p className="author-bio" {...getEditTagProps(author, 'bio', 'author', locale)}>
                  {author.bio}
                </p>
              )}
              
              {/* Social Links */}
              {author.social_apps && author.social_apps.length > 0 && (
                <div className="author-social-links">
                  {author.social_apps.map((social: any, index: number) => (
                    <a 
                      key={index}
                      href={social.link?.href || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="social-link"
                      title={social.platform}
                    >
                      {social.platform}
                    </a>
                  ))}
                </div>
              )}
              
              <div className="author-stats">
                <div className="stat">
                  <span className="stat-value">{articles.length}</span>
                  <span className="stat-label">Articles</span>
                </div>
              </div>
              
              {/* Follow Button */}
              <div className="author-actions">
                <AuthorActions authorUid={author.uid} authorName={authorName} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Author's Articles */}
      {articlesData.length > 0 ? (
        <ArticlesSection
          data={articlesData}
          title={`Articles by ${authorName}`}
        />
      ) : (
        <section className="section">
          <div className="container text-center">
            <p className="text-muted">No articles published yet.</p>
          </div>
        </section>
      )}
    </main>
  );
}
