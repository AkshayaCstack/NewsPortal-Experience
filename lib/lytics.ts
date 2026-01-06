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
  content_type: "news_article" | "videos" | "podcast" | "podcast_episode" | "magazine" | "live_blog";
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
 * Reset Lytics user to anonymous state and trigger re-evaluation
 * Called on sign out to clear user identity and get fresh anonymous audiences
 * 
 * This approach asks Lytics to:
 * 1. Clear the current user ID (generates new anonymous ID)
 * 2. Send an identify with anonymous traits
 * 3. Trigger a pageView to re-evaluate audiences
 * 4. Lytics will naturally update its cookies with new anonymous state
 */
export function resetLyticsUser() {
  if (typeof window === 'undefined' || !window.jstag) {
    console.warn('[Lytics] SDK not available');
    return;
  }

  try {
    console.log('[Lytics] Resetting user to anonymous state...');
    
    // Clear the Lytics cookies directly so next page load gets fresh anonymous session
    // The SDK will generate new anonymous cookies on the next request
    const cookiesToClear = ['seerid', 'seerses', 'seession', 'ly_segs'];
    cookiesToClear.forEach(name => {
      // Clear for current domain
      document.cookie = `${name}=; path=/; max-age=0`;
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      // Clear for domain with dot prefix
      const domain = window.location.hostname;
      document.cookie = `${name}=; path=/; domain=${domain}; max-age=0`;
      document.cookie = `${name}=; path=/; domain=.${domain}; max-age=0`;
    });
    console.log('[Lytics] Cleared Lytics cookies');
    
    // DON'T send null identify - this doesn't properly reset audiences
    // DON'T send pageView here - it might recreate cookies before reload
    // The page reload will naturally trigger fresh Lytics session
    
    // Clear Contentstack Personalize cached state
    clearPersonalizeCookies();
    
    console.log('[Lytics] User reset complete - will be anonymous on next request');
    
  } catch (error) {
    console.warn('[Lytics] Error resetting user:', error);
  }
}

/**
 * Aggressively clear ALL personalization-related cookies
 * Handles various path/domain combinations
 */
function clearPersonalizeCookies() {
  if (typeof document === 'undefined') return;
  
  // All cookies that might be set by Lytics or Personalize
  const cookiesToClear = [
    // Lytics cookies
    'seerid',
    'seerses',
    'seession',
    'ly_segs',
    // Contentstack Personalize cookies (these store audience/variant cache)
    'cs-personalize-manifest',
    'cs-personalize-user-uid', 
    'cs-personalize-user-id',
    'cs-lytics-audiences',  // This stores the audience membership!
    'cs-lytics-flows',
    'cs_user_subscribed',
  ];
  
  const hostname = window.location.hostname;
  
  // Try multiple domain variations
  const domains = [
    '',                           // No domain (current host)
    hostname,                     // Exact hostname
    `.${hostname}`,               // Subdomain wildcard
    hostname.split('.').slice(-2).join('.'), // Root domain (e.g., example.com)
    `.${hostname.split('.').slice(-2).join('.')}`, // .example.com
  ];
  
  // Try multiple paths
  const paths = ['/', '', '/en-us', '/ta-in'];
  
  console.log('[Lytics] Clearing cookies for domains:', domains);
  
  cookiesToClear.forEach(name => {
    domains.forEach(domain => {
      paths.forEach(path => {
        const domainPart = domain ? `; domain=${domain}` : '';
        const pathPart = `; path=${path || '/'}`;
        
        // Clear with max-age=0
        document.cookie = `${name}=${domainPart}${pathPart}; max-age=0`;
        // Clear with expires in past
        document.cookie = `${name}=${domainPart}${pathPart}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      });
    });
  });
  
  // Also try to clear by reading current cookies and deleting them
  document.cookie.split(';').forEach(cookie => {
    const [name] = cookie.split('=');
    const trimmedName = name?.trim();
    if (trimmedName && (
      trimmedName.includes('seer') || 
      trimmedName.includes('lytics') || 
      trimmedName.includes('personalize') ||
      trimmedName.includes('cs-') ||
      trimmedName.includes('cs_')
    )) {
      domains.forEach(domain => {
        const domainPart = domain ? `; domain=${domain}` : '';
        document.cookie = `${trimmedName}=; path=/; max-age=0${domainPart}`;
        document.cookie = `${trimmedName}=; path=/${domainPart}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      });
    }
  });
  
  // Clear session storage
  try {
    sessionStorage.removeItem('contentstack_personalize');
    // Clear any keys with personalize/lytics
    Object.keys(sessionStorage).forEach(key => {
      if (key.toLowerCase().includes('lytics') || 
          key.toLowerCase().includes('personalize') ||
          key.toLowerCase().includes('contentstack')) {
        sessionStorage.removeItem(key);
      }
    });
  } catch {
    // Ignore
  }
  
  // Clear local storage lytics data
  try {
    localStorage.removeItem('lytics_segments');
    localStorage.removeItem('PathforaPageView');
    Object.keys(localStorage).forEach(key => {
      if (key.toLowerCase().includes('lytics') || 
          key.toLowerCase().includes('personalize')) {
        localStorage.removeItem(key);
      }
    });
  } catch {
    // Ignore
  }
  
  console.log('[Lytics] Cleared all personalization cookies and storage');
}

/**
 * Full sign out reset - resets Lytics and returns whether reload is needed
 */
export function fullPersonalizationReset(): boolean {
  // Reset Lytics user (this now handles everything)
  resetLyticsUser();
  
  // Return true to indicate a page reload is recommended
  // for the fresh personalization to take effect
  return true;
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
  contentType: "videos" | "podcast" | "podcast_episode",
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