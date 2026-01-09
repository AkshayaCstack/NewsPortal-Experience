"use client";

import { useEffect, useState } from "react";
import ContentstackLivePreview from "@contentstack/live-preview-utils";
import Stack, { livePreviewConfig } from "@/contentstack-sdk";

// Get the appropriate Contentstack app host based on region
function getAppHost() {
  const region = process.env.NEXT_PUBLIC_CONTENTSTACK_REGION || 'NA';
  const hosts: Record<string, string> = {
    'NA': 'app.contentstack.com',
    'EU': 'eu-app.contentstack.com',
    'AZURE_NA': 'azure-na-app.contentstack.com',
    'AZURE_EU': 'azure-eu-app.contentstack.com',
    'GCP_NA': 'gcp-na-app.contentstack.com',
    'GCP_EU': 'gcp-eu-app.contentstack.com'
  };
  return hosts[region] || hosts['NA'];
}

export default function LivePreviewInit() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Debug: Log all config values
    console.log('[LivePreview] Configuration check:', {
      isEnabled: livePreviewConfig.enable,
      hasApiKey: !!livePreviewConfig.apiKey,
      apiKeyPrefix: livePreviewConfig.apiKey?.substring(0, 8) + '...',
      hasPreviewToken: !!livePreviewConfig.previewToken,
      environment: livePreviewConfig.environment,
      branch: livePreviewConfig.branch,
      host: getAppHost(),
    });

    // Check if we're in an iframe (Live Preview context)
    const isInIframe = typeof window !== 'undefined' && window.parent !== window;
    console.log('[LivePreview] Running in iframe:', isInIframe);

    // Only initialize if Live Preview is enabled
    if (!livePreviewConfig.enable) {
      console.log('[LivePreview] Live Preview is disabled. Set NEXT_PUBLIC_CONTENTSTACK_LIVE_PREVIEW_ENABLE=true');
      return;
    }

    // Validate required config
    if (!livePreviewConfig.apiKey) {
      console.error('[LivePreview] Missing NEXT_PUBLIC_CONTENTSTACK_API_KEY');
      return;
    }
    if (!livePreviewConfig.previewToken) {
      console.error('[LivePreview] Missing NEXT_PUBLIC_CONTENTSTACK_PREVIEW_TOKEN');
      return;
    }
    if (!livePreviewConfig.environment) {
      console.error('[LivePreview] Missing NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT');
      return;
    }

    // Prevent double initialization
    if (isInitialized) {
      console.log('[LivePreview] Already initialized, skipping');
      return;
    }

    try {
      console.log('[LivePreview] Initializing Live Preview SDK...');
      
      ContentstackLivePreview.init({
        enable: true,
        ssr: true,
        stackSdk: Stack,
        // Enable Edit Tags for in-page editing
        editButton: {
          enable: true,
        },
        stackDetails: {
          apiKey: livePreviewConfig.apiKey,
          environment: livePreviewConfig.environment,
          branch: livePreviewConfig.branch || 'main',
        },
        clientUrlParams: {
          protocol: "https",
          host: getAppHost(),
          port: 443,
        },
      });

      setIsInitialized(true);
      console.log('[LivePreview] ✓ Live Preview SDK initialized successfully');
    } catch (error) {
      console.error('[LivePreview] ✗ Error initializing Live Preview:', error);
    }
  }, [isInitialized]);

  // This component doesn't render anything visible
  return null;
}

