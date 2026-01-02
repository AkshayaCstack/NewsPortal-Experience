"use client";

import { useEffect, useRef } from "react";

// Extend Window interface for Lytics
declare global {
  interface Window {
    lytics?: {
      track: (event: string, data?: Record<string, any>) => void;
      identify: (data: Record<string, any>) => void;
      page: (data?: Record<string, any>) => void;
      ready: (callback: () => void) => void;
    };
  }
}

// ============================================
// PAGE VIEW TRACKING
// ============================================

/**
 * Track page views - call this in every page component
 */
export function usePageTracking(pageData?: {
  page_type?: string;
  locale?: string;
  [key: string]: any;
}) {
  useEffect(() => {
    window.lytics?.page(pageData);
  }, []);
}

// ============================================
// CONTENT VIEW TRACKING
// ============================================

interface ContentViewData {
  content_id: string;
  content_type: "news_article" | "video" | "podcast" | "podcast_episode" | "magazine" | "live_blog";
  title?: string;
  category?: string;
  author?: string;
  locale?: string;
  is_featured?: boolean;
  is_premium?: boolean;
  tags?: string[];
}

/**
 * Track content views (articles, videos, podcasts, etc.)
 * This is the core event for interest detection
 */
export function useContentTracking(content: ContentViewData | null) {
  useEffect(() => {
    if (!content) return;

    window.lytics?.track("content_view", {
      content_id: content.content_id,
      content_type: content.content_type,
      title: content.title,
      category: content.category,
      author: content.author,
      locale: content.locale,
      is_featured: content.is_featured,
      is_premium: content.is_premium,
      tags: content.tags,
      timestamp: new Date().toISOString(),
    });
  }, [content?.content_id]);
}

// ============================================
// ENGAGEMENT DEPTH TRACKING
// ============================================

interface EngagementOptions {
  content_id: string;
  content_type: string;
  engagementThreshold?: number; // seconds before counting as "engaged"
}

/**
 * Track engagement depth - fires after user spends time on content
 * Default: 60 seconds
 */
export function useEngagementTracking({
  content_id,
  content_type,
  engagementThreshold = 60,
}: EngagementOptions) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!content_id || hasTracked.current) return;

    const timer = setTimeout(() => {
      if (!hasTracked.current) {
        window.lytics?.track("content_engaged", {
          content_id,
          content_type,
          duration: engagementThreshold,
          timestamp: new Date().toISOString(),
        });
        hasTracked.current = true;
      }
    }, engagementThreshold * 1000);

    return () => clearTimeout(timer);
  }, [content_id, content_type, engagementThreshold]);
}

// ============================================
// SCROLL DEPTH TRACKING
// ============================================

/**
 * Track how far users scroll on content pages
 */
export function useScrollDepthTracking(content_id: string, content_type: string) {
  const milestones = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!content_id) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      // Track at 25%, 50%, 75%, 100%
      [25, 50, 75, 100].forEach((milestone) => {
        if (scrollPercent >= milestone && !milestones.current.has(milestone)) {
          milestones.current.add(milestone);
          window.lytics?.track("scroll_depth", {
            content_id,
            content_type,
            depth: milestone,
            timestamp: new Date().toISOString(),
          });
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [content_id, content_type]);
}

// ============================================
// USER IDENTIFICATION
// ============================================

interface UserIdentifyData {
  user_id: string;
  email?: string;
  name?: string;
  is_subscribed?: boolean;
  subscription_tier?: string;
  locale?: string;
}

/**
 * Identify user after login - connects anonymous to known user
 */
export function identifyUser(userData: UserIdentifyData) {
  window.lytics?.identify({
    user_id: userData.user_id,
    email: userData.email,
    name: userData.name,
    subscribed: userData.is_subscribed,
    subscription_tier: userData.subscription_tier,
    locale: userData.locale,
    identified_at: new Date().toISOString(),
  });
}

// ============================================
// CUSTOM EVENT TRACKING
// ============================================

type EventName =
  | "article_liked"
  | "article_saved"
  | "author_followed"
  | "category_followed"
  | "comment_posted"
  | "newsletter_subscribed"
  | "subscription_started"
  | "search_performed"
  | "share_clicked"
  | "video_played"
  | "podcast_played";

/**
 * Track custom events
 */
export function trackEvent(eventName: EventName, data?: Record<string, any>) {
  window.lytics?.track(eventName, {
    ...data,
    timestamp: new Date().toISOString(),
  });
}

// ============================================
// COMBINED CONTENT TRACKING HOOK
// ============================================

interface FullContentTrackingOptions {
  content: ContentViewData | null;
  engagementThreshold?: number;
  trackScrollDepth?: boolean;
}

/**
 * Combined hook for full content tracking
 * - Page view
 * - Content view
 * - Engagement (time spent)
 * - Scroll depth (optional)
 */
export function useFullContentTracking({
  content,
  engagementThreshold = 60,
  trackScrollDepth = true,
}: FullContentTrackingOptions) {
  // Track page view
  usePageTracking({
    page_type: content?.content_type,
    locale: content?.locale,
  });

  // Track content view
  useContentTracking(content);

  // Track engagement
  useEngagementTracking({
    content_id: content?.content_id || "",
    content_type: content?.content_type || "",
    engagementThreshold,
  });

  // Track scroll depth
  if (trackScrollDepth && content) {
    useScrollDepthTracking(content.content_id, content.content_type);
  }
}

