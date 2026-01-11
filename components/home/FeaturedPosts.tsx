"use client";

import Link from "next/link";
import { useRef } from "react";
import { timeAgo } from "@/helper";
import { getEditTagProps } from "@/lib/editTags";
import ScrollReveal from "@/components/ui/ScrollReveal";

interface FeaturedPostsProps {
  videos: any[];
  podcasts: any[];
  magazines: any[];
  locale: string;
  title?: string;
  description?: string;
}

export default function FeaturedPosts({ videos, podcasts, magazines, locale, title, description }: FeaturedPostsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Combine and sort all featured content by date - show more items
  const allFeatured = [
    ...videos.map((v: any) => ({
      ...v,
      contentType: 'video',
      image: v.thumbnail?.url || (v.youtube_url ? `https://img.youtube.com/vi/${getYouTubeId(v.youtube_url)}/hqdefault.jpg` : null),
      date: v.published_date || v.created_at,
    })),
    ...podcasts.map((p: any) => ({
      ...p,
      contentType: 'podcast',
      image: p.cover_image?.url,
      date: p.published_date || p.created_at,
    })),
    ...magazines.map((m: any) => ({
      ...m,
      contentType: 'magazine',
      image: m.cover_image?.url,
      date: m.date || m.created_at,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320; // Approximate card width + gap
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const getContentLink = (post: any) => {
    if (post.contentType === 'video') return `/${locale}/videos`;
    if (post.contentType === 'podcast') return `/${locale}/podcasts/${post.uid}`;
    if (post.contentType === 'magazine') return `/${locale}/magazine/${post.uid}`;
    return '#';
  };

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'video':
        return (
          <div className="content-type-icon video">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>
        );
      case 'podcast':
        return (
          <div className="content-type-icon podcast">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </div>
        );
      case 'magazine':
        return (
          <div className="content-type-icon magazine">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  if (allFeatured.length === 0) return null;

  return (
    <ScrollReveal direction="up" delay={100}>
      <section className="featured-posts-section">
        <div className="container" id="featured-posts-section-unique">
          <div className="section-header-bar">
            <div className="section-header-text">
              <h2 className="section-label">
                <span className="label-accent"></span>
                {title || 'FEATURED POSTS'}
              </h2>
              {description && <p className="section-description">{description}</p>}
            </div>
            <div className="featured-nav-controls">
              <span className="featured-count">{allFeatured.length} items</span>
              <button 
                className="featured-nav-btn" 
                onClick={() => scroll('left')}
                aria-label="Scroll left"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <button 
                className="featured-nav-btn" 
                onClick={() => scroll('right')}
                aria-label="Scroll right"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="featured-posts-scroll-wrapper">
            <div className="featured-posts-scroll" ref={scrollRef}>
              {allFeatured.map((post: any, index: number) => {
                const category = post.category?.[0] || post.category;
                
                return (
                  <Link 
                    key={post.uid || index} 
                    href={getContentLink(post)}
                    className="featured-post-card"
                  >
                    <div className="featured-post-image">
                      <img 
                        src={post.image || 'https://via.placeholder.com/300x200'} 
                        alt={post.title} 
                      />
                      {/* Content type icon overlay */}
                      {getContentTypeIcon(post.contentType)}
                    </div>
                    <div className="featured-post-content">
                      <div className="featured-post-badges">
                        {category && (
                          <span className="category-badge">{category.title || category.name}</span>
                        )}
                      </div>
                      <h3 
                        className="featured-post-title"
                        {...getEditTagProps(post, 'title', post.contentType === 'video' ? 'videos' : post.contentType, locale)}
                      >
                        {post.title}
                      </h3>
                      <span className="featured-post-date">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M12 6v6l4 2"/>
                        </svg>
                        {timeAgo(post.date, locale)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
}

function getYouTubeId(url: string) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}
