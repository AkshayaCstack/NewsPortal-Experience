"use client";

import dynamic from 'next/dynamic';

// Dynamically import the LivePreviewInit component to ensure it only runs client-side
const LivePreviewInit = dynamic(
  () => import('./LivePreviewInit'),
  { ssr: false }
);

interface LivePreviewWrapperProps {
  enabled?: boolean;
}

export default function LivePreviewWrapper({ enabled }: LivePreviewWrapperProps) {
  // Check both prop and environment variable
  const isEnabled = enabled ?? process.env.NEXT_PUBLIC_CONTENTSTACK_LIVE_PREVIEW_ENABLE === 'true';
  
  if (!isEnabled) {
    return null;
  }

  return <LivePreviewInit />;
}

