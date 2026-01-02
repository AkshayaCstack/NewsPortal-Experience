"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Comment {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  profiles: {
    name: string;
    avatar_url: string | null;
  } | null;
}

interface CommentsSectionProps {
  contentTypeUid: string;
  entryUid: string;
  onAuthRequired?: () => void;
}

export default function CommentsSection({ 
  contentTypeUid, 
  entryUid,
  onAuthRequired 
}: CommentsSectionProps) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [entryUid]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/comments?entry_uid=${entryUid}`);
      const data = await response.json();
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      onAuthRequired?.();
      return;
    }

    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          content_type_uid: contentTypeUid,
          entry_uid: entryUid,
          body: newComment.trim()
        })
      });

      if (response.ok) {
        setNewComment('');
        fetchComments();
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    }
    setSubmitting(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };

  const displayedComments = showAll ? comments : comments.slice(0, 3);

  return (
    <div className="comments-section">
      <div className="comments-header">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="comment-form">
        {user ? (
          <div className="comment-input-wrapper">
            <div className="comment-avatar">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.name} />
              ) : (
                <div className="avatar-placeholder">
                  {profile?.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div className="comment-input-box">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                rows={2}
                disabled={submitting}
              />
              <button 
                type="submit" 
                className="comment-submit-btn"
                disabled={submitting || !newComment.trim()}
              >
                {submitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        ) : (
          <div className="comment-login-prompt">
            <p>
              <button type="button" onClick={onAuthRequired} className="login-link">
                Sign in
              </button>
              {' '}to join the conversation
            </p>
          </div>
        )}
      </form>

      {/* Comments List */}
      <div className="comments-list">
        {loading ? (
          <div className="comments-loading">
            <div className="loading-spinner" />
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="comments-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <>
            {displayedComments.map((comment) => (
              <div key={comment.id} className="comment-item">
                <div className="comment-avatar">
                  {comment.profiles?.avatar_url ? (
                    <img src={comment.profiles.avatar_url} alt={comment.profiles.name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {comment.profiles?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                <div className="comment-content">
                  <div className="comment-meta">
                    <span className="comment-author">{comment.profiles?.name || 'Anonymous'}</span>
                    <span className="comment-time">{formatDate(comment.created_at)}</span>
                  </div>
                  <p className="comment-body">{comment.body}</p>
                </div>
              </div>
            ))}

            {comments.length > 3 && !showAll && (
              <button className="show-more-comments" onClick={() => setShowAll(true)}>
                Show {comments.length - 3} more comments
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

