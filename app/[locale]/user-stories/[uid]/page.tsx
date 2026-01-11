import { getUserStoryByUid, getAllUserStoryUids, formatDate, jsonRteToHtml, jsonRteToText } from "@/helper";
import { notFound } from "next/navigation";
import Link from "next/link";
import { i18nConfig } from "@/i18n.config";
import ContentInteractions from "@/components/interactions/ContentInteractions";
import WriteStoryButton from "@/components/user-stories/WriteStoryButton";
import { getEditTagProps } from "@/lib/editTags";

interface PageProps {
  params: Promise<{ uid: string; locale: string }>;
}

export async function generateStaticParams() {
  const params: { locale: string; uid: string }[] = [];
  
  for (const locale of i18nConfig.locales) {
    const uids = await getAllUserStoryUids(locale);
    uids.forEach((uid: string) => {
      params.push({ locale, uid });
    });
  }
  
  return params;
}

export async function generateMetadata({ params }: PageProps) {
  const { uid, locale } = await params;
  const story = await getUserStoryByUid(uid, locale);
  
  if (!story) {
    return { title: "Story Not Found" };
  }

  const summary = story.summary 
    ? (typeof story.summary === 'string' ? story.summary : jsonRteToText(story.summary))
    : '';

  return {
    title: `${story.title} | User Stories`,
    description: summary || story.title,
  };
}

export default async function UserStoryDetailPage({ params }: PageProps) {
  const { uid, locale } = await params;
  const story = await getUserStoryByUid(uid, locale);

  if (!story) {
    notFound();
  }

  const category = story.category;
  
  // Parse body content
  const bodyHtml = story.body 
    ? (typeof story.body === 'string' ? story.body : jsonRteToHtml(story.body))
    : '';

  return (
    <main className="user-story-detail-page">
      {/* Back Navigation */}
      <nav className="story-nav">
        <div className="container">
          <Link href={`/${locale}/user-stories`} className="story-back-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            All Stories
          </Link>
        </div>
      </nav>

      {/* Story Header */}
      <header className="story-detail-header">
        <div className="container">
          <div className="story-header-content">
            <div className="story-meta-row">
              <span className="story-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                </svg>
                User Story
              </span>
              {category && (
                <span className="story-category">
                  {category.title || category}
                </span>
              )}
              {story.location && (
                <span className="story-location">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {story.location}
                </span>
              )}
            </div>

            <h1 
              className="story-detail-title"
              {...getEditTagProps(story, 'title', 'user_stories', locale)}
            >
              {story.title}
            </h1>

            {story.summary && (
              <p 
                className="story-detail-summary"
                {...getEditTagProps(story, 'summary', 'user_stories', locale)}
              >
                {typeof story.summary === 'string' ? story.summary : jsonRteToText(story.summary)}
              </p>
            )}

            <div className="story-author-row">
              <div className="story-author-card">
                <div className="author-avatar-large">
                  {(story.user_email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="author-info">
                  <span className="author-label">Submitted by</span>
                  <span className="author-name">Community Member</span>
                </div>
              </div>
              <div className="story-date-info">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>{formatDate(story.created_at, locale)}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Story Body */}
      <article className="story-detail-body">
        <div className="container">
          <div className="story-content-wrapper">
            <div 
              className="story-body-content"
              {...getEditTagProps(story, 'body', 'user_stories', locale)}
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          </div>
        </div>
      </article>

      {/* Interactions */}
      <section className="story-interactions">
        <div className="container">
          <ContentInteractions 
            contentType="user_story"
            contentUid={story.uid}
            author={null}
            category={category ? { uid: category.uid || category, name: category.title || category } : null}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="story-cta-section">
        <div className="container">
          <div className="story-cta-card">
            <div className="cta-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
              </svg>
            </div>
            <div className="cta-text">
              <h3>Inspired to share?</h3>
              <p>Your story could be featured next. Share your unique perspective with our community.</p>
            </div>
            <WriteStoryButton locale={locale} variant="primary" />
          </div>
        </div>
      </section>
    </main>
  );
}

