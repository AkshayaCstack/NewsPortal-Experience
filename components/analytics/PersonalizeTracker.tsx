'use client';

import { useEffect, useRef } from 'react';
import Personalize from '@contentstack/personalize-edge-sdk';

interface PersonalizeTrackerProps {
  variant?: string;
}

/**
 * Client-side component that tracks impressions for Contentstack Personalize.
 * This fires when a user actually sees a variant - fails silently on network errors.
 */
export default function PersonalizeTracker({ variant }: PersonalizeTrackerProps) {
  const hasTracked = useRef(false);

  useEffect(() => {
    // Only track once per mount
    if (hasTracked.current) return;
    hasTracked.current = true;

    const initTracker = async () => {
      const projectUid = process.env.NEXT_PUBLIC_PERSONALIZATION_PROJECT_UID;
      
      if (!projectUid || !variant) {
        return;
      }

      try {
        // Initialize SDK in browser (will use manifest from cookie set by middleware)
        const sdk = await Personalize.init(projectUid);
        
        // Get active experiences
        const experiences = sdk.getExperiences?.();
        
        if (experiences && experiences.length > 0) {
          const activeExperienceUids = experiences
            .filter(exp => exp.activeVariantShortUid !== null)
            .map(exp => exp.shortUid);
          
          if (activeExperienceUids.length > 0) {
            // Fire and forget - don't await, don't block
            sdk.triggerImpressions({ experienceShortUids: activeExperienceUids })
              .then(() => {
                console.log(`[Personalize] Impressions tracked:`, activeExperienceUids);
              })
              .catch(() => {
                // Silently ignore network errors - impression tracking is non-critical
              });
          }
        }
      } catch {
        // Silently fail - personalization tracking should never break the page
      }
    };

    // Run async without blocking
    initTracker();
  }, [variant]);

  return null;
}

