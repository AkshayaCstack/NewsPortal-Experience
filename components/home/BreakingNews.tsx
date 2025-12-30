"use client";

import Link from "next/link";
import { useState } from "react";
import { timeAgo, formatDate, jsonRteToText } from "@/helper";

interface BreakingNewsProps {
  articles: any[];
  title?: string;
  locale?: string;
}

export default function BreakingNews({ articles, title, locale = 'en-us' }: BreakingNewsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!articles || articles.length === 0) return null;

  const currentArticle = articles[currentIndex];

  const getHeroImage = (article: any) => {
    if (!article?.group) return null;
    const heroGroup = article.group.find((g: any) => g.is_hero_image);
    return heroGroup?.image?.url || article.group[0]?.image?.url;
  };

  const getDescription = (article: any) => {
    let text = '';
    if (article.description) {
      text = typeof article.description === 'string' ? article.description : jsonRteToText(article.description);
    } else if (article.body) {
      text = typeof article.body === 'string' ? article.body : jsonRteToText(article.body);
    }
    text = text.replace(/<[^>]*>/g, '');
    return text;
  };

  const category = currentArticle.category?.[0] || currentArticle.category;
  const author = currentArticle.author?.[0] || currentArticle.author;
  const description = getDescription(currentArticle);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? articles.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === articles.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="breaking-wrapper">
      <div className="container">
        {/* Header - Just the Breaking Tag */}
        <div className="breaking-top">
          <span className="breaking-tag">
            <span className="dot"></span>
            {title || "Breaking"}
          </span>
          
          {/* Carousel Controls */}
          {articles.length > 1 && (
            <div className="carousel-controls">
              <span className="carousel-count">{currentIndex + 1} / {articles.length}</span>
              <button className="carousel-btn" onClick={goToPrev} aria-label="Previous">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
              </button>
              <button className="carousel-btn" onClick={goToNext} aria-label="Next">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Main Card */}
        <Link href={`/${locale}/news/${currentArticle.uid}`} className="breaking-main-card">
          {/* Left - Content */}
          <div className="breaking-left">
            <div className="card-meta">
              {author?.profile_image?.url && (
                <img src={author.profile_image.url} alt="" className="author-img" />
              )}
              <span className="author">{author?.name || author?.title}</span>
              <span className="sep">•</span>
              <span className="time">{timeAgo(currentArticle.published_date)}</span>
            </div>
            <h2 className="card-title">{currentArticle.title || currentArticle.headline}</h2>
            
            {description && (
              <p className="card-description">{description}</p>
            )}
            
            <p className="card-date">{formatDate(currentArticle.published_date)}</p>
          </div>

          {/* Right - Image */}
          <div className="breaking-right">
            <img 
              src={getHeroImage(currentArticle) || ''} 
              alt={currentArticle.title || currentArticle.headline}
            />
            {category && (
              <span className="cat-badge">{category.title || category.name}</span>
            )}
          </div>
        </Link>

        {/* Dot Indicators */}
        {articles.length > 1 && (
          <div className="carousel-dots">
            {articles.map((_, index) => (
              <button
                key={index}
                className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
