import { getAllUserStories, formatDate, jsonRteToText, jsonRteToHtml, getPageByURL } from "@/helper";
import Link from "next/link";
import { i18nConfig } from "@/i18n.config";
import WriteStoryButton from "@/components/user-stories/WriteStoryButton";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { getEditTagProps, getModularBlockEditTagProps } from "@/lib/editTags";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return i18nConfig.locales.map((locale) => ({ locale }));
}

export const metadata = {
  title: "User Stories | Community Voices",
  description: "Read stories submitted by our community members. Share your own experiences and perspectives.",
};

export default async function UserStoriesPage({ params }: PageProps) {
  const { locale } = await params;
  
  // Fetch CMS page data and user stories in parallel
  const [pageData, stories] = await Promise.all([
    getPageByURL("/user-stories-page", locale),
    getAllUserStories(locale)
  ]);

  // Extract components from CMS
  const components = pageData?.components || [];
  
  // Find hero content (rich_text_section)
  const heroComponentIndex = components.findIndex((c: any) => c.rich_text_section);
  const heroComponent = heroComponentIndex >= 0 ? components[heroComponentIndex].rich_text_section : null;
  
  // Find CTA content (newsletter_card)
  const ctaComponentIndex = components.findIndex((c: any) => c.newsletter_card);
  const ctaComponent = ctaComponentIndex >= 0 ? components[ctaComponentIndex].newsletter_card : null;

  // Default content fallbacks
  const heroTitle = heroComponent?.title || "Stories From Our Community";
  const heroContent = heroComponent?.content 
    ? (typeof heroComponent.content === 'string' 
        ? heroComponent.content.replace(/<[^>]*>/g, '').replace('Write Your Story', '').trim()
        : jsonRteToText(heroComponent.content))
    : "Real stories from real people. Share your experiences, perspectives, and insights with our growing community.";
  
  const ctaTitle = ctaComponent?.title || "Have a story to share?";
  const ctaDescription = ctaComponent?.description || "Your voice matters. Share your experiences and connect with our community.";
  const ctaButtonText = ctaComponent?.button_text || "Write Your Story";

  // Featured story (first one)
  const featuredStory = stories[0];
  const otherStories = stories.slice(1);

  // Parse hero title into lines (split by "Our" for accent)
  const titleParts = heroTitle.split(/\s+(Our)\s+/i);
  const titleLine1 = titleParts[0] || "Stories From";
  const titleLine2 = titleParts.length > 1 ? `Our ${titleParts[2] || "Community"}` : "Our Community";

  return (
    <main className="user-stories-page">
      {/* Hero Header */}
      <section className="user-stories-hero">
        <div className="user-stories-hero-bg">
          <div className="hero-pattern"></div>
          <div className="hero-gradient"></div>
        </div>
        <div className="container">
          <div className="user-stories-hero-content">
            <div className="hero-badge">
              <span className="badge-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                </svg>
              </span>
              Community Voices
            </div>
            <h1 
              className="hero-title"
              {...(heroComponentIndex >= 0 ? getModularBlockEditTagProps(pageData, heroComponentIndex, 'rich_text_section', 'title', 'page', locale) : {})}
            >
              <span className="title-line">{titleLine1}</span>
              <span className="title-line accent">{titleLine2}</span>
            </h1>
            <p 
              className="hero-description"
              {...(heroComponentIndex >= 0 ? getModularBlockEditTagProps(pageData, heroComponentIndex, 'rich_text_section', 'content', 'page', locale) : {})}
            >
              {heroContent}
            </p>
            
            <div className="hero-actions">
              <WriteStoryButton locale={locale} />
            </div>

            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-value">{stories.length}</span>
                <span className="stat-label">Stories</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-value">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </span>
                <span className="stat-label">Curated</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Story */}
      {featuredStory && (
        <section className="featured-user-story-section">
          <div className="container">
            <ScrollReveal direction="up">
              <div className="featured-user-story-card">
                <div className="featured-story-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  Featured Story
                </div>
                
                <div className="featured-story-content">
                  <div className="featured-story-meta">
                    {featuredStory.category && (
                      <span className="story-category">
                        {featuredStory.category.title || featuredStory.category}
                      </span>
                    )}
                    {featuredStory.location && (
                      <span className="story-location">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        {featuredStory.location}
                      </span>
                    )}
                  </div>
                  
                  <Link href={`/${locale}/user-stories/${featuredStory.uid}`}>
                    <h2 
                      className="featured-story-title"
                      {...getEditTagProps(featuredStory, 'title', 'user_stories', locale)}
                    >
                      {featuredStory.title}
                    </h2>
                  </Link>
                  
                  {featuredStory.summary && (
                    <p 
                      className="featured-story-summary"
                      {...getEditTagProps(featuredStory, 'summary', 'user_stories', locale)}
                    >
                      {typeof featuredStory.summary === 'string' 
                        ? featuredStory.summary 
                        : jsonRteToText(featuredStory.summary)}
                    </p>
                  )}
                  
                  <div className="featured-story-footer">
                    <div className="story-author-info">
                      <div className="author-avatar">
                        {(featuredStory.user_email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="author-details">
                        <span className="author-name">Community Member</span>
                        <span className="story-date">{formatDate(featuredStory.created_at, locale)}</span>
                      </div>
                    </div>
                    <Link href={`/${locale}/user-stories/${featuredStory.uid}`} className="read-story-btn">
                      Read Story
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* All Stories Grid - Only show if there are more stories */}
      {otherStories.length > 0 && (
        <section className="user-stories-grid-section">
          <div className="container">
            <div className="section-header-bar">
              <h2 className="section-title">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                More Stories
              </h2>
              <span className="story-count">{otherStories.length} more</span>
            </div>

            <div className="user-stories-grid">
              {otherStories.map((story: any, index: number) => (
                <ScrollReveal key={story.uid} direction="up" delay={index * 50}>
                  <Link href={`/${locale}/user-stories/${story.uid}`} className="user-story-card">
                    <div className="story-card-header">
                      {story.category && (
                        <span className="story-category-badge">
                          {story.category.title || story.category}
                        </span>
                      )}
                      {story.location && (
                        <span className="story-location-badge">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                          {story.location}
                        </span>
                      )}
                    </div>
                    
                    <h3 
                      className="story-card-title"
                      {...getEditTagProps(story, 'title', 'user_stories', locale)}
                    >
                      {story.title}
                    </h3>
                    
                    {story.summary && (
                      <p 
                        className="story-card-summary"
                        {...getEditTagProps(story, 'summary', 'user_stories', locale)}
                      >
                        {(typeof story.summary === 'string' 
                          ? story.summary 
                          : jsonRteToText(story.summary)
                        ).substring(0, 120)}...
                      </p>
                    )}
                    
                    <div className="story-card-footer">
                      <div className="story-author-mini">
                        <div className="author-avatar-mini">
                          {(story.user_email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span className="author-label">Community</span>
                      </div>
                      <span className="story-date-mini">{formatDate(story.created_at, locale)}</span>
                    </div>
                    
                    <div className="story-card-hover-effect"></div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty State - Only show if NO stories at all */}
      {stories.length === 0 && (
        <section className="user-stories-empty-section">
          <div className="container">
            <div className="empty-stories-state">
              <div className="empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
              </div>
              <h3>No stories yet</h3>
              <p>Be the first to share your story with the community!</p>
              <WriteStoryButton locale={locale} variant="primary" />
            </div>
          </div>
        </section>
      )}

      {/* CTA Section - From CMS */}
      <section className="user-stories-cta">
        <div className="container">
          <div className="cta-card">
            <div className="cta-content">
              <h3 {...(ctaComponentIndex >= 0 ? getModularBlockEditTagProps(pageData, ctaComponentIndex, 'newsletter_card', 'title', 'page', locale) : {})}>
                {ctaTitle}
              </h3>
              <p {...(ctaComponentIndex >= 0 ? getModularBlockEditTagProps(pageData, ctaComponentIndex, 'newsletter_card', 'description', 'page', locale) : {})}>
                {ctaDescription}
              </p>
            </div>
            <WriteStoryButton 
              locale={locale} 
              variant="cta" 
              buttonText={ctaButtonText}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
