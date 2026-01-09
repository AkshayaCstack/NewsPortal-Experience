"use client";

import { useState } from 'react';
import Link from 'next/link';
import { getEditTagProps } from '@/lib/editTags';

interface Article {
  uid: string;
  title: string;
  body?: any;
  description?: any;
  published_date?: string;
  is_featured?: boolean;
  group?: any[];
  author?: any[];
  category?: any[];
}

interface Category {
  uid: string;
  title?: string;
  name?: string;
}

interface ExploreContentProps {
  articles: Article[];
  categories: Category[];
  trendingArticles: Article[];
  locale: string;
}

export default function ExploreContent({ 
  articles, 
  categories, 
  trendingArticles,
  locale 
}: ExploreContentProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const getHeroImage = (article: Article) => {
    if (!article?.group) return null;
    const heroGroup = article.group.find((g: any) => g.is_hero_image);
    return heroGroup?.image?.url || article.group[0]?.image?.url;
  };

  const getSummary = (article: Article, maxLength = 100) => {
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
    return `${minutes} min read`;
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
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Filter articles based on category and search
  const filterArticles = (articleList: Article[]) => {
    let filtered = articleList;
    
    if (activeCategory) {
      filtered = filtered.filter(article => 
        article.category?.some((cat: any) => cat.uid === activeCategory)
      );
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(article =>
        article.title?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  const filteredTrending = filterArticles(trendingArticles);
  const trendingUids = trendingArticles?.map(a => a.uid) || [];
  const latestArticles = articles?.filter(a => !trendingUids.includes(a.uid)) || [];
  const filteredLatest = filterArticles(latestArticles);

  const getCategoryName = (uid: string) => {
    const cat = categories.find(c => c.uid === uid);
    return cat?.title || cat?.name || '';
  };

  return (
    <>
      {/* Header */}
      <section className="explore-header">
        <div className="container">
          <h1 className="explore-title">Explore</h1>
          
          {/* Search Bar */}
          <div className="explore-search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search articles..." 
              className="explore-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                className="explore-clear-btn"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Category Pills */}
      {categories && categories.length > 0 && (
        <section className="explore-categories">
          <div className="container">
            <div className="category-pills-scroll">
              <button 
                className={`category-pill ${!activeCategory ? 'active' : ''}`}
                onClick={() => setActiveCategory(null)}
              >
                All
              </button>
              {categories.map((cat) => (
                <button 
                  key={cat.uid}
                  className={`category-pill ${activeCategory === cat.uid ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.uid)}
                >
                  {cat.title || cat.name}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Active Filter Indicator */}
      {activeCategory && (
        <section className="filter-indicator">
          <div className="container">
            <div className="filter-tag">
              Showing: <strong>{getCategoryName(activeCategory)}</strong>
              <button onClick={() => setActiveCategory(null)} className="clear-filter">✕</button>
            </div>
          </div>
        </section>
      )}

      {/* Trending Section */}
      {filteredTrending.length > 0 && (
        <section className="trending-section">
          <div className="container">
            <div className="trending-header">
              <span className="trending-icon">🔥</span>
              <h2>Trending {activeCategory ? `in ${getCategoryName(activeCategory)}` : 'on NewzHub'}</h2>
            </div>
            
            <div className="article-list">
              {filteredTrending.slice(0, 6).map((article, index) => {
                const author = article.author?.[0];
                const heroImage = getHeroImage(article);
                
                return (
                  <Link key={article.uid} href={`/${locale}/news/${article.uid}`} className="article-list-item">
                    <div className="article-list-rank">
                      <span className="rank-number">{index + 1}</span>
                    </div>
                    <div className="article-list-image">
                      <img 
                        src={heroImage || 'https://via.placeholder.com/120x80/1a1a2e/a78bfa?text=News'} 
                        alt={article.title} 
                      />
                    </div>
                    <div className="article-list-content">
                      <h3 
                        className="article-list-title"
                        {...getEditTagProps(article, 'title', 'news_article', locale)}
                      >
                        {article.title}
                      </h3>
                      <p 
                        className="article-list-summary"
                        {...getEditTagProps(article, 'description', 'news_article', locale)}
                      >
                        {getSummary(article)}
                      </p>
                      <div className="article-list-meta">
                        <div className="article-list-author">
                          {author?.profile_image?.url ? (
                            <img src={author.profile_image.url} alt={author.name} className="author-avatar-tiny" />
                          ) : (
                            <div className="author-avatar-tiny-placeholder">
                              {(author?.name || author?.title || 'S').charAt(0)}
                            </div>
                          )}
                          <span>{author?.name || author?.title || 'Staff'}</span>
                        </div>
                        <span className="meta-dot">•</span>
                        <span>{getReadTime(article)}</span>
                        <span className="meta-dot">•</span>
                        <span>{timeAgo(article.published_date)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Latest Articles Section */}
      {filteredLatest.length > 0 && (
        <section className="latest-section">
          <div className="container">
            <div className="section-header-simple">
              <h2>Latest {activeCategory ? `in ${getCategoryName(activeCategory)}` : 'Articles'}</h2>
            </div>
            
            <div className="article-list">
              {filteredLatest.map((article, index) => {
                const author = article.author?.[0];
                const category = article.category?.[0];
                const heroImage = getHeroImage(article);
                
                return (
                  <Link key={article.uid} href={`/${locale}/news/${article.uid}`} className="article-list-item">
                    <div className="article-list-rank">
                      <span className="rank-number">{index + 1}</span>
                    </div>
                    <div className="article-list-image">
                      <img 
                        src={heroImage || 'https://via.placeholder.com/120x80/1a1a2e/a78bfa?text=News'} 
                        alt={article.title} 
                      />
                    </div>
                    <div className="article-list-content">
                      {category && !activeCategory && (
                        <span className="article-list-category">{category.title || category.name}</span>
                      )}
                      <h3 
                        className="article-list-title"
                        {...getEditTagProps(article, 'title', 'news_article', locale)}
                      >
                        {article.title}
                      </h3>
                      <p 
                        className="article-list-summary"
                        {...getEditTagProps(article, 'description', 'news_article', locale)}
                      >
                        {getSummary(article)}
                      </p>
                      <div className="article-list-meta">
                        <div className="article-list-author">
                          {author?.profile_image?.url ? (
                            <img src={author.profile_image.url} alt={author.title} className="author-avatar-tiny" />
                          ) : (
                            <div className="author-avatar-tiny-placeholder">
                              {(author?.name || author?.title || 'S').charAt(0)}
                            </div>
                          )}
                          <span>{author?.name || author?.title || 'Staff'}</span>
                        </div>
                        <span className="meta-dot">•</span>
                        <span>{getReadTime(article)}</span>
                        <span className="meta-dot">•</span>
                        <span>{timeAgo(article.published_date)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Empty State */}
      {filteredTrending.length === 0 && filteredLatest.length === 0 && (
        <section className="empty-section">
          <div className="container">
            <div className="empty-state-centered">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <h3>No Articles Found</h3>
              <p>
                {activeCategory 
                  ? `No articles in ${getCategoryName(activeCategory)} yet.`
                  : searchQuery 
                    ? `No results for "${searchQuery}"`
                    : 'Check back later for new stories.'
                }
              </p>
              {(activeCategory || searchQuery) && (
                <button 
                  className="reset-filters-btn"
                  onClick={() => {
                    setActiveCategory(null);
                    setSearchQuery('');
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

