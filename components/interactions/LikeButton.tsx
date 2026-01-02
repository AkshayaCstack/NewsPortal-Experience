"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface LikeButtonProps {
  contentTypeUid: string;
  entryUid: string;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onAuthRequired?: () => void;
}

export default function LikeButton({ 
  contentTypeUid, 
  entryUid, 
  showCount = true,
  size = 'md',
  onAuthRequired 
}: LikeButtonProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    fetchLikeStatus();
    fetchLikeCount();
  }, [entryUid, user]);

  const fetchLikeStatus = async () => {
    if (!user) {
      setLiked(false);
      return;
    }

    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('content_type_uid', contentTypeUid)
      .eq('entry_uid', entryUid)
      .single();

    setLiked(!!data);
  };

  const fetchLikeCount = async () => {
    const response = await fetch(`/api/likes?entry_uid=${entryUid}`);
    const data = await response.json();
    setCount(data.count || 0);
  };

  const handleLike = async () => {
    if (!user) {
      onAuthRequired?.();
      return;
    }

    if (loading) return;

    setLoading(true);
    setAnimating(true);

    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          content_type_uid: contentTypeUid,
          entry_uid: entryUid
        })
      });

      const data = await response.json();
      setLiked(data.liked);
      setCount(prev => data.liked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('Error toggling like:', error);
    }

    setLoading(false);
    setTimeout(() => setAnimating(false), 300);
  };

  const sizeClasses = {
    sm: 'like-btn-sm',
    md: 'like-btn-md',
    lg: 'like-btn-lg'
  };

  return (
    <button 
      className={`like-btn ${sizeClasses[size]} ${liked ? 'liked' : ''} ${animating ? 'animating' : ''}`}
      onClick={handleLike}
      disabled={loading}
      aria-label={liked ? 'Unlike' : 'Like'}
    >
      <svg 
        viewBox="0 0 24 24" 
        fill={liked ? 'currentColor' : 'none'} 
        stroke="currentColor" 
        strokeWidth="2"
        className="like-icon"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {showCount && <span className="like-count">{count}</span>}
    </button>
  );
}

