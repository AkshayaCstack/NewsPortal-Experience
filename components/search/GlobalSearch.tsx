"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { InstantSearch, SearchBox, Hits, Configure, useSearchBox } from 'react-instantsearch';
import { searchClient, ALGOLIA_INDEX_NAME } from '@/lib/algolia';

// Content type labels and icons
const contentTypeConfig: Record<string, { label: string; icon: string; color: string }> = {
  news_article: { label: 'News', icon: '📰', color: '#a78bfa' },
  article: { label: 'News', icon: '📰', color: '#a78bfa' },
  live_blog: { label: 'Live Blog', icon: '🔴', color: '#ef4444' },
  magazine: { label: 'Magazine', icon: '📖', color: '#f59e0b' },
  podcast: { label: 'Podcast', icon: '🎙️', color: '#10b981' },
  podcast_episode: { label: 'Podcast', icon: '🎙️', color: '#10b981' },
  videos: { label: 'Video', icon: '🎬', color: '#3b82f6' },
  video: { label: 'Video', icon: '🎬', color: '#3b82f6' },
};

function getUrl(hit: any, locale: string) {
  const contentType = hit.content_type?.toLowerCase();
  
  switch (contentType) {
    case 'news_article':
    case 'article':
      return `/${locale}/news/${hit.entry_uid}`;
    case 'live_blog':
      return `/${locale}/live-blogs/${hit.entry_uid}`;
    case 'magazine':
      return `/${locale}/magazine/${hit.entry_uid}`;
    case 'podcast':
    case 'podcast_episode':
      return `/${locale}/podcasts/${hit.entry_uid}`;
    case 'videos':
    case 'video':
      return `/${locale}/videos`;
    default:
      return `/${locale}`;
  }
}

function formatDate(dateString: string | undefined) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface HitProps {
  hit: any;
  locale: string;
  onHitClick: () => void;
}

function Hit({ hit, locale, onHitClick }: HitProps) {
  const config = contentTypeConfig[hit.content_type?.toLowerCase()] || { 
    label: hit.content_type || 'Content', 
    icon: '📄', 
    color: '#a78bfa' 
  };

  return (
    <Link 
      href={getUrl(hit, locale)} 
      className="search-hit"
      onClick={onHitClick}
    >
      <div className="search-hit-icon" style={{ background: config.color }}>
        <span>{config.icon}</span>
      </div>
      <div className="search-hit-content">
        <span className="search-hit-type" style={{ color: config.color }}>
          {config.label}
          {hit.is_featured && <span className="search-hit-featured">Featured</span>}
        </span>
        <h4 className="search-hit-title">{hit.title}</h4>
        {hit.published_date && (
          <span className="search-hit-date">{formatDate(hit.published_date)}</span>
        )}
      </div>
      <svg className="search-hit-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m9 18 6-6-6-6"/>
      </svg>
    </Link>
  );
}

// Custom search input that tracks query state
function CustomSearchBox({ onQueryChange }: { onQueryChange: (query: string) => void }) {
  const { query, refine } = useSearchBox();
  
  useEffect(() => {
    onQueryChange(query);
  }, [query, onQueryChange]);

  return (
    <div className="search-input-wrapper">
      <svg className="search-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        type="text"
        value={query}
        onChange={(e) => refine(e.target.value)}
        placeholder="Search news, podcasts, videos..."
        className="search-input"
        autoFocus
      />
      {query && (
        <button 
          className="search-clear-btn"
          onClick={() => refine('')}
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      )}
    </div>
  );
}

// Hits wrapper component
function HitsWrapper({ locale, onHitClick, hasQuery }: { locale: string; onHitClick: () => void; hasQuery: boolean }) {
  if (!hasQuery) {
    return (
      <div className="search-empty-state">
        <div className="search-suggestions">
          <p>Try searching for:</p>
          <div className="search-suggestion-tags">
            <span>Politics</span>
            <span>Technology</span>
            <span>Sports</span>
            <span>World</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Hits 
      hitComponent={({ hit }) => (
        <Hit hit={hit} locale={locale} onHitClick={onHitClick} />
      )} 
    />
  );
}

interface GlobalSearchProps {
  locale: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ locale, isOpen, onClose }: GlobalSearchProps) {
  const [hasQuery, setHasQuery] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Close on click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="search-modal-backdrop" onClick={handleBackdropClick}>
      <div className="search-modal" ref={modalRef}>
        <InstantSearch searchClient={searchClient} indexName={ALGOLIA_INDEX_NAME}>
          <Configure filters={`locale:${locale}`} hitsPerPage={10} />
          
          <div className="search-modal-header">
            <CustomSearchBox onQueryChange={(q) => setHasQuery(q.length > 0)} />
            <button className="search-close-btn" onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="search-modal-body">
            <HitsWrapper locale={locale} onHitClick={onClose} hasQuery={hasQuery} />
          </div>

          <div className="search-modal-footer">
            <span className="search-shortcut">
              <kbd>ESC</kbd> to close
            </span>
            <span className="search-powered">
              Powered by <strong>Algolia</strong>
            </span>
          </div>
        </InstantSearch>
      </div>
    </div>
  );
}

// Search trigger button for header
export function SearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button className="search-trigger" onClick={onClick} aria-label="Search">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
    </button>
  );
}

