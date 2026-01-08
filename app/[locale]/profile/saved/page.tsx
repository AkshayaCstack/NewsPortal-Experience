"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import AuthModal from '@/components/auth/AuthModal';

interface SavedItem {
  id: string;
  user_id: string;
  content_type_uid: string;
  entry_uid: string;
  created_at: string;
}

interface ContentDetails {
  uid: string;
  title: string;
  image?: string;
  slug?: string;
}

const contentTypeConfig: Record<string, { label: string; icon: string; color: string; path: string }> = {
  article: { label: 'Articles', icon: '📰', color: '#3b82f6', path: 'news' },
  news_article: { label: 'Articles', icon: '📰', color: '#3b82f6', path: 'news' },
  video: { label: 'Videos', icon: '🎬', color: '#ef4444', path: 'videos' },
  podcast: { label: 'Podcasts', icon: '🎙️', color: '#a78bfa', path: 'podcasts' },
  magazine: { label: 'Magazines', icon: '📖', color: '#f59e0b', path: 'magazine' },
  live_blog: { label: 'Live Blogs', icon: '⚡', color: '#10b981', path: 'live-blogs' },
};

export default function SavedPage() {
  const { user, loading: authLoading } = useAuth();
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [contentDetails, setContentDetails] = useState<Record<string, ContentDetails>>({});
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const params = useParams();
  const router = useRouter();
  const locale = (params.locale as string) || 'en-us';

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      setLoading(false);
      return;
    }

    fetchSavedItems();
  }, [user, authLoading]);

  const fetchSavedItems = async () => {
    if (!user) return;

    try {
      const res = await fetch('/api/saves', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });

      const data = await res.json();
      const items = data.items || [];
      setSavedItems(items);

      // Fetch actual content details from CMS
      if (items.length > 0) {
        const detailsRes = await fetch('/api/content-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: items.map((item: SavedItem) => ({
              content_type: item.content_type_uid,
              entry_uid: item.entry_uid
            })),
            locale
          })
        });

        const detailsData = await detailsRes.json();
        if (detailsData.details) {
      const details: Record<string, ContentDetails> = {};
          for (const [uid, info] of Object.entries(detailsData.details)) {
            const typedInfo = info as { title: string; image?: string; slug?: string };
            details[uid] = {
              uid,
              title: typedInfo.title,
              image: typedInfo.image,
              slug: typedInfo.slug
        };
      }
      setContentDetails(details);
        }
      }
    } catch (error) {
      console.error('Error fetching saved items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (item: SavedItem) => {
    if (!user) return;

    // Optimistic update
    setSavedItems(prev => prev.filter(i => i.id !== item.id));

    try {
      await fetch('/api/saves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          content_type_uid: item.content_type_uid,
          entry_uid: item.entry_uid
        })
      });
    } catch (error) {
      // Revert on error
      fetchSavedItems();
      console.error('Error unsaving item:', error);
    }
  };

  const getContentLink = (item: SavedItem) => {
    const config = contentTypeConfig[item.content_type_uid];
    if (!config) return '#';
    // Use slug from content details if available
    const slug = contentDetails[item.entry_uid]?.slug || item.entry_uid;
    return `/${locale}/${config.path}/${slug}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'ta-in' ? 'ta-IN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Group saved items by content type
  const groupedItems = savedItems.reduce((acc, item) => {
    const type = item.content_type_uid;
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {} as Record<string, SavedItem[]>);

  const filteredItems = activeFilter 
    ? savedItems.filter(item => item.content_type_uid === activeFilter)
    : savedItems;

  // Get content type counts
  const typeCounts = Object.entries(groupedItems).map(([type, items]) => ({
    type,
    count: items.length,
    config: contentTypeConfig[type]
  }));

  if (authLoading || loading) {
    return (
      <main className="saved-page">
        <div className="container">
          <div className="saved-loading">
            <div className="loading-spinner"></div>
            <p>Loading your saved items...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="saved-page">
        <div className="container">
          <div className="saved-auth-required">
            <div className="auth-required-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h1>Sign in to view your saved items</h1>
            <p>Save articles, videos, podcasts, and more to access them anytime.</p>
            <button 
              className="sign-in-btn"
              onClick={() => setShowAuthModal(true)}
            >
              Sign In
            </button>
          </div>
        </div>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </main>
    );
  }

  return (
    <main className="saved-page">
      <div className="container">
        {/* Page Header */}
        <header className="saved-header">
          <div className="saved-header-content">
            <h1>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
              Saved
            </h1>
            <p>{savedItems.length} item{savedItems.length !== 1 ? 's' : ''} saved</p>
          </div>
        </header>

        {savedItems.length === 0 ? (
          <div className="saved-empty">
            <div className="saved-empty-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h2>No saved items yet</h2>
            <p>Start exploring and save articles, videos, podcasts, and more for later.</p>
            <Link href={`/${locale}`} className="explore-btn">
              Explore Content
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        ) : (
          <>
            {/* Filter Tabs */}
            <div className="saved-filters">
              <button 
                className={`filter-tab ${activeFilter === null ? 'active' : ''}`}
                onClick={() => setActiveFilter(null)}
              >
                All
                <span className="filter-count">{savedItems.length}</span>
              </button>
              {typeCounts.map(({ type, count, config }) => (
                <button 
                  key={type}
                  className={`filter-tab ${activeFilter === type ? 'active' : ''}`}
                  onClick={() => setActiveFilter(type)}
                  style={{ '--filter-color': config?.color } as React.CSSProperties}
                >
                  <span className="filter-icon">{config?.icon}</span>
                  {config?.label || type}
                  <span className="filter-count">{count}</span>
                </button>
              ))}
            </div>

            {/* Saved Items Grid */}
            <div className="saved-items-grid">
              {filteredItems.map((item) => {
                const config = contentTypeConfig[item.content_type_uid];
                const details = contentDetails[item.entry_uid];
                
                return (
                  <div key={item.id} className="saved-item-card">
                    <Link href={getContentLink(item)} className="saved-item-link">
                      <div className="saved-item-image">
                        {details?.image ? (
                          <img 
                            src={details.image} 
                            alt={details.title || ''} 
                            className="saved-item-img"
                          />
                        ) : (
                        <div 
                          className="saved-item-placeholder"
                          style={{ backgroundColor: `${config?.color}20` }}
                        >
                          <span className="placeholder-icon">{config?.icon}</span>
                        </div>
                        )}
                        <span 
                          className="saved-item-type"
                          style={{ backgroundColor: config?.color }}
                        >
                          {config?.label || item.content_type_uid}
                        </span>
                      </div>
                      <div className="saved-item-content">
                        <h3 className="saved-item-title">
                          {details?.title || 'Loading...'}
                        </h3>
                        <span className="saved-item-date">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                          </svg>
                          Saved {formatDate(item.created_at)}
                        </span>
                      </div>
                    </Link>
                    <button 
                      className="unsave-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        handleUnsave(item);
                      }}
                      title="Remove from saved"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

