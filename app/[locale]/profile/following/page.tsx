"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'next/navigation';
import AuthModal from '@/components/auth/AuthModal';
import { supabase } from '@/lib/supabase';

interface FollowItem {
  id: string;
  user_id: string;
  target_type: string;
  target_entry_id: string;
  created_at: string;
}

interface ContentDetails {
  title: string;
  image?: string;
  slug?: string;
}

const targetTypeConfig: Record<string, { label: string; icon: string; color: string; path: string }> = {
  author: { label: 'Authors', icon: '👤', color: '#a78bfa', path: 'author' },
  category: { label: 'Categories', icon: '📁', color: '#3b82f6', path: 'category' },
};

export default function FollowingPage() {
  const { user, loading: authLoading } = useAuth();
  const [followItems, setFollowItems] = useState<FollowItem[]>([]);
  const [contentDetails, setContentDetails] = useState<Record<string, ContentDetails>>({});
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const params = useParams();
  const locale = (params.locale as string) || 'en-us';

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      setLoading(false);
      return;
    }

    fetchFollowing();
  }, [user, authLoading]);

  const fetchFollowing = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const items = data || [];
      setFollowItems(items);

      // Fetch actual content details from CMS
      if (items.length > 0) {
        const detailsRes = await fetch('/api/content-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: items.map((item: FollowItem) => ({
              content_type: item.target_type,
              entry_uid: item.target_entry_id
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
              title: typedInfo.title,
              image: typedInfo.image,
              slug: typedInfo.slug
            };
          }
          setContentDetails(details);
        }
      }
    } catch (error) {
      console.error('Error fetching following:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (item: FollowItem) => {
    if (!user) return;

    // Optimistic update
    setFollowItems(prev => prev.filter(i => i.id !== item.id));

    try {
      await supabase
        .from('follows')
        .delete()
        .eq('id', item.id);
    } catch (error) {
      // Revert on error
      fetchFollowing();
      console.error('Error unfollowing:', error);
    }
  };

  const getContentLink = (item: FollowItem) => {
    const config = targetTypeConfig[item.target_type];
    if (!config) return '#';
    return `/${locale}/${config.path}/${item.target_entry_id}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'ta-in' ? 'ta-IN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Group items by target type
  const groupedItems = followItems.reduce((acc, item) => {
    const type = item.target_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {} as Record<string, FollowItem[]>);

  const filteredItems = activeFilter 
    ? followItems.filter(item => item.target_type === activeFilter)
    : followItems;

  // Get type counts
  const typeCounts = Object.entries(groupedItems).map(([type, items]) => ({
    type,
    count: items.length,
    config: targetTypeConfig[type]
  }));

  if (authLoading || loading) {
    return (
      <main className="following-page">
        <div className="container">
          <div className="following-loading">
            <div className="loading-spinner"></div>
            <p>Loading your following...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="following-page">
        <div className="container">
          <div className="following-auth-required">
            <div className="auth-required-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <h1>Sign in to view who you follow</h1>
            <p>Follow your favorite authors and categories to get personalized content.</p>
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
    <main className="following-page">
      <div className="container">
        {/* Page Header */}
        <header className="following-header">
          <div className="following-header-content">
            <h1>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Following
            </h1>
            <p>{followItems.length} {followItems.length === 1 ? 'follow' : 'follows'}</p>
          </div>
        </header>

        {followItems.length === 0 ? (
          <div className="following-empty">
            <div className="following-empty-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <h2>Not following anyone yet</h2>
            <p>Follow authors and categories to see their content in your feed.</p>
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
            <div className="following-filters">
              <button 
                className={`filter-tab ${activeFilter === null ? 'active' : ''}`}
                onClick={() => setActiveFilter(null)}
              >
                All
                <span className="filter-count">{followItems.length}</span>
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

            {/* Following Items List */}
            <div className="following-items-list">
              {filteredItems.map((item) => {
                const config = targetTypeConfig[item.target_type];
                const details = contentDetails[item.target_entry_id];
                
                return (
                  <div key={item.id} className="following-item-card">
                    <Link href={getContentLink(item)} className="following-item-link">
                      <div 
                        className="following-item-avatar"
                        style={{ backgroundColor: `${config?.color}20` }}
                      >
                        {details?.image ? (
                          <img 
                            src={details.image} 
                            alt={details.title || ''} 
                            className="avatar-img"
                          />
                        ) : (
                          <span className="avatar-icon">{config?.icon}</span>
                        )}
                      </div>
                      <div className="following-item-content">
                        <span 
                          className="following-item-type"
                          style={{ color: config?.color }}
                        >
                          {config?.label?.slice(0, -1) || item.target_type}
                        </span>
                        <h3 className="following-item-name">
                          {details?.title || 'Loading...'}
                        </h3>
                        <span className="following-item-date">
                          Following since {formatDate(item.created_at)}
                        </span>
                      </div>
                    </Link>
                    <button 
                      className="unfollow-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        handleUnfollow(item);
                      }}
                    >
                      Following
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

