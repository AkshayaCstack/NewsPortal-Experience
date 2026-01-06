"use client";

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface WalkthroughStep {
  element_id: string;
  instruction_title: string;
  instruction_body?: any; // RTE content from CMS
}

interface WalkthroughProps {
  welcomeTitle?: string;
  welcomeDescription?: string;
  buttonText?: string;
  steps?: WalkthroughStep[];
  onComplete?: () => void;
}

// Helper to extract text from RTE
function getRteText(rteBody: any): string {
  if (!rteBody) return '';
  if (typeof rteBody === 'string') return rteBody;
  
  // Handle JSON RTE structure
  if (rteBody.children) {
    return rteBody.children.map((child: any) => {
      if (child.text) return child.text;
      if (child.children) return getRteText(child);
      return '';
    }).join(' ');
  }
  
  return '';
}

// Step descriptions fallback
const STEP_DESCRIPTIONS: Record<string, string> = {
  'breaking-news-section': 'Here appears the breaking stories across the globe and you can swipe through the cards to get immersed in the "breaking" world.',
  'authors-section': 'Here appears writers and you can browse through the profiles and stories published and follow them to get to know about your favourite authors.',
  'hero-section-split': 'The latest and popular news will appear here. You can toggle between latest and popular news and get updated with the recent happenings across the globe.',
  'featured-posts-section-unique': 'Get to know about the featured posts and later on the content will be tailored based on your interests. Swipe the cards to view more.',
  'header-search-trigger': 'Here exists our Algolia powered search empowered for CMS. You can search for whatever content you are interested in.',
};

