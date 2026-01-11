"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { timeAgo, formatDate, jsonRteToText } from "@/helper";
import { useAuth } from "@/contexts/AuthContext";
import { getEditTagProps } from "@/lib/editTags";

interface Poll {
  question: string;
  option: string[];
}

interface PollResult {
  option_index: number;
  option_text: string;
  vote_count: number;
  percentage: number;
}

interface BreakingNewsProps {
  articles: any[];
  title?: string;
  locale?: string;
}

export default function BreakingNews({ articles, title, locale = 'en-us' }: BreakingNewsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pollData, setPollData] = useState<Record<string, { results: PollResult[]; total_votes: number }>>({});
  const [userVotes, setUserVotes] = useState<Record<string, { has_voted: boolean; voted_option: number }>>({});
  const [isVoting, setIsVoting] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showThanks, setShowThanks] = useState<string | null>(null);
  const [isChangingVote, setIsChangingVote] = useState<string | null>(null);
  
  const { user, loading: authLoading } = useAuth();

  // Fetch poll data from API
  const fetchPollData = useCallback(async () => {
    const articleUids = articles
      .filter(a => a.polls?.question)
      .map(a => a.uid);

    if (articleUids.length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/polls/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_uids: articleUids })
      });

      if (response.ok) {
        const data = await response.json();
        setPollData(data.poll_results || {});
        setUserVotes(data.user_votes || {});
      }
    } catch (error) {
      console.error('Error fetching poll data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [articles]);

  useEffect(() => {
    if (!authLoading) {
      fetchPollData();
    }
  }, [fetchPollData, authLoading, user]);

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (articles.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === articles.length - 1 ? 0 : prev + 1));
    }, 5000);
    
    return () => clearInterval(interval);
  }, [articles.length]);

  if (!articles || articles.length === 0) return null;

  const currentArticle = articles[currentIndex];
  const poll: Poll | null = currentArticle.polls?.question ? currentArticle.polls : null;
  const hasVoted = userVotes[currentArticle.uid]?.has_voted || false;
  const votedOption = userVotes[currentArticle.uid]?.voted_option;

  const getHeroImage = (article: any) => {
    if (!article?.group) return null;
    const heroGroup = article.group.find((g: any) => g.is_hero_image);
    return heroGroup?.image?.url || article.group[0]?.image?.url;
  };

  const getDescription = (article: any) => {
    let text = '';
    if (article.description) {
      text = typeof article.description === 'string' ? article.description : jsonRteToText(article.description);
    } else if (article.body) {
      text = typeof article.body === 'string' ? article.body : jsonRteToText(article.body);
    }
    return text.replace(/<[^>]*>/g, '').slice(0, 180) + '...';
  };

  const handleVote = async (optionIndex: number) => {
    const isUpdating = isChangingVote === currentArticle.uid;
    
    // If currently voting, ignore
    if (isVoting) return;

    // Check if user is authenticated
    if (!user) {
      setShowAuthPrompt(true);
      setTimeout(() => setShowAuthPrompt(false), 3000);
      return;
    }
    
    // If already voted and NOT in change mode, ignore
    if (hasVoted && !isUpdating) {
      return;
    }
    
    // If clicking the same option while changing, just cancel change mode
    if (isUpdating && votedOption === optionIndex) {
      setIsChangingVote(null);
      return;
    }
    
    setIsVoting(currentArticle.uid);
    
    try {
      const response = await fetch('/api/polls', {
        method: isUpdating ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_uid: currentArticle.uid,
          option_index: optionIndex,
          option_text: poll?.option[optionIndex],
          poll_question: poll?.question,
          locale
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update poll results
        if (data.poll_results) {
          setPollData(prev => ({
            ...prev,
            [currentArticle.uid]: data.poll_results
          }));
        }
        
        // Update user's vote with the correct option index from response or input
        const confirmedOption = data.voted_option !== undefined ? data.voted_option : optionIndex;
        setUserVotes(prev => ({
          ...prev,
          [currentArticle.uid]: {
            has_voted: true,
            voted_option: confirmedOption
          }
        }));
        
        // Show thanks message temporarily
        setShowThanks(currentArticle.uid);
        setTimeout(() => setShowThanks(null), 3000);
        
        // Exit change mode
        setIsChangingVote(null);
      } else if (data.error === 'already_voted') {
        // User already voted - update state to reflect this
        const existingOption = data.voted_option !== undefined ? data.voted_option : votedOption;
        setUserVotes(prev => ({
          ...prev,
          [currentArticle.uid]: {
            has_voted: true,
            voted_option: existingOption
          }
        }));
        // Refresh poll data
        fetchPollData();
      } else if (response.status === 401) {
        setShowAuthPrompt(true);
        setTimeout(() => setShowAuthPrompt(false), 3000);
      }
    } catch (error) {
      console.error('Error casting vote:', error);
    } finally {
      setIsVoting(null);
    }
  };

  const handleChangeVote = () => {
    if (isChangingVote === currentArticle.uid) {
      setIsChangingVote(null);
    } else {
      setIsChangingVote(currentArticle.uid);
    }
  };

  const getTotalVotes = (articleUid: string) => {
    return pollData[articleUid]?.total_votes || 0;
  };

  const getVotePercentage = (articleUid: string, optionIndex: number) => {
    const result = pollData[articleUid]?.results?.find(r => r.option_index === optionIndex);
    return result?.percentage || 0;
  };

  const category = currentArticle.category?.[0] || currentArticle.category;
  const author = currentArticle.author?.[0] || currentArticle.author;

  const goToPrev = () => setCurrentIndex((prev) => (prev === 0 ? articles.length - 1 : prev - 1));
  const goToNext = () => setCurrentIndex((prev) => (prev === articles.length - 1 ? 0 : prev + 1));

  return (
    <section className="bn-section" id="breaking-news-section">
      {/* Header Bar */}
      <div className="bn-header">
        <div className="bn-badge">
          <span className="bn-pulse"></span>
          <span className="bn-label">BREAKING NEWS</span>
        </div>
        
          {articles.length > 1 && (
          <div className="bn-controls">
            <button onClick={goToPrev} className="bn-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
              </button>
            <span className="bn-counter">{currentIndex + 1}/{articles.length}</span>
            <button onClick={goToNext} className="bn-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
          )}
        </div>

        {/* Main Card */}
      <div className="bn-card">
        {/* Image Side */}
        <div className="bn-image-wrap">
          {getHeroImage(currentArticle) ? (
            <img src={getHeroImage(currentArticle)} alt={currentArticle.title || ''} className="bn-image" />
          ) : (
            <div className="bn-image-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21,15 16,10 5,21"/>
              </svg>
            </div>
          )}
          <div className="bn-image-overlay"></div>
          {category && <span className="bn-category">{category.title || category.name}</span>}
        </div>

        {/* Content Side */}
        <div className="bn-content">
          <div className="bn-meta">
            <span className="bn-time">{timeAgo(currentArticle.published_date)}</span>
            {author?.name && <span className="bn-author">by {author.name}</span>}
          </div>

          <Link href={`/${locale}/news/${currentArticle.uid}`} className="bn-title-link">
            <h2 
              className="bn-title"
              {...getEditTagProps(currentArticle, 'title', 'news_article', locale)}
            >
              {currentArticle.title}
            </h2>
          </Link>

          <p 
            className="bn-excerpt"
            {...getEditTagProps(currentArticle, 'description', 'news_article', locale)}
          >
            {getDescription(currentArticle)}
          </p>

          {/* Poll Section */}
          {poll && (
            <div className="bn-poll">
              <div className="bn-poll-header">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
                <span className="bn-poll-title">Quick Poll</span>
                <span className="bn-poll-count">
                  {isLoading ? '...' : `${getTotalVotes(currentArticle.uid).toLocaleString()} votes`}
                </span>
              </div>
              
              <p className="bn-poll-question">{poll.question}</p>
              
              {/* Auth Prompt */}
              {showAuthPrompt && (
                <div className="bn-auth-prompt">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4M12 8h.01"/>
                  </svg>
                  Please sign in to vote
                </div>
              )}
              
              <div className="bn-poll-options">
                {poll.option.map((option: string, idx: number) => {
                  const pct = getVotePercentage(currentArticle.uid, idx);
                  const isSelected = votedOption === idx;
                  const isTop = hasVoted && pct === Math.max(...poll.option.map((_: string, i: number) => getVotePercentage(currentArticle.uid, i)));
                  const canClick = !hasVoted || isChangingVote === currentArticle.uid;
                  
                  return (
                    <button
                      key={idx}
                      className={`bn-option ${hasVoted ? 'voted' : ''} ${isSelected ? 'selected' : ''} ${isTop ? 'top' : ''} ${isChangingVote === currentArticle.uid ? 'changing' : ''}`}
                      onClick={() => handleVote(idx)}
                      disabled={!canClick || isVoting === currentArticle.uid}
                    >
                      <span className="bn-option-text">{option}</span>
                      {hasVoted && <span className="bn-option-pct">{pct}%</span>}
                      {hasVoted && <div className="bn-option-bar" style={{ width: `${pct}%` }}></div>}
                      {isSelected && !isChangingVote && <span className="bn-check">✓</span>}
                    </button>
                  );
                })}
            </div>
              
              {/* Actions row */}
              <div className="bn-poll-actions">
                {showThanks === currentArticle.uid && (
                  <span className="bn-poll-thanks">Thanks for voting!</span>
            )}
            
                {hasVoted && user && !showThanks && (
                  <button 
                    className={`bn-change-vote ${isChangingVote === currentArticle.uid ? 'active' : ''}`}
                    onClick={handleChangeVote}
                  >
                    {isChangingVote === currentArticle.uid ? 'Cancel' : 'Change vote'}
                  </button>
                )}
          </div>

              {isChangingVote === currentArticle.uid && (
                <p className="bn-poll-hint">Select a different option</p>
              )}
              
              {!user && !hasVoted && (
                <p className="bn-poll-signin">Sign in to vote</p>
            )}
          </div>
          )}

          <Link href={`/${locale}/news/${currentArticle.uid}`} className="bn-read-more">
            Read Full Story
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
        </Link>
        </div>
      </div>

      {/* Dots */}
        {articles.length > 1 && (
        <div className="bn-dots">
          {articles.map((_, i) => (
              <button
              key={i} 
              className={`bn-dot ${i === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(i)}
              />
            ))}
          </div>
        )}

      {/* Auto-slide progress bar */}
      {articles.length > 1 && (
        <div className="bn-progress-bar" key={currentIndex} />
      )}
    </section>
  );
}
