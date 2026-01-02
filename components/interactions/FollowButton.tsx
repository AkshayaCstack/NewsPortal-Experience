"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { trackEntityFollow } from '@/lib/lytics';

interface FollowButtonProps {
  targetType: 'author' | 'category';
  targetEntryId: string;
  targetName?: string;
  variant?: 'default' | 'outline' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  onAuthRequired?: () => void;
}

export default function FollowButton({ 
  targetType, 
  targetEntryId,
  targetName,
  variant = 'default',
  size = 'md',
  onAuthRequired 
}: FollowButtonProps) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    checkFollowStatus();
    fetchFollowerCount();
  }, [targetEntryId, user]);

  const checkFollowStatus = async () => {
    if (!user) {
      setFollowing(false);
      return;
    }

    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('user_id', user.id)
      .eq('target_type', targetType)
      .eq('target_entry_id', targetEntryId)
      .single();

    setFollowing(!!data);
  };

  const fetchFollowerCount = async () => {
    const { count } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('target_type', targetType)
      .eq('target_entry_id', targetEntryId);

    setFollowerCount(count || 0);
  };

  const handleFollow = async () => {
    if (!user) {
      onAuthRequired?.();
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      if (following) {
        await fetch('/api/follows', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            target_type: targetType,
            target_entry_id: targetEntryId
          })
        });
        setFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
      } else {
        await fetch('/api/follows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            target_type: targetType,
            target_entry_id: targetEntryId
          })
        });
        setFollowing(true);
        setFollowerCount(prev => prev + 1);
        
        // Track follow event in Lytics (normalized event name)
        trackEntityFollow(targetType, targetEntryId, targetName);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }

    setLoading(false);
  };

  const variantClasses = {
    default: 'follow-btn-default',
    outline: 'follow-btn-outline',
    minimal: 'follow-btn-minimal'
  };

  const sizeClasses = {
    sm: 'follow-btn-sm',
    md: 'follow-btn-md',
    lg: 'follow-btn-lg'
  };

  return (
    <button 
      className={`follow-btn ${variantClasses[variant]} ${sizeClasses[size]} ${following ? 'following' : ''}`}
      onClick={handleFollow}
      disabled={loading}
    >
      {loading ? (
        <span className="follow-loading">
          <svg className="spinner" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="60" strokeLinecap="round" />
          </svg>
        </span>
      ) : following ? (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <span>Following</span>
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>Follow{targetName ? ` ${targetName}` : ''}</span>
        </>
      )}
      {variant !== 'minimal' && followerCount > 0 && (
        <span className="follower-count">{followerCount}</span>
      )}
    </button>
  );
}

