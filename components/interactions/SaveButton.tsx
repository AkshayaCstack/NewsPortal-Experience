"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SaveButtonProps {
  contentTypeUid: string;
  entryUid: string;
  size?: 'sm' | 'md' | 'lg';
  onAuthRequired?: () => void;
}

export default function SaveButton({ 
  contentTypeUid, 
  entryUid, 
  size = 'md',
  onAuthRequired 
}: SaveButtonProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Check initial saved state
  useEffect(() => {
    if (!user) {
      setIsSaved(false);
      return;
    }

    const checkSavedState = async () => {
      try {
        const res = await fetch(
          `/api/saves?user_id=${user.id}&content_type_uid=${contentTypeUid}&entry_uid=${entryUid}`
        );
        const data = await res.json();
        setIsSaved(data.saved);
      } catch (error) {
        console.error('Error checking saved state:', error);
      }
    };

    checkSavedState();
  }, [user, contentTypeUid, entryUid]);

  const handleSave = async () => {
    if (!user) {
      onAuthRequired?.();
      return;
    }

    // Optimistic UI update
    setIsSaved(!isSaved);
    setIsLoading(true);

    try {
      const res = await fetch('/api/saves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          content_type_uid: contentTypeUid,
          entry_uid: entryUid
        })
      });

      const data = await res.json();
      setIsSaved(data.saved);
    } catch (error) {
      // Revert on error
      setIsSaved(!isSaved);
      console.error('Error toggling save:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'save-btn-sm',
    md: 'save-btn-md',
    lg: 'save-btn-lg'
  };

  return (
    <button 
      className={`save-btn ${sizeClasses[size]} ${isSaved ? 'saved' : ''} ${isLoading ? 'loading' : ''}`}
      onClick={handleSave}
      disabled={isLoading}
      title={isSaved ? 'Remove from saved' : 'Save for later'}
    >
      {isSaved ? (
        // Filled bookmark icon
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
      ) : (
        // Outline bookmark icon
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
      )}
      <span className="save-text">{isSaved ? 'Saved' : 'Save'}</span>
    </button>
  );
}

