"use client";

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface UserMenuProps {
  onLoginClick: () => void;
  onSubscribeClick?: () => void;
  locale?: string;
}

export default function UserMenu({ onLoginClick, onSubscribeClick, locale = 'en-us' }: UserMenuProps) {
  const { user, profile, subscription, signOut, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className="user-menu-skeleton">
        <div className="skeleton-avatar" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-buttons">
        <button className="auth-btn login" onClick={onLoginClick}>
          Sign In
        </button>
        <button className="auth-btn signup" onClick={onLoginClick}>
          Get Started
        </button>
      </div>
    );
  }

  return (
    <div className="user-menu" ref={menuRef}>
      <button className="user-menu-trigger" onClick={() => setIsOpen(!isOpen)}>
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.name} className="user-avatar" />
        ) : (
          <div className="user-avatar-placeholder">
            {profile?.name?.charAt(0) || user.email?.charAt(0) || 'U'}
          </div>
        )}
        <span className="user-name">{profile?.name || user.email?.split('@')[0]}</span>
        <svg 
          className={`dropdown-arrow ${isOpen ? 'open' : ''}`} 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      {isOpen && (
        <div className="user-dropdown">
          <div className="dropdown-header">
            <div className="dropdown-user-info">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.name} className="dropdown-avatar" />
              ) : (
                <div className="dropdown-avatar-placeholder">
                  {profile?.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                </div>
              )}
              <div className="dropdown-user-details">
                <span className="dropdown-name">{profile?.name || 'User'}</span>
                <span className="dropdown-email">{user.email}</span>
              </div>
            </div>
            {subscription ? (
              <span className="subscription-badge premium">{subscription.plan}</span>
            ) : (
              <span className="subscription-badge free">Free</span>
            )}
          </div>

          <div className="dropdown-divider" />

          <nav className="dropdown-nav">
            <Link href={`/${locale}/profile`} className="dropdown-item" onClick={() => setIsOpen(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              My Profile
            </Link>
            <Link href={`/${locale}/profile/saved`} className="dropdown-item" onClick={() => setIsOpen(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
              Saved
            </Link>
            <Link href={`/${locale}/profile/following`} className="dropdown-item" onClick={() => setIsOpen(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Following
            </Link>
          </nav>

          <div className="dropdown-divider" />

          {!subscription && (
            <>
              <button className="dropdown-upgrade" onClick={() => { setIsOpen(false); onSubscribeClick?.(); }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
                Upgrade to Premium
              </button>
              <div className="dropdown-divider" />
            </>
          )}

          <button className="dropdown-item logout" onClick={handleSignOut}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

