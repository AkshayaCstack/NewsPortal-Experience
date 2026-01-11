"use client";

import { useState } from "react";
import StorySubmissionModal from "./StorySubmissionModal";
import { useAuth } from "@/contexts/AuthContext";

interface WriteStoryButtonProps {
  locale: string;
  variant?: "default" | "primary" | "cta";
  buttonText?: string;
}

export default function WriteStoryButton({ locale, variant = "default", buttonText }: WriteStoryButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const { user, setShowAuthModal } = useAuth();

  const handleClick = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setShowModal(true);
  };

  const getButtonClass = () => {
    switch (variant) {
      case "primary":
        return "write-story-btn-primary";
      case "cta":
        return "write-story-btn-cta";
      default:
        return "write-story-btn";
    }
  };

  // Default text based on locale if not provided
  const defaultText = buttonText || "Write Your Story";

  return (
    <>
      <button className={getButtonClass()} onClick={handleClick}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
        </svg>
        <span>{defaultText}</span>
      </button>

      {showModal && (
        <StorySubmissionModal 
          locale={locale}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

