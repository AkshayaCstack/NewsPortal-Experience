"use client";

import { useFullContentTracking, trackContentLike, trackContentSave } from "@/lib/lytics";
import { useEffect } from "react";

interface ContentTrackerProps {
  contentId: string;
  contentType: "news_article" | "video" | "podcast" | "podcast_episode" | "magazine" | "live_blog";
  title?: string;
  category?: string;
  author?: string;
  locale?: string;
  isFeatured?: boolean;
  isPremium?: boolean;
  tags?: string[];
  topics?: string[]; // Explicit topics for better Lytics affinity scoring
  engagementThreshold?: number;
  trackScrollDepth?: boolean;
}

/**
 * Client component that wraps content pages to provide Lytics tracking
 * Use this in server components by rendering it alongside the content
 * 
 * Tracks:
 * - Page views (on route change)
 * - Content views (with category/topics for affinity)
 * - Engagement (after threshold seconds)
 * - Scroll depth (at 25%, 50%, 75%, 100%)
 */
export default function ContentTracker({
  contentId,
  contentType,
  title,
  category,
  author,
  locale,
  isFeatured = false,
  isPremium = false,
  tags = [],
  topics,
  engagementThreshold = 60,
  trackScrollDepth = true,
}: ContentTrackerProps) {
  // Build topics array: explicit topics, or fallback to category + tags
  const derivedTopics = topics || [
    ...(category ? [category] : []),
    ...tags.slice(0, 5), // Include up to 5 tags as topics
  ].filter(Boolean);

  // Use the combined tracking hook
  useFullContentTracking({
    content: {
      content_id: contentId,
      content_type: contentType,
      title,
      category,
      author,
      locale,
      is_featured: isFeatured,
      is_premium: isPremium,
      tags,
      topics: derivedTopics,
    },
    engagementThreshold,
    trackScrollDepth,
  });

  // This component renders nothing - it's just for tracking
  return null;
}

// ============================================
// Individual Tracker Components for Specific Events
// ============================================

interface LikeTrackerProps {
  contentId: string;
  contentType: string;
}

/**
 * Component to track like events (mount-based)
 */
export function LikeTracker({ contentId, contentType }: LikeTrackerProps) {
  useEffect(() => {
    trackContentLike(contentId, contentType);
  }, [contentId, contentType]);

  return null;
}

interface SaveTrackerProps {
  contentId: string;
  contentType: string;
}

/**
 * Component to track save events (mount-based)
 */
export function SaveTracker({ contentId, contentType }: SaveTrackerProps) {
  useEffect(() => {
    trackContentSave(contentId, contentType);
  }, [contentId, contentType]);

  return null;
}
