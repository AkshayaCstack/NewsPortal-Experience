"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ContentSearch from '@/components/search/ContentSearch';
import { getEditTagProps } from '@/lib/editTags';

interface Article {
  uid: string;
  title: string;
  headline?: string;
  body?: any;
  description?: any;
  published_date?: string;
  is_featured?: boolean;
  is_breaking?: boolean;
  group?: any[];
  author?: any[];
  category?: any[];
}

interface Category {
  uid: string;
  title?: string;
  name?: string;
}

interface NewsroomContentProps {
  articles: Article[];
  categories: Category[];
  featuredArticles: Article[];
  breakingNews: Article[];
  locale: string;
  // CMS-driven titles
  headerTitle?: string;
  latestStoriesTitle?: string;
  trendingTopicsTitle?: string;
  mostReadTitle?: string;
  // For edit tags
  page?: any;
  headerIndex?: number;
  latestIndex?: number;
  mostReadIndex?: number;
}

export default function NewsroomContent({ 
  articles, 
  categories, 
  featuredArticles,
  breakingNews,
  locale,
  headerTitle,
  latestStoriesTitle,
  trendingTopicsTitle,
  mostReadTitle,
  page,
  headerIndex = -1,
  latestIndex = -1,
  mostReadIndex = -1
}: NewsroomContentProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Helper functions
  const getHeroImage = (article: Article) => {
    if (!article?.group) return null;
    const heroGroup = article.group.find((g: any) => g.is_hero_image);
    return heroGroup?.image?.url || article.group[0]?.image?.url;
  };

  const getSummary = (article: Article, maxLength = 120) => {
    let text = '';
    if (article.description) {
      text = typeof article.description === 'string' 
        ? article.description 
        : jsonRteToText(article.description);
    } else if (article.body) {
      text = typeof article.body === 'string' 
        ? article.body 
        : jsonRteToText(article.body);
    }
    text = text.replace(/<[^>]*>/g, '').trim();
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const jsonRteToText = (rte: any): string => {
    if (!rte) return '';
    if (typeof rte === 'string') return rte;
    if (rte.children) {
      return rte.children.map((child: any) => {
        if (child.text) return child.text;
        if (child.children) return jsonRteToText(child);
        return '';
      }).join(' ');
    }
    return '';
  };

  const getReadTime = (article: Article) => {
    let text = '';
    if (article.body) {
      text = typeof article.body === 'string' ? article.body : jsonRteToText(article.body);
    }
    const words = text.split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return `${minutes} min`;
  };

  const timeAgo = (dateString: string | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Filter articles by category
  const filterArticles = (articleList: Article[]) => {
    if (!activeCategory) return articleList;
    
    return articleList.filter(article => 
      article.category?.some((cat: any) => cat.uid === activeCategory)
    );
  };

  // Data processing
  const heroArticle = featuredArticles[0] || articles[0];
  const secondaryFeatured = featuredArticles.slice(1, 3);
  const featuredUids = featuredArticles.map(a => a.uid);
  const breakingUids = breakingNews.map(a => a.uid);
  const regularArticles = articles.filter(a => !featuredUids.includes(a.uid) && !breakingUids.includes(a.uid));
  const filteredArticles = filterArticles(regularArticles);
  
  // Most read (simulated - use top articles)
  const mostRead = articles.slice(0, 5);
  
  // Trending topics from categories
  const trendingTopics = categories.slice(0, 6);

  const getCategoryName = (uid: string) => {
    const cat = categories.find(c => c.uid === uid);
    return cat?.title || cat?.name || '';
  };

  return (
    <>
      {/* Newsroom Header */}
      <section className="newsroom-header">
        <div className="newsroom-header-bg">
          <div className="news-pattern"></div>
        </div>
        <div className="container">
          <div className="newsroom-header-content">
            <div className="newsroom-brand">
              <div className="newsroom-icon">
                <div className="broadcast-waves">
                  <span></span><span></span><span></span>
                </div>
              </div>
              <div>
                <h1 {...(page && headerIndex >= 0 ? getEditTagProps(page, `components.${headerIndex}.hero_section.title`, 'page', locale) : {})}>
                  {headerTitle || 'The Newsroom'}
                </h1>
                <div className="newsroom-live-info">
                  <span className="live-dot"></span>
                  <span className="live-time">
                    {currentTime.toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit',
                      hour12: true 
                    })}
                  </span>
                  <span className="live-date">
                    {currentTime.toLocaleDateString('en-US', { 
                      weekday: 'long',
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Algolia-powered Search */}
            <ContentSearch 
              locale={locale} 
              contentType="news_article"
              placeholder="Search stories..."
            />
          </div>
        </div>
      </section>

      {/* Breaking News Ticker */}
      {breakingNews.length > 0 && (
        <section className="breaking-ticker">
          <div className="ticker-label">
            <span className="ticker-pulse"></span>
            BREAKING
          </div>
          <div className="ticker-scroll">
            <div className="ticker-content">
              {breakingNews.map((article, idx) => (
                <Link 
                  key={article.uid} 
                  href={`/${locale}/news/${article.uid}`}
                  className="ticker-item"
                >
                  <span className="ticker-bullet">●</span>
                  {article.headline || article.title}
                </Link>
              ))}
              {/* Duplicate for seamless loop */}
              {breakingNews.map((article, idx) => (
                <Link 
                  key={`dup-${article.uid}`} 
                  href={`/${locale}/news/${article.uid}`}
                  className="ticker-item"
                >
                  <span className="ticker-bullet">●</span>
                  {article.headline || article.title}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category Filter */}
      <section className="newsroom-categories">
        <div className="container">
          <div className="category-filter-bar">
            <button 
              className={`category-chip ${!activeCategory ? 'active' : ''}`}
              onClick={() => setActiveCategory(null)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
              All Stories
            </button>
            {categories.map((cat) => (
              <button 
                key={cat.uid}
                className={`category-chip ${activeCategory === cat.uid ? 'active' : ''}`}
                onClick={() => setActiveCategory(activeCategory === cat.uid ? null : cat.uid)}
                {...getEditTagProps(cat, 'title', 'category', locale)}
              >
                {cat.title || cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="newsroom-main">
        <div className="container">
          <div className="newsroom-layout">
            {/* Main Content Column */}
            <div className="newsroom-content">
              {/* Hero Story */}
              {heroArticle && !activeCategory && (
                <Link 
                  href={`/${locale}/news/${heroArticle.uid}`}
                  className="hero-story-card"
                >
                  <div 
                    className="hero-story-image"
                    style={{ 
                      backgroundImage: getHeroImage(heroArticle) 
                        ? `url(${getHeroImage(heroArticle)})` 
                        : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
                    }}
                  >
                    <div className="hero-story-overlay"></div>
                  </div>
                  <div className="hero-story-content">
                    <div className="hero-story-badges">
                      {heroArticle.is_featured && (
                        <span className="badge-featured">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                          </svg>
                          Featured
                        </span>
                      )}
                      {heroArticle.category?.[0] && (
                        <span className="badge-category">
                          {heroArticle.category[0].title || heroArticle.category[0].name}
                        </span>
                      )}
                    </div>
                    <h2 className="hero-story-title">
                      {heroArticle.headline || heroArticle.title}
                    </h2>
                    <p className="hero-story-summary">{getSummary(heroArticle, 200)}</p>
                    <div className="hero-story-meta">
                      {heroArticle.author?.[0] && (
                        <span className="hero-author">
                          {heroArticle.author[0].profile_image?.url && (
                            <img src={heroArticle.author[0].profile_image.url} alt="" />
                          )}
                          {heroArticle.author[0].name || heroArticle.author[0].title}
                        </span>
                      )}
                      <span className="hero-time">{timeAgo(heroArticle.published_date)}</span>
                      <span className="hero-read">{getReadTime(heroArticle)} read</span>
                    </div>
                  </div>
                </Link>
              )}

              {/* Secondary Featured Row */}
              {secondaryFeatured.length > 0 && !activeCategory && (
                <div className="secondary-stories-grid">
                  {secondaryFeatured.map((article) => (
                    <Link 
                      key={article.uid}
                      href={`/${locale}/news/${article.uid}`}
                      className="secondary-story-card"
                    >
                      <div className="secondary-image">
                        <img 
                          src={getHeroImage(article) || 'https://via.placeholder.com/400x250?text=News'} 
                          alt={article.title}
                        />
                        {article.category?.[0] && (
                          <span className="secondary-category">
                            {article.category[0].title || article.category[0].name}
                          </span>
                        )}
                      </div>
                      <div className="secondary-content">
                        <h3 
                          className="secondary-title"
                          {...getEditTagProps(article, 'headline', 'news_article', locale)}
                        >
                          {article.headline || article.title}
                        </h3>
                        <div className="secondary-meta">
                          <span>{timeAgo(article.published_date)}</span>
                          <span>•</span>
                          <span>{getReadTime(article)} read</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Section Header */}
              <div className="stories-section-header">
                <h2 {...(page && latestIndex >= 0 && !activeCategory ? getEditTagProps(page, `components.${latestIndex}.hero_section.title`, 'page', locale) : {})}>
                  {activeCategory 
                    ? getCategoryName(activeCategory)
                    : (latestStoriesTitle || 'Latest Stories')
                  }
                </h2>
                <span className="stories-count">{filteredArticles.length} stories</span>
              </div>

              {/* Stories Grid */}
              {filteredArticles.length > 0 ? (
                <div className="stories-masonry">
                  {filteredArticles.map((article, index) => (
                    <StoryCard 
                      key={article.uid}
                      article={article}
                      locale={locale}
                      variant={index % 5 === 0 ? 'large' : 'standard'}
                      getHeroImage={getHeroImage}
                      getSummary={getSummary}
                      getReadTime={getReadTime}
                      timeAgo={timeAgo}
                    />
                  ))}
                </div>
              ) : (
                <div className="newsroom-empty">
                  <div className="empty-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V9a2 2 0 0 0-2-2h-1"/>
                      <path d="m9 15 2 2 4-4"/>
                    </svg>
                  </div>
                  <h3>No Stories Found</h3>
                  <p>
                    {activeCategory 
                      ? `No articles in ${getCategoryName(activeCategory)} yet.`
                      : 'Check back later for new stories.'
                    }
                  </p>
                  {activeCategory && (
                    <button 
                      className="btn-clear-filters"
                      onClick={() => setActiveCategory(null)}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar - The Pulse */}
            <aside className="newsroom-sidebar">
              {/* Trending Topics */}
              <div className="sidebar-card trending-topics-card">
                <div className="sidebar-card-header">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 7l-7 5 7 5V7z"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                  <h3>{trendingTopicsTitle || 'Trending Topics'}</h3>
                </div>
                <div className="trending-topics-list">
                  {trendingTopics.map((topic, idx) => (
                    <button 
                      key={topic.uid}
                      className={`trending-topic-btn ${activeCategory === topic.uid ? 'active' : ''}`}
                      onClick={() => setActiveCategory(topic.uid)}
                    >
                      <span className="topic-rank">#{idx + 1}</span>
                      <span className="topic-name">{topic.title || topic.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Most Read */}
              <div className="sidebar-card most-read-card">
                <div className="sidebar-card-header">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                  </svg>
                  <h3 {...(page && mostReadIndex >= 0 ? getEditTagProps(page, `components.${mostReadIndex}.hero_section.title`, 'page', locale) : {})}>
                    {mostReadTitle || 'Most Read'}
                  </h3>
                </div>
                <div className="most-read-list">
                  {mostRead.map((article, idx) => (
                    <Link 
                      key={article.uid}
                      href={`/${locale}/news/${article.uid}`}
                      className="most-read-item"
                    >
                      <span className="read-rank">{idx + 1}</span>
                      <div className="read-info">
                        <h4 {...getEditTagProps(article, 'headline', 'news_article', locale)}>
                          {article.headline || article.title}
                        </h4>
                        <span className="read-time">{timeAgo(article.published_date)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Live Activity */}
            {/* <div className="sidebar-card activity-card">
                <div className="sidebar-card-header">
                  <span className="activity-pulse"></span>
                  <h3>Live Activity</h3>
                </div>
                <div className="activity-stats">
                  <div className="activity-stat">
                    <span className="stat-value">{articles.length}</span>
                    <span className="stat-label">Stories Today</span>
                  </div>
                  <div className="activity-stat">
                    <span className="stat-value">{Math.floor(Math.random() * 5000) + 1000}</span>
                    <span className="stat-label">Active Readers</span>
                  </div>
                </div>
                <div className="activity-indicator">
                  <span className="activity-dot"></span>
                  <span className="activity-text">
                    {Math.floor(Math.random() * 50) + 10} people reading now
                  </span>
                </div>
              </div>*/}
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}

// Story Card Component
function StoryCard({ 
  article, 
  locale, 
  variant,
  getHeroImage,
  getSummary,
  getReadTime,
  timeAgo
}: { 
  article: Article; 
  locale: string;
  variant: 'large' | 'standard';
  getHeroImage: (a: Article) => string | null;
  getSummary: (a: Article, len?: number) => string;
  getReadTime: (a: Article) => string;
  timeAgo: (d: string | undefined) => string;
}) {
  const author = article.author?.[0];
  const category = article.category?.[0];
  const heroImage = getHeroImage(article);

  return (
    <Link 
      href={`/${locale}/news/${article.uid}`}
      className={`story-card story-card-${variant}`}
    >
      <div className="story-card-image">
        <img 
          src={heroImage || 'https://via.placeholder.com/400x280?text=News'} 
          alt={article.title}
        />
        <div className="story-card-overlay">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
        {category && (
          <span className="story-card-category">{category.title || category.name}</span>
        )}
      </div>
      <div className="story-card-content">
        <h3 
          className="story-card-title"
          {...getEditTagProps(article, 'headline', 'news_article', locale)}
        >
          {article.headline || article.title}
        </h3>
        {variant === 'large' && (
          <p 
            className="story-card-summary"
            {...getEditTagProps(article, 'description', 'news_article', locale)}
          >
            {getSummary(article)}
          </p>
        )}
        <div className="story-card-footer">
          {author && (
            <div className="story-card-author">
              {author.profile_image?.url ? (
                <img src={author.profile_image.url} alt="" />
              ) : (
                <span className="author-initial">
                  {(author.name || author.title || 'S').charAt(0)}
                </span>
              )}
              <span>{author.name || author.title}</span>
            </div>
          )}
          <div className="story-card-meta">
            <span>{timeAgo(article.published_date)}</span>
            <span className="meta-separator">•</span>
            <span>{getReadTime(article)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

