"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useCallback } from "react";
import { timeAgo } from "@/helper";
import { getEditTagProps } from "@/lib/editTags";

interface LatestPopularSidebarProps {
  latestArticles: any[];
  popularArticles: any[];
  locale: string;
  latestTitle?: string;
  latestDescription?: string;
  popularTitle?: string;
  popularDescription?: string;
}

export default function LatestPopularSidebar({ 
  latestArticles, 
  popularArticles, 
  locale,
  latestTitle,
  latestDescription,
  popularTitle,
  popularDescription
}: LatestPopularSidebarProps) {
  const [activeTab, setActiveTab] = useState<'latest' | 'popular'>('latest');
  const [visibleCount, setVisibleCount] = useState(10); // Show more initially
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const articles = activeTab === 'latest' ? latestArticles : popularArticles;

  // Reset visible count when tab changes
  useEffect(() => {
    setVisibleCount(10);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    
    // Load more when near bottom (within 100px)
    if (scrollHeight - scrollTop - clientHeight < 100) {
      setVisibleCount(prev => Math.min(prev + 10, articles.length));
    }
  }, [articles.length]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const getHeroImage = (article: any) => {
    if (!article?.group) return null;
    const heroGroup = article.group.find((g: any) => g.is_hero_image);
    return heroGroup?.image?.url || article.group[0]?.image?.url;
  };

  return (
    <aside className="latest-popular-sidebar">
      {/* Tabs */}
      <div className="sidebar-tabs">
        <button 
          className={`sidebar-tab ${activeTab === 'latest' ? 'active' : ''}`}
          onClick={() => setActiveTab('latest')}
          title={latestDescription || undefined}
        >
          <span className="tab-indicator"></span>
          {latestTitle || 'LATEST'}
        </button>
        <button 
          className={`sidebar-tab ${activeTab === 'popular' ? 'active' : ''}`}
          onClick={() => setActiveTab('popular')}
          title={popularDescription || undefined}
        >
          <span className="tab-indicator"></span>
          {popularTitle || 'POPULAR'}
        </button>
      </div>

      {/* Scrollable Articles List */}
      <div className="sidebar-posts" ref={scrollContainerRef}>
        {articles.slice(0, visibleCount).map((article: any, index: number) => {
          const heroImage = getHeroImage(article);
          const category = article.category?.[0] || article.category;
          
          return (
            <Link 
              key={article.uid || index} 
              href={`/${locale}/news/${article.uid}`}
              className="sidebar-post-item"
            >
              <div className="sidebar-post-image">
                <img 
                  src={heroImage || 'https://via.placeholder.com/80x60'} 
                  alt={article.title} 
                />
              </div>
              <div className="sidebar-post-content">
                <h4 
                  className="sidebar-post-title"
                  {...getEditTagProps(article, 'title', 'news_article', locale)}
                >
                  {article.title}
                </h4>
                <span className="sidebar-post-date">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                  {timeAgo(article.published_date, locale)}
                </span>
              </div>
            </Link>
          );
        })}
        
        {/* Loading indicator */}
        {visibleCount < articles.length && (
          <div className="sidebar-load-more">
            <span>Scroll for more...</span>
          </div>
        )}
      </div>
    </aside>
  );
}
