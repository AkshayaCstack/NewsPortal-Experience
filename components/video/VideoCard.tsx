"use client";

import { useState } from 'react';
import LikeButton from '@/components/interactions/LikeButton';
import AuthModal from '@/components/auth/AuthModal';

interface VideoCardProps {
  video: {
    uid: string;
    title: string;
    description?: string;
    thumbnail?: { url: string };
    video_url?: { href: string };
    is_featured?: boolean;
    category?: any;
  };
  youtubeId?: string | null;
}

export default function VideoCard({ video, youtubeId }: VideoCardProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const category = video.category?.[0] || video.category;
  const thumbnailUrl = video.thumbnail?.url || 
    (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : null);

  return (
    <>
      <div className="video-card-wrapper">
        <a 
          href={video.video_url?.href || '#'} 
          target="_blank"
          rel="noopener noreferrer"
          className="video-card"
        >
          <div className="video-card-thumbnail">
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt={video.title} />
            ) : (
              <div className="video-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              </div>
            )}
            <div className="video-play-overlay">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            </div>
            {video.is_featured && (
              <span className="video-badge">Featured</span>
            )}
          </div>
          <div className="video-card-content">
            {category && (
              <span className="video-card-category">{category.title || category.name}</span>
            )}
            <h4 className="video-card-title">{video.title}</h4>
            {video.description && (
              <p className="video-card-desc">{video.description}</p>
            )}
          </div>
        </a>
        
        {/* Like Button */}
        <div className="video-card-actions">
          <LikeButton 
            contentTypeUid="video"
            entryUid={video.uid}
            size="sm"
            onAuthRequired={() => setShowAuthModal(true)}
          />
        </div>
      </div>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}

