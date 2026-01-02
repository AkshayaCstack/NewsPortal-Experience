import { getAllVideos } from "@/helper";
import { i18nConfig } from "@/i18n.config";
import ContentSearch from "@/components/search/ContentSearch";
import VideoGrid from "@/components/video/VideoGrid";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return i18nConfig.locales.map((locale) => ({ locale }));
}

export const metadata = {
  title: "Videos | NewzHub",
  description: "Watch news explainers, interviews, reports, and visual stories",
};

export default async function VideosPage({ params }: PageProps) {
  const { locale } = await params;
  
  const allVideos = await getAllVideos(locale);

  return (
    <main className="content-page">
      {/* Page Header with Search */}
      <section className="content-page-header">
        <div className="container">
          <div className="content-page-title-row">
            <div className="content-page-info">
              <span className="content-page-icon">🎬</span>
              <div>
                <h1>Videos</h1>
                <p>{allVideos.length} videos available</p>
              </div>
            </div>
            <ContentSearch 
              locale={locale} 
              contentType="video"
              placeholder="Search videos..."
            />
          </div>
        </div>
      </section>

      {/* All Videos Grid */}
      <section className="content-grid-section">
        <div className="container">
          <div className="content-subsection">
            <h2 className="content-subsection-title">All Videos</h2>
            {allVideos.length > 0 ? (
              <VideoGrid videos={allVideos} />
            ) : (
              <div className="content-empty">
                <span>🎬</span>
                <h3>No videos yet</h3>
                <p>Check back later for new content.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
