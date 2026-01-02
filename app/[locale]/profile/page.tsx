"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'next/navigation';
import AuthModal from '@/components/auth/AuthModal';
import { supabase } from '@/lib/supabase';

export default function ProfilePage() {
  const { user, profile, subscription, loading: authLoading, refreshProfile } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ saved: 0, following: 0, likes: 0 });
  const params = useParams();
  const locale = (params.locale as string) || 'en-us';

  useEffect(() => {
    if (profile?.name) {
      setName(profile.name);
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      const [savedRes, followingRes, likesRes] = await Promise.all([
        supabase.from('saved_items').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('follows').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('likes').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      ]);

      setStats({
        saved: savedRes.count || 0,
        following: followingRes.count || 0,
        likes: likesRes.count || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !name.trim()) return;

    setSaving(true);
    try {
      await supabase
        .from('profiles')
        .update({ name: name.trim() })
        .eq('id', user.id);

      await refreshProfile();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <main className="profile-page">
        <div className="container">
          <div className="profile-loading">
            <div className="loading-spinner"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="profile-page">
        <div className="container">
          <div className="profile-auth-required">
            <div className="auth-required-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <h1>Sign in to view your profile</h1>
            <p>Access your profile, saved items, and personalized content.</p>
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
    <main className="profile-page">
      <div className="container">
        {/* Profile Header */}
        <header className="profile-header">
          <div className="profile-avatar-section">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name} className="profile-avatar-large" />
            ) : (
              <div className="profile-avatar-placeholder-large">
                {profile?.name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          
          <div className="profile-info-section">
            {isEditing ? (
              <div className="profile-edit-form">
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="profile-name-input"
                  placeholder="Your name"
                />
                <div className="profile-edit-actions">
                  <button 
                    className="save-profile-btn"
                    onClick={handleSaveProfile}
                    disabled={saving || !name.trim()}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button 
                    className="cancel-edit-btn"
                    onClick={() => {
                      setIsEditing(false);
                      setName(profile?.name || '');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="profile-name">{profile?.name || 'User'}</h1>
                <p className="profile-email">{user.email}</p>
                <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                  </svg>
                  Edit Profile
                </button>
              </>
            )}
            
            {subscription ? (
              <span className="profile-badge premium">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
                {subscription.plan} Member
              </span>
            ) : (
              <span className="profile-badge free">Free Account</span>
            )}
          </div>
        </header>

        {/* Stats Row */}
        <div className="profile-stats">
          <Link href={`/${locale}/profile/saved`} className="profile-stat-card">
            <div className="stat-icon saved">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats.saved}</span>
              <span className="stat-label">Saved</span>
            </div>
          </Link>
          
          <Link href={`/${locale}/profile/following`} className="profile-stat-card">
            <div className="stat-icon following">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats.following}</span>
              <span className="stat-label">Following</span>
            </div>
          </Link>
          
          <div className="profile-stat-card">
            <div className="stat-icon likes">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-number">{stats.likes}</span>
              <span className="stat-label">Likes</span>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <section className="profile-quick-links">
          <h2>Quick Access</h2>
          <div className="quick-links-grid">
            <Link href={`/${locale}/profile/saved`} className="quick-link-card">
              <div className="quick-link-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div className="quick-link-content">
                <h3>Saved</h3>
                <p>Your saved articles, videos, podcasts & more</p>
              </div>
              <svg className="quick-link-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </Link>
            
            <Link href={`/${locale}/profile/following`} className="quick-link-card">
              <div className="quick-link-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div className="quick-link-content">
                <h3>Following</h3>
                <p>Authors and categories you follow</p>
              </div>
              <svg className="quick-link-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </Link>
          </div>
        </section>

        {/* Account Info */}
        <section className="profile-account-info">
          <h2>Account Information</h2>
          <div className="account-info-card">
            <div className="account-info-row">
              <span className="info-label">Email</span>
              <span className="info-value">{user.email}</span>
            </div>
            <div className="account-info-row">
              <span className="info-label">Member since</span>
              <span className="info-value">
                {new Date(profile?.created_at || user.created_at).toLocaleDateString(
                  locale === 'ta-in' ? 'ta-IN' : 'en-US',
                  { year: 'numeric', month: 'long', day: 'numeric' }
                )}
              </span>
            </div>
            <div className="account-info-row">
              <span className="info-label">Subscription</span>
              <span className="info-value">
                {subscription ? (
                  <span className="subscription-active">{subscription.plan}</span>
                ) : (
                  <span className="subscription-free">Free Plan</span>
                )}
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

