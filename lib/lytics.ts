"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Extend Window interface for Lytics SDK v3
// Official methods: send, identify, pageView, on, once, getid, setid, etc.
declare global {
  interface Window {
    jstag?: {
      send: (event: string, data?: Record<string, any>) => void;
      identify: (data: Record<string, any>) => void;
      pageView: (data?: Record<string, any>) => void;
      on: (event: string, callback: () => void) => void;
      once: (event: string, callback: () => void) => void;
      getid: () => string | null;
      setid: (id: string) => void;
      loadEntity: (entityType: string, entityId: string, callback?: (entity: any) => void) => void;
      getEntity: (entityType: string, entityId: string) => any;
      call: (method: string, ...args: any[]) => any;
      config?: Record<string, any>;
    };
  }
}

// ============================================
// PAGE VIEW TRACKING
// ============================================

/**
 * Track page views - fires on route change (not just mount)
 * Uses usePathname() to detect client-side navigation
 * Uses jstag.pageView() - the official v3 method
 */
export function usePageTracking(pageData?: {
  page_type?: string;
  locale?: string;
  [key: string]: any;
}) {
  const pathname = usePathname();

  useEffect(() => {
    window.jstag?.pageView({
      path: pathname,
      url: typeof window !== 'undefined' ? window.location.href : '',
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
 * Uses jstag.send() - the official v3 method for custom events
 */
export function useContentTracking(content: ContentViewData | null) {
  useEffect(() => {
    if (!content) return;

    window.jstag?.send("content_view", {
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
      window.jstag?.send("content_engaged", {
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
          window.jstag?.send("scroll_depth", {
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
 * Uses jstag.identify() with on() callback to ensure SDK is ready
 */
export function identifyUser(userData: UserIdentifyData) {
  const identifyPayload = {
    user_id: userData.user_id,
    email: userData.email,
    name: userData.name,
    subscribed: userData.is_subscribed,
    subscription_tier: userData.subscription_tier,
    locale: userData.locale,
    identified_at: new Date().toISOString(),
  };

  // Use once() to wait for SDK ready, or call directly if already loaded
  if (window.jstag?.once) {
    window.jstag.once("ready", () => {
      window.jstag?.identify(identifyPayload);
    });
  }
  
  // Also try direct identify in case SDK is already loaded
  window.jstag?.identify(identifyPayload);
}

/**
 * Reset Lytics user to anonymous state
 * Called on sign out to clear user identity
 * This tells Lytics to treat subsequent events as a new anonymous user
 */
export function resetLyticsUser() {
  try {
    // Send an anonymous identify to reset user traits
    // This clears the user's identity in Lytics
    if (window.jstag?.identify) {
      window.jstag.identify({
        user_id: null,
        email: null,
        subscribed: false,
        subscription_tier: null,
      });
    }
  } catch (error) {
    // Silently fail - resetting Lytics shouldn't break sign out
    console.warn('[Lytics] Error resetting user:', error);
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
 * Uses jstag.send() - the official v3 method
 */
export function trackEvent(
  eventName: NormalizedEventName, 
  data?: Record<string, any>
) {
  window.jstag?.send(eventName, {
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
