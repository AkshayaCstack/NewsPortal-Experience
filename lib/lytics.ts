"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Extend Window interface for Lytics (correct object is jstag, NOT lytics)
declare global {
  interface Window {
    jstag?: {
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
 * Track page views - fires on route change (not just mount)
 * Uses usePathname() to detect client-side navigation
 */
export function usePageTracking(pageData?: {
  page_type?: string;
  locale?: string;
  [key: string]: any;
}) {
  const pathname = usePathname();

  useEffect(() => {
    window.jstag?.page({
      path: pathname,
      ...pageData,
    });
  }, [pathname]); // Re-fires on every route change
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
  topics?: string[]; // Lytics loves topics for affinity scoring
}

/**
 * Track content views (articles, videos, podcasts, etc.)
 * This is the core event for interest detection
 */
export function useContentTracking(content: ContentViewData | null) {
  useEffect(() => {
    if (!content) return;

    window.jstag?.track("content_view", {
      content_id: content.content_id,
      content_type: content.content_type,
      title: content.title,
      category: content.category,
      author: content.author,
      locale: content.locale,
      is_featured: content.is_featured,
      is_premium: content.is_premium,
      tags: content.tags,
      topics: content.topics || (content.category ? [content.category] : []),
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
 * Timer is properly cleaned up on unmount/navigation
 */
export function useEngagementTracking({
  content_id,
  content_type,
  engagementThreshold = 60,
}: EngagementOptions) {
  useEffect(() => {
    if (!content_id) return;

    const timer = setTimeout(() => {
      window.jstag?.track("content_engaged", {
        content_id,
        content_type,
        duration: engagementThreshold,
        timestamp: new Date().toISOString(),
      });
    }, engagementThreshold * 1000);

    // Cleanup: Cancel timer if user navigates away before threshold
    return () => clearTimeout(timer);
  }, [content_id, content_type, engagementThreshold]);
}

// ============================================
// SCROLL DEPTH TRACKING
// ============================================

/**
 * Track how far users scroll on content pages
 * With divide-by-zero protection for short pages
 */
export function useScrollDepthTracking(content_id: string, content_type: string) {
  const milestones = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!content_id) return;

    // Reset milestones when content changes
    milestones.current = new Set();

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      // Guard against divide by zero on short pages
      if (docHeight <= 0) return;
      
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      // Track at 25%, 50%, 75%, 100%
      [25, 50, 75, 100].forEach((milestone) => {
        if (scrollPercent >= milestone && !milestones.current.has(milestone)) {
          milestones.current.add(milestone);
          window.jstag?.track("scroll_depth", {
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
 * Uses jstag.ready() to ensure Lytics is loaded before identifying
 */
export function identifyUser(userData: UserIdentifyData) {
  // Wait for Lytics to be ready before identifying
  if (window.jstag?.ready) {
    window.jstag.ready(() => {
      window.jstag?.identify({
        user_id: userData.user_id,
        email: userData.email,
        name: userData.name,
        subscribed: userData.is_subscribed,
        subscription_tier: userData.subscription_tier,
        locale: userData.locale,
        identified_at: new Date().toISOString(),
      });
    });
  } else {
    // Fallback: try direct identify (may queue if script loading)
    window.jstag?.identify({
      user_id: userData.user_id,
      email: userData.email,
      name: userData.name,
      subscribed: userData.is_subscribed,
      subscription_tier: userData.subscription_tier,
      locale: userData.locale,
      identified_at: new Date().toISOString(),
    });
  }
}

// ============================================
// NORMALIZED EVENT TRACKING
// ============================================

/**
 * Normalized event names for Lytics best practices
 * Using consistent verb patterns for cross-content affinity
 */
type NormalizedEventName =
  | "content_view"      // View any content
  | "content_engaged"   // Spent time on content
  | "content_like"      // Like any content
  | "content_save"      // Save/bookmark any content
  | "content_share"     // Share any content
  | "content_play"      // Play video/audio content
  | "entity_follow"     // Follow author/category
  | "comment_posted"    // Post a comment
  | "search_performed"  // Search action
  | "scroll_depth"      // Scroll tracking
  | "subscription_started"; // Premium subscription

/**
 * Track normalized events with consistent payload structure
 */
export function trackEvent(
  eventName: NormalizedEventName, 
  data?: Record<string, any>
) {
  window.jstag?.track(eventName, {
    ...data,
    timestamp: new Date().toISOString(),
  });
}

// ============================================
// CONVENIENCE EVENT FUNCTIONS
// ============================================

/**
 * Track content like (normalized)
 */
export function trackContentLike(contentId: string, contentType: string) {
  trackEvent("content_like", {
    content_id: contentId,
    content_type: contentType,
  });
}

/**
 * Track content save (normalized)
 */
export function trackContentSave(contentId: string, contentType: string) {
  trackEvent("content_save", {
    content_id: contentId,
    content_type: contentType,
  });
}

/**
 * Track entity follow (author or category)
 */
export function trackEntityFollow(
  entityType: "author" | "category",
  entityId: string,
  entityName?: string
) {
  trackEvent("entity_follow", {
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName,
  });
}

/**
 * Track content play (video/audio)
 */
export function trackContentPlay(
  contentId: string, 
  contentType: "video" | "podcast" | "podcast_episode",
  duration?: number
) {
  trackEvent("content_play", {
    content_id: contentId,
    content_type: contentType,
    duration,
  });
}

/**
 * Track content share
 */
export function trackContentShare(
  contentId: string,
  contentType: string,
  platform?: string
) {
  trackEvent("content_share", {
    content_id: contentId,
    content_type: contentType,
    platform,
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
 * - Page view (on route change)
 * - Content view
 * - Engagement (time spent)
 * - Scroll depth (optional)
 */
export function useFullContentTracking({
  content,
  engagementThreshold = 60,
  trackScrollDepth = true,
}: FullContentTrackingOptions) {
  // Track page view (fires on route changes)
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
  useScrollDepthTracking(
    trackScrollDepth && content ? content.content_id : "",
    content?.content_type || ""
  );
}
