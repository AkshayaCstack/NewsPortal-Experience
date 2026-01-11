"use client";

import { useState } from 'react';
import LikeButton from '@/components/interactions/LikeButton';
import SaveButton from '@/components/interactions/SaveButton';
import CommentsSection from '@/components/interactions/CommentsSection';
import FollowButton from '@/components/interactions/FollowButton';
import AuthModal from '@/components/auth/AuthModal';
import { useAuth } from '@/contexts/AuthContext';

interface ContentInteractionsProps {
  contentType: 'article' | 'podcast' | 'video' | 'magazine' | 'live_blog' | 'user_story';
  contentUid: string;
  author?: { uid: string; name: string } | null;
  category?: { uid: string; name: string } | null;
  showComments?: boolean;
  showSave?: boolean;
}

export default function ContentInteractions({ 
  contentType,
  contentUid, 
  author, 
  category,
  showComments = true,
  showSave = true
}: ContentInteractionsProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const { user } = useAuth();

  const handleAuthRequired = () => {
    setShowAuthModal(true);
  };

  const handleReport = async () => {
    if (!user) {
      handleAuthRequired();
      return;
    }
    
    if (!reportReason.trim()) return;
    
    try {
      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          content_type_uid: contentType,
          entry_uid: contentUid,
          reason: reportReason
        })
      });
      setReportSubmitted(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSubmitted(false);
        setReportReason('');
      }, 2000);
    } catch (error) {
      console.error('Error submitting report:', error);
    }
  };

  return (
    <>
      {/* Action Bar */}
      <div className="content-actions-bar">
        <div className="actions-left">
          <LikeButton 
            contentTypeUid={contentType}
            entryUid={contentUid}
            size="md"
            onAuthRequired={handleAuthRequired}
          />
          
          {showSave && (
            <SaveButton 
              contentTypeUid={contentType}
              entryUid={contentUid}
              size="md"
              onAuthRequired={handleAuthRequired}
            />
          )}
          
          <button className="action-btn-icon" title="Share">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3"/>
              <circle cx="6" cy="12" r="3"/>
              <circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>
          
          <button 
            className="action-btn-icon report-icon" 
            title="Report"
            onClick={() => user ? setShowReportModal(true) : handleAuthRequired()}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
              <line x1="4" y1="22" x2="4" y2="15"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Author/Category Follow */}
      {(author || category) && (
        <div className="content-follow-section">
          {author && (
            <div className="follow-row">
              <span>Follow <strong>{author.name}</strong> for more</span>
              <FollowButton 
                targetType="author"
                targetEntryId={author.uid}
                variant="outline"
                size="sm"
                onAuthRequired={handleAuthRequired}
              />
            </div>
          )}
          {category && (
            <div className="follow-row">
              <span>Follow <strong>{category.name}</strong> category</span>
              <FollowButton 
                targetType="category"
                targetEntryId={category.uid}
                variant="outline"
                size="sm"
                onAuthRequired={handleAuthRequired}
              />
            </div>
          )}
        </div>
      )}

      {/* Comments Section */}
      {showComments && (
        <CommentsSection 
          contentTypeUid={contentType}
          entryUid={contentUid}
          onAuthRequired={handleAuthRequired}
        />
      )}

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Report Modal */}
      {showReportModal && (
        <div className="report-modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Report Content</h3>
            {reportSubmitted ? (
              <div className="report-success">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                <p>Thank you for your report. We'll review it shortly.</p>
              </div>
            ) : (
              <>
                <p>Why are you reporting this content?</p>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Please describe the issue..."
                  rows={4}
                />
                <div className="report-actions">
                  <button className="cancel-btn" onClick={() => setShowReportModal(false)}>
                    Cancel
                  </button>
                  <button 
                    className="submit-btn" 
                    onClick={handleReport}
                    disabled={!reportReason.trim()}
                  >
                    Submit Report
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

