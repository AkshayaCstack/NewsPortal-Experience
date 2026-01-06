"use client";

import dynamic from 'next/dynamic';

// Dynamically import Walkthrough to avoid SSR issues with createPortal
const Walkthrough = dynamic(() => import('./Walkthrough'), { ssr: false });

interface WalkthroughStep {
  element_id: string;
  instruction_title: string;
  instruction_body?: any;
}

interface WalkthroughWrapperProps {
  welcomeTitle?: string;
  welcomeDescription?: string;
  buttonText?: string;
  steps?: WalkthroughStep[];
}

export default function WalkthroughWrapper({
  welcomeTitle,
  welcomeDescription,
  buttonText,
  steps = []
}: WalkthroughWrapperProps) {
  if (steps.length === 0) return null;

  return (
    <Walkthrough
      welcomeTitle={welcomeTitle}
      welcomeDescription={welcomeDescription}
      buttonText={buttonText}
      steps={steps}
    />
  );
}