export default function Walkthrough({
  welcomeTitle = "Hey! Welcome",
  welcomeDescription = "Let's have a quick look at the application to guide you",
  buttonText = "Start tour",
  steps = [],
  onComplete
}: WalkthroughProps) {
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1); // -1 = not started
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom');
  const [mounted, setMounted] = useState(false);

  // Check if walkthrough was already completed
  useEffect(() => {
    setMounted(true);
    try {
      const completed = localStorage.getItem('walkthrough_completed');
      if (!completed && steps.length > 0) {
        // Show welcome modal after a short delay
        setTimeout(() => setIsWelcomeOpen(true), 1000);
      }
    } catch (e) {
      // localStorage not available
      if (steps.length > 0) {
        setTimeout(() => setIsWelcomeOpen(true), 1000);
      }
    }
  }, [steps.length]);

  // Position tooltip relative to target element
  const updateTargetPosition = useCallback(() => {
    if (currentStep < 0 || currentStep >= steps.length) return;
    
    const step = steps[currentStep];
    const element = document.getElementById(step.element_id);
    
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
      
      // Determine best tooltip position
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      if (rect.bottom + 200 < viewportHeight) {
        setTooltipPosition('bottom');
      } else if (rect.top > 200) {
        setTooltipPosition('top');
      } else if (rect.left > viewportWidth / 2) {
        setTooltipPosition('left');
      } else {
        setTooltipPosition('right');
      }
      
      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStep, steps]);

  useEffect(() => {
    updateTargetPosition();
    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition);
    
    return () => {
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition);
    };
  }, [updateTargetPosition]);

  const startTour = () => {
    setIsWelcomeOpen(false);
    setTimeout(() => setCurrentStep(0), 300);
  };

  const skipTour = () => {
    setIsWelcomeOpen(false);
    setCurrentStep(-1);
    try {
      localStorage.setItem('walkthrough_completed', 'skipped');
    } catch (e) {}
    onComplete?.();
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTour = () => {
    setCurrentStep(-1);
    try {
      localStorage.setItem('walkthrough_completed', 'true');
    } catch (e) {}
    onComplete?.();
  };

  if (!mounted) return null;

  const currentStepData = currentStep >= 0 && currentStep < steps.length ? steps[currentStep] : null;
  const stepDescription = currentStepData 
    ? (getRteText(currentStepData.instruction_body) || STEP_DESCRIPTIONS[currentStepData.element_id] || '')
    : '';

  // Tooltip positioning
  const getTooltipStyle = () => {
    if (!targetRect) return {};
    
    const padding = 16;
    const tooltipWidth = 340;
    const tooltipHeight = 180;
    
    switch (tooltipPosition) {
      case 'bottom':
        return {
          top: targetRect.bottom + padding,
          left: Math.max(padding, Math.min(
            targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
            window.innerWidth - tooltipWidth - padding
          )),
        };
      case 'top':
        return {
          top: targetRect.top - tooltipHeight - padding,
          left: Math.max(padding, Math.min(
            targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
            window.innerWidth - tooltipWidth - padding
          )),
        };
      case 'left':
        return {
          top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          left: targetRect.left - tooltipWidth - padding,
        };
      case 'right':
        return {
          top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          left: targetRect.right + padding,
        };
      default:
        return {};
    }
  };

  // Welcome Modal
  const WelcomeModal = () => (
    <div className={`walkthrough-welcome-overlay ${isWelcomeOpen ? 'open' : ''}`}>
      <div className="walkthrough-welcome-modal">
        <div className="walkthrough-welcome-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4"/>
            <path d="M12 8h.01"/>
          </svg>
        </div>
        <h2 className="walkthrough-welcome-title">{welcomeTitle}</h2>
        <p className="walkthrough-welcome-desc">{welcomeDescription}</p>
        <div className="walkthrough-welcome-actions">
          <button className="walkthrough-skip-btn" onClick={skipTour}>
            Skip tour
          </button>
          <button className="walkthrough-start-btn" onClick={startTour}>
            <span>{buttonText}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
        <div className="walkthrough-welcome-steps">
          <span>{steps.length} quick steps</span>
          <span>•</span>
          <span>~1 min</span>
        </div>
      </div>
    </div>
  );

  // Tour Overlay with Spotlight
  const TourOverlay = () => {
    if (currentStep < 0 || !targetRect) return null;

    return (
      <>
        {/* Dark overlay with spotlight cutout */}
        <div className="walkthrough-overlay">
          <svg width="100%" height="100%">
            <defs>
              <mask id="spotlight-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white"/>
                <rect 
                  x={targetRect.left - 8}
                  y={targetRect.top - 8}
                  width={targetRect.width + 16}
                  height={targetRect.height + 16}
                  rx="12"
                  fill="black"
                />
              </mask>
            </defs>
            <rect 
              x="0" y="0" 
              width="100%" height="100%" 
              fill="rgba(0,0,0,0.75)" 
              mask="url(#spotlight-mask)"
            />
          </svg>
          
          {/* Spotlight border glow */}
          <div 
            className="walkthrough-spotlight"
            style={{
              left: targetRect.left - 8,
              top: targetRect.top - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
          />
        </div>

        {/* Tooltip */}
        <div 
          className={`walkthrough-tooltip walkthrough-tooltip-${tooltipPosition}`}
          style={getTooltipStyle()}
        >
          <div className="walkthrough-tooltip-header">
            <span className="walkthrough-step-badge">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          <h3 className="walkthrough-tooltip-title">{currentStepData?.instruction_title}</h3>
          <p className="walkthrough-tooltip-desc">{stepDescription}</p>
          <div className="walkthrough-tooltip-actions">
            <button 
              className="walkthrough-nav-btn prev"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back
            </button>
            <div className="walkthrough-progress">
              {steps.map((_, idx) => (
                <span 
                  key={idx} 
                  className={`progress-dot ${idx === currentStep ? 'active' : ''} ${idx < currentStep ? 'completed' : ''}`}
                />
              ))}
            </div>
            <button 
              className="walkthrough-nav-btn next"
              onClick={nextStep}
            >
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
          <button className="walkthrough-close-btn" onClick={skipTour} title="Skip tour">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </>
    );
  };

  return createPortal(
    <>
      <WelcomeModal />
      <TourOverlay />
    </>,
    document.body
  );
}

