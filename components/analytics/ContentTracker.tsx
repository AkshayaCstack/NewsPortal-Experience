"use client";

import { useFullContentTracking, trackEvent } from "@/lib/lytics";
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
  engagementThreshold?: number;
  trackScrollDepth?: boolean;
}

/**
 * Client component that wraps content pages to provide Lytics tracking
 * Use this in server components by rendering it alongside the content
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
  engagementThreshold = 60,
  trackScrollDepth = true,
}: ContentTrackerProps) {
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

export function LikeTracker({ contentId, contentType }: LikeTrackerProps) {
  useEffect(() => {
    // This is called when the component mounts (after like action)
    trackEvent("article_liked", {
      content_id: contentId,
      content_type: contentType,
    });
  }, [contentId, contentType]);

  return null;
}

interface SaveTrackerProps {
  contentId: string;
  contentType: string;
}

export function SaveTracker({ contentId, contentType }: SaveTrackerProps) {
  useEffect(() => {
    trackEvent("article_saved", {
      content_id: contentId,
      content_type: contentType,
    });
  }, [contentId, contentType]);

  return null;
}

