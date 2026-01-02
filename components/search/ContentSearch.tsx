"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { InstantSearch, Configure, useSearchBox, useHits } from 'react-instantsearch';
import { searchClient, ALGOLIA_INDEX_NAME } from '@/lib/algolia';

// Content type config
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

interface ContentSearchProps {
  locale: string;
  contentType?: string; // Filter to specific content type
  placeholder?: string;
}

function SearchResults({ locale, onClose }: { locale: string; onClose: () => void }) {
  const { hits } = useHits();
  
  if (hits.length === 0) {
    return (
      <div className="inline-search-empty">
        <p>No results found</p>
      </div>
    );
  }
  
  return (
    <div className="inline-search-results">
      {hits.slice(0, 6).map((hit: any) => {
        const config = contentTypeConfig[hit.content_type?.toLowerCase()] || { 
          label: 'Content', icon: '📄', color: '#a78bfa' 
        };
        
        return (
          <Link 
            key={hit.objectID} 
            href={getUrl(hit, locale)} 
            className="inline-search-hit"
            onClick={onClose}
          >
            <span className="inline-hit-icon" style={{ color: config.color }}>{config.icon}</span>
            <div className="inline-hit-content">
              <span className="inline-hit-type" style={{ color: config.color }}>{config.label}</span>
              <h4>{hit.title}</h4>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function SearchInput({ 
  placeholder, 
  onFocus, 
  onBlur 
}: { 
  placeholder: string; 
  onFocus: () => void; 
  onBlur: () => void;
}) {
  const { query, refine } = useSearchBox();
  
  return (
    <div className="content-search-input-wrapper">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        type="text"
        value={query}
        onChange={(e) => refine(e.target.value)}
        placeholder={placeholder}
        className="content-search-input"
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {query && (
        <button 
          className="content-search-clear"
          onClick={() => refine('')}
          type="button"
        >
          ✕
        </button>
      )}
    </div>
  );
}

function SearchContent({ 
  locale, 
  contentType, 
  placeholder,
  isOpen,
  setIsOpen 
}: { 
  locale: string; 
  contentType?: string; 
  placeholder: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  const { query } = useSearchBox();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsOpen]);
  
  const showResults = isOpen && query.length > 0;
  
  return (
    <div className="content-search-container" ref={containerRef}>
      <SearchInput 
        placeholder={placeholder}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {}}
      />
      {showResults && (
        <SearchResults locale={locale} onClose={() => setIsOpen(false)} />
      )}
    </div>
  );
}

export default function ContentSearch({ locale, contentType, placeholder = "Search..." }: ContentSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Build filter string
  let filters = `locale:${locale}`;
  if (contentType) {
    filters += ` AND content_type:${contentType}`;
  }
  
  return (
    <InstantSearch searchClient={searchClient} indexName={ALGOLIA_INDEX_NAME}>
      <Configure filters={filters} hitsPerPage={6} />
      <SearchContent 
        locale={locale} 
        contentType={contentType} 
        placeholder={placeholder}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />
    </InstantSearch>
  );
}

