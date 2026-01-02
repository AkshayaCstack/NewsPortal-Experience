import { getAllPodcasts } from "@/helper";
import Link from "next/link";
import { i18nConfig } from "@/i18n.config";
import ContentSearch from "@/components/search/ContentSearch";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return i18nConfig.locales.map((locale) => ({ locale }));
}

export async function generateMetadata() {
  return {
    title: "Podcasts | NewzHub",
    description: "Explore our collection of podcasts featuring interviews, discussions, and expert conversations",
  };
}

export default async function PodcastsPage({ params }: PageProps) {
  const { locale } = await params;
  
  const allPodcasts = await getAllPodcasts(locale);

  return (
    <main className="content-page">
      {/* Page Header with Search */}
      <section className="content-page-header">
        <div className="container">
          <div className="content-page-title-row">
            <div className="content-page-info">
              <span className="content-page-icon">🎙️</span>
              <div>
                <h1>Podcasts</h1>
                <p>{allPodcasts.length} shows available</p>
              </div>
            </div>
            <ContentSearch 
              locale={locale} 
              contentType="podcast"
              placeholder="Search podcasts..."
            />
          </div>
        </div>
      </section>

      {/* All Podcasts Grid */}
      <section className="content-grid-section">
        <div className="container">
          <div className="content-subsection">
            <h2 className="content-subsection-title">All Podcasts</h2>
            {allPodcasts.length > 0 ? (
              <div className="podcasts-grid">
                {allPodcasts.map((podcast: any) => (
                  <PodcastCard key={podcast.uid} podcast={podcast} locale={locale} />
                ))}
              </div>
            ) : (
              <div className="content-empty">
                <span>🎙️</span>
                <h3>No podcasts yet</h3>
                <p>Check back later for new content.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function PodcastCard({ podcast, locale }: { podcast: any; locale: string }) {
  const author = podcast.author?.[0] || podcast.author;
  const category = podcast.category?.[0] || podcast.category;
  
  return (
    <Link href={`/${locale}/podcasts/${podcast.uid}`} className="podcast-card">
      <div className="podcast-card-image">
        <img 
          src={podcast.cover_image?.url || 'https://via.placeholder.com/300x300?text=Podcast'} 
          alt={podcast.title}
        />
        <div className="podcast-play-overlay">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        </div>
      </div>
      <div className="podcast-card-content">
        {category && (
          <span className="podcast-category">{category.title || category.name}</span>
        )}
        <h4 className="podcast-card-title">{podcast.title}</h4>
        {podcast.description && (
          <p className="podcast-card-desc">{podcast.description}</p>
        )}
        <div className="podcast-card-footer">
          {author && (
            <div className="podcast-card-author">
              {author.profile_image?.url && (
                <img src={author.profile_image.url} alt="" />
              )}
              <span>{author.name || author.title}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
